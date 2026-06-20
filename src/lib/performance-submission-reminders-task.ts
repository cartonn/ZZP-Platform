// Geplande runner voor de open-urenstaat-herinneringen (§4, stap vóór Event B1). Herinnert de ZZP'er
// aan een lopende uurtarief-samenwerking waarvan de laatste ingediende prestatie al dit aantal dagen
// geleden is en er niets meer in concept/ter beoordeling staat. Idempotent via DomainEvent dedupeKey.
// Plan/apply zoals runConceptInvoiceReminderTask. In-app notificatie; geen geldstroom.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planPerformanceSubmissionReminders,
  type PerformanceSubmissionCandidate,
} from "@/lib/performance-submission-reminders";

export interface PerformanceSubmissionReminderResult {
  reminded: number;
}

/** Ruime cap: het is een aggregaat-scan, voorkom onbegrensde load op grote datasets. */
const ACTIVE_COLLAB_CAP = 1000;

export async function runPerformanceSubmissionReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<PerformanceSubmissionReminderResult> {
  const now = opts.now ?? new Date();

  const collabs = await prisma.collaboration.findMany({
    where: { status: "ACTIVE", contractStatus: "SIGNED" },
    select: {
      id: true,
      freelancer: { select: { userId: true } },
      job: { select: { title: true } },
      performances: {
        select: { type: true, status: true, submittedAt: true },
      },
    },
    take: ACTIVE_COLLAB_CAP,
  });

  const candidates: PerformanceSubmissionCandidate[] = collabs.map((c) => {
    let lastHoursSubmittedAt: Date | null = null;
    let hasOpenSubmission = false;
    for (const p of c.performances) {
      if (p.status === "DRAFT" || p.status === "SUBMITTED") hasOpenSubmission = true;
      if (
        p.type === "HOURS" &&
        p.status === "APPROVED" &&
        p.submittedAt &&
        (!lastHoursSubmittedAt || p.submittedAt > lastHoursSubmittedAt)
      ) {
        lastHoursSubmittedAt = p.submittedAt;
      }
    }
    return {
      collaborationId: c.id,
      freelancerUserId: c.freelancer.userId,
      jobTitle: c.job.title,
      lastHoursSubmittedAt,
      hasOpenSubmission,
    };
  });

  const plan = planPerformanceSubmissionReminders(candidates, now);
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
          type: "PERFORMANCE_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Collaboration",
          subjectId: r.collaborationId,
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
          link: `/samenwerkingen/${r.collaborationId}`,
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "PERFORMANCE_SUBMISSION_REMINDER",
          entityType: "Collaboration",
          entityId: r.collaborationId,
          metadata: { stage: r.stage },
        }),
      }),
    ]);
  }

  return { reminded: fresh.length };
}
