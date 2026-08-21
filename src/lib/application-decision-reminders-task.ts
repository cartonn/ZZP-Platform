// Geplande runner voor de kandidaat-beslissing-reminders: herinnert de opdrachtgever aan een
// reeds-bekeken kandidaat (VIEWED/SHORTLIST) die al langer dan gebruikelijk op een beslissing wacht.
// Idempotent via DomainEvent dedupeKey. Plan/apply-patroon zoals runPerformanceApprovalReminderTask.
// Geen geldstroom.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planApplicationDecisionReminders,
  type ApplicationDecisionCandidate,
} from "@/lib/application-decision-reminders";

export interface ApplicationDecisionReminderResult {
  reminded: number;
}

/** Bovengrens op het aantal reacties dat één run beoordeelt (begrenst het werk). */
const SCAN_LIMIT = 500;

export async function runApplicationDecisionReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<ApplicationDecisionReminderResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.application.findMany({
    where: {
      status: { in: ["VIEWED", "SHORTLIST"] },
      collaboration: null, // nog geen samenwerking → beslissen is nog aan de orde
      job: { status: "PUBLISHED" },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      job: {
        select: {
          title: true,
          status: true,
          company: { select: { userId: true } },
        },
      },
    },
    // Oudste reactie eerst: zonder orderBy is de selectie boven de cap ongedefinieerd en kan een
    // reactie structureel buiten de SCAN_LIMIT vallen (starvation).
    orderBy: { createdAt: "asc" },
    take: SCAN_LIMIT,
  });

  const candidates: ApplicationDecisionCandidate[] = rows
    .filter((r) => r.job?.company?.userId)
    .map((r) => ({
      applicationId: r.id,
      status: r.status,
      createdAt: r.createdAt,
      hasCollaboration: false, // where filtert collaboration: null al weg
      jobStatus: r.job.status,
      clientUserId: r.job.company.userId,
      jobTitle: r.job.title,
    }));

  const plan = planApplicationDecisionReminders(candidates, now);
  if (plan.reminders.length === 0) return { reminded: 0 };

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  const keys = plan.reminders.map((r) => r.dedupeKey);
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.reminders.filter((r) => !seen.has(r.dedupeKey));

  for (const r of fresh) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "APPLICATION_DECISION_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Application",
          subjectId: r.applicationId,
          payload: JSON.stringify({ stage: r.stage }),
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
          link: "/kandidaten",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "APPLICATION_DECISION_REMINDER",
          entityType: "Application",
          entityId: r.applicationId,
          metadata: { stage: r.stage },
        }),
      }),
    ]);
  }

  return { reminded: fresh.length };
}
