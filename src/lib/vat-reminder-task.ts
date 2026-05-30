// Geplande runner voor de kwartaal-BTW-herinnering (backlog item 6).
// Laadt alle actieve ZZP'ers, filtert weg wat al herinnerd is (dedupeKey), en stuurt
// de overgeblevenen een notificatie. Plan/apply zoals runExpiryTask. Geen geldstroom.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planVatReminders } from "@/lib/vat-reminder";

export interface VatReminderResult {
  reminded: number;
}

export async function runVatReminderTask(opts: { actorId?: string | null; now?: Date }): Promise<VatReminderResult> {
  const now = opts.now ?? new Date();

  const freelancers = await prisma.user.findMany({
    where: { role: "FREELANCER", status: "ACTIVE" },
    select: { id: true },
  });

  const plan = planVatReminders(freelancers.map((u) => ({ userId: u.id })), now);
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
          type: "VAT_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "User",
          subjectId: r.userId,
          payload: JSON.stringify({ quarter: r.quarter, year: r.year }),
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
          link: "/administratie",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "VAT_REMINDER_SENT",
          entityType: "User",
          entityId: r.userId,
          metadata: { quarter: r.quarter, year: r.year },
        }),
      }),
    ]);
  }

  return { reminded: fresh.length };
}
