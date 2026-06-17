// Geplande runner voor het job-engagement-signaal: waarschuwt de opdrachtgever bij een koude
// opdracht (lang open, weinig reacties). Idempotent via DomainEvent dedupeKey — per opdracht
// hooguit één waarschuwing. Plan/apply-patroon zoals runJobAlertsTask. Geen geldstroom.

import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { planJobEngagement, JOB_COLD_MIN_AGE_DAYS, type EngagementJob } from "@/lib/job-engagement";

export interface JobEngagementResult {
  alerted: number;
  jobs: number;
}

/** Bovengrens op het aantal opdrachten dat één run beoordeelt (begrenst het werk). */
const SCAN_LIMIT = 200;

export async function runJobEngagementTask(opts?: {
  actorId?: string | null;
  now?: Date;
}): Promise<JobEngagementResult> {
  const now = opts?.now ?? new Date();
  const cutoff = new Date(now.getTime() - JOB_COLD_MIN_AGE_DAYS * 24 * 60 * 60 * 1000);

  // Alleen gepubliceerde opdrachten die al minstens de drempel-leeftijd open staan; nieuwer dan dat
  // kan per definitie niet koud zijn. publishedAt niet-null afgedwongen door de lte-vergelijking.
  const rawJobs = await prisma.job.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: cutoff } },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      company: { select: { userId: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { publishedAt: "asc" },
    take: SCAN_LIMIT,
  });
  if (rawJobs.length === 0) return { alerted: 0, jobs: 0 };

  const jobs: EngagementJob[] = rawJobs.map((j) => ({
    id: j.id,
    title: j.title,
    ownerUserId: j.company.userId,
    publishedAt: j.publishedAt,
    applicationCount: j._count.applications,
  }));

  const plan = planJobEngagement(jobs, { now });

  const keys = plan.alerts.map((a) => a.dedupeKey);
  const existingKeys =
    keys.length > 0
      ? new Set(
          (
            await prisma.domainEvent.findMany({
              where: { dedupeKey: { in: keys } },
              select: { dedupeKey: true },
            })
          ).map((e) => e.dedupeKey),
        )
      : new Set<string>();

  const fresh = plan.alerts.filter((a) => !existingKeys.has(a.dedupeKey));

  for (const alert of fresh) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "JOB_COLD",
          actorRole: "SYSTEM",
          actorId: opts?.actorId ?? null,
          subjectType: "Job",
          subjectId: alert.jobId,
          payload: JSON.stringify({
            userId: alert.userId,
            ageDays: alert.ageDays,
            applicationCount: alert.applicationCount,
          }),
          correlationId: null,
          dedupeKey: alert.dedupeKey,
        },
      }),
      prisma.notification.create({
        data: {
          userId: alert.userId,
          type: alert.notificationType,
          title: alert.title,
          body: alert.body,
          link: alert.link,
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts?.actorId ?? null,
          action: "JOB_ENGAGEMENT_ALERT_SENT",
          entityType: "Job",
          entityId: alert.jobId,
          metadata: { userId: alert.userId, ageDays: alert.ageDays },
        }),
      }),
    ]);
  }

  return { alerted: fresh.length, jobs: rawJobs.length };
}
