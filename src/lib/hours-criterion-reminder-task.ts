// Geplande runner voor de proactieve urencriterium-herinnering.
// Draait alleen in H2/Q4 (planner-checkpoint) en alleen voor ZZP'ers met de IB_VOORBEREIDING-feature
// (dezelfde poort als de ontzorgd-hub waar de nudge naartoe linkt — geen melding die op een paywall
// eindigt). Per gerechtigde ZZP'er telt hij de directe uren (goedgekeurde prestaties) + indirecte uren
// van dit jaar, laat de pure planner beslissen wie op koers ligt om de 1.225-uur grens te missen, en
// stuurt de overgeblevenen een in-app notificatie. Plan/apply zoals runVatReminderTask; idempotent via
// DomainEvent dedupeKey. Geen geldstroom, geen schemawijziging.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { usersWithEntitlement } from "@/lib/entitlement-guard";
import {
  hoursCriterionCheckpoint,
  planHoursCriterionReminders,
  type HoursCriterionReminderCandidate,
} from "@/lib/hours-criterion-reminder";

export interface HoursCriterionReminderResult {
  reminded: number;
}

export async function runHoursCriterionReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<HoursCriterionReminderResult> {
  const now = opts.now ?? new Date();

  // Buiten het herinneringsvenster (jan–jun) geen enkele query — de planner zou toch niets opleveren.
  if (!hoursCriterionCheckpoint(now)) return { reminded: 0 };

  const freelancers = await prisma.user.findMany({
    where: { role: "FREELANCER", status: "ACTIVE" },
    select: { id: true },
  });
  if (freelancers.length === 0) return { reminded: 0 };

  // Poort op de IB_VOORBEREIDING-feature (batch, één query) — alleen wie het instrument heeft.
  const gated = await usersWithEntitlement(
    freelancers.map((f) => f.id),
    "IB_VOORBEREIDING",
  );
  if (gated.size === 0) return { reminded: 0 };

  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  // Per gerechtigde ZZP'er de directe + indirecte uren van dit jaar (dezelfde aggregaten als het
  // ontzorgd-paneel). Begrensd tot de betalende set; exacte som, geen unbounded findMany.
  const candidates: HoursCriterionReminderCandidate[] = [];
  for (const f of freelancers) {
    if (!gated.has(f.id)) continue;
    const [dir, ind] = await Promise.all([
      prisma.performance.aggregate({
        _sum: { hours: true },
        where: {
          status: "APPROVED",
          type: "HOURS",
          collaboration: { freelancer: { userId: f.id } },
          approvedAt: { gte: yearStart, lte: yearEnd },
        },
      }),
      prisma.indirectHoursEntry.aggregate({
        _sum: { hours: true },
        where: { userId: f.id, workedOn: { gte: yearStart, lte: yearEnd } },
      }),
    ]);
    candidates.push({
      userId: f.id,
      directHours: Math.round(dir._sum.hours ?? 0),
      indirectHours: Math.round(ind._sum.hours ?? 0),
    });
  }

  const plan = planHoursCriterionReminders(candidates, now);
  if (plan.reminders.length === 0) return { reminded: 0 };

  // Idempotentie: filter al-gevuurde herinneringen weg op DomainEvent dedupeKey.
  const keys = plan.reminders.map((r) => r.dedupeKey);
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.reminders.filter((r) => !seen.has(r.dedupeKey));
  if (fresh.length === 0) return { reminded: 0 };

  for (const r of fresh) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "HOURS_CRITERION_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "User",
          subjectId: r.userId,
          payload: JSON.stringify({ year: r.year, checkpoint: r.checkpoint }),
          correlationId: null,
          dedupeKey: r.dedupeKey,
        },
      }),
      prisma.notification.create({
        data: {
          userId: r.userId,
          type: r.notificationType,
          title: r.title,
          body: r.body,
          link: "/financien?tab=ontzorgd",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "HOURS_CRITERION_REMINDER_SENT",
          entityType: "User",
          entityId: r.userId,
          metadata: { year: r.year, checkpoint: r.checkpoint, remainingHours: r.remainingHours },
        }),
      }),
    ]);
  }

  return { reminded: fresh.length };
}
