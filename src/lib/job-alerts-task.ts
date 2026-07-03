// Geplande runner voor job-alerts: stuurt passende ZZP'ers een notificatie bij
// nieuw gepubliceerde opdrachten. Idempotent via DomainEvent dedupeKey.
// Plan/apply-patroon zoals runExpiryTask. Geen geldstroom.

import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { planJobAlerts, type JobAlertFreelancer, type JobAlertJob } from "@/lib/job-alerts";

export interface JobAlertsResult {
  alerted: number;
  jobs: number;
}

export async function runJobAlertsTask(opts?: {
  actorId?: string | null;
  now?: Date;
}): Promise<JobAlertsResult> {
  const now = opts?.now ?? new Date();

  const rawJobs = await prisma.job.findMany({
    where: { status: "PUBLISHED", alertedAt: null },
    include: {
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
      applications: { select: { freelancerId: true } },
      tenant: { select: { openOverflow: true } },
    },
  });
  if (rawJobs.length === 0) return { alerted: 0, jobs: 0 };

  const freelancerProfiles = await prisma.freelancerProfile.findMany({
    where: { user: { status: "ACTIVE" } },
    include: {
      skills: { select: { skillId: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      industries: { select: { industryId: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });

  const jobs: JobAlertJob[] = rawJobs.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    skills: j.skills,
    credentialRequirements: j.credentialRequirements.map((c) => ({
      credentialType: c.credentialType,
      required: c.required,
    })),
    rateMin: j.rateMin,
    rateMax: j.rateMax,
    workMode: j.workMode,
    location: j.location,
    industryId: j.industryId,
    tenantId: j.tenantId,
    openOverflow: j.tenant?.openOverflow ?? false,
    applicantProfileIds: j.applications.map((a) => a.freelancerId),
  }));

  const freelancers: JobAlertFreelancer[] = freelancerProfiles.map((p) => ({
    userId: p.userId,
    freelancerProfileId: p.id,
    headline: p.headline,
    bio: p.bio,
    skills: p.skills,
    credentials: p.credentials,
    hourlyRate: p.hourlyRate,
    workMode: p.workMode,
    location: p.location,
    maxTravelMinutes: p.maxTravelMinutes,
    availability: p.availability,
    tenantId: p.tenantId,
    availabilityWindows: p.availabilityWindows,
    industries: p.industries,
  }));

  const plan = planJobAlerts(jobs, freelancers, { now });

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
          type: "JOB_MATCH",
          actorRole: "SYSTEM",
          actorId: opts?.actorId ?? null,
          subjectType: "Job",
          subjectId: alert.jobId,
          payload: JSON.stringify({ userId: alert.userId, score: alert.score }),
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
          action: "JOB_ALERT_SENT",
          entityType: "Job",
          entityId: alert.jobId,
          metadata: { userId: alert.userId, score: alert.score },
        }),
      }),
    ]);
  }

  await prisma.job.updateMany({
    where: { id: { in: rawJobs.map((j) => j.id) } },
    data: { alertedAt: now },
  });

  return { alerted: fresh.length, jobs: rawJobs.length };
}
