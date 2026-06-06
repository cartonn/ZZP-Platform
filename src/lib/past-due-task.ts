// Geplande runner voor de PAST_DUE-abonnementsladder. Herinnert op dag 1/3/7 en downgradet daarna
// naar Gratis. Idempotent via DomainEvent dedupeKey. Plan/apply zoals runExpiryTask. Geen geldstroom
// — alleen statusregistratie + signalering. De webhook zet PAST_DUE + pastDueAt; deze taak verwerkt.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planPastDue, type PastDueCandidate } from "@/lib/past-due";
import { SUBSCRIPTION_TRANSITIONS, type SubscriptionStatus } from "@/lib/enums";

export interface PastDueResult {
  reminded: number;
  downgraded: number;
}

export async function runSubscriptionPastDueTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<PastDueResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.subscription.findMany({
    where: { status: "PAST_DUE" },
    select: { id: true, userId: true, pastDueAt: true, updatedAt: true },
  });
  const candidates: PastDueCandidate[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    pastDueAt: r.pastDueAt,
    updatedAt: r.updatedAt,
  }));

  const plan = planPastDue(candidates, now);
  if (plan.reminders.length === 0 && plan.downgrades.length === 0) {
    return { reminded: 0, downgraded: 0 };
  }

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  const keys = [
    ...plan.reminders.map((r) => r.dedupeKey),
    ...plan.downgrades.map((d) => d.dedupeKey),
  ];
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const freshReminders = plan.reminders.filter((r) => !seen.has(r.dedupeKey));
  const freshDowngrades = plan.downgrades.filter((d) => !seen.has(d.dedupeKey));

  for (const r of freshReminders) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "SUBSCRIPTION_PAST_DUE_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Subscription",
          subjectId: r.subscriptionId,
          payload: JSON.stringify({ day: r.day }),
          correlationId: null,
          dedupeKey: r.dedupeKey,
        },
      }),
      prisma.notification.create({
        data: {
          userId: r.userId,
          type: "SUBSCRIPTION_PAST_DUE",
          title: "Betaling mislukt — actie nodig",
          body: "Je laatste abonnementsbetaling is mislukt. Werk je betaalgegevens bij om je abonnement te behouden.",
          link: "/abonnement",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "SUBSCRIPTION_PAST_DUE_REMINDER",
          entityType: "Subscription",
          entityId: r.subscriptionId,
          metadata: { day: r.day },
        }),
      }),
    ]);
  }

  let downgraded = 0;
  for (const d of freshDowngrades) {
    // Defensief: PAST_DUE → CANCELLED moet een geldige overgang zijn (CLAUDE.md regel 3).
    if (!SUBSCRIPTION_TRANSITIONS.PAST_DUE.includes("CANCELLED" as SubscriptionStatus)) continue;
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "SUBSCRIPTION_DOWNGRADED",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Subscription",
          subjectId: d.subscriptionId,
          correlationId: null,
          dedupeKey: d.dedupeKey,
        },
      }),
      // Status CANCELLED → de user valt terug op Gratis (getActivePlanKey behandelt niet-ACTIVE als FREE).
      prisma.subscription.update({
        where: { id: d.subscriptionId },
        data: { status: "CANCELLED", pastDueAt: null },
      }),
      prisma.notification.create({
        data: {
          userId: d.userId,
          type: "SUBSCRIPTION_DOWNGRADED",
          title: "Abonnement teruggezet naar Gratis",
          body: "Na een mislukte betaling staat je account weer op Gratis. Je kunt op elk moment opnieuw een abonnement kiezen.",
          link: "/abonnement",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "SUBSCRIPTION_DOWNGRADED",
          entityType: "Subscription",
          entityId: d.subscriptionId,
          metadata: { from: "PAST_DUE", to: "CANCELLED", reason: "payment_failed" },
        }),
      }),
    ]);
    downgraded += 1;
  }

  return { reminded: freshReminders.length, downgraded };
}
