// Taakrunner voor job-match notificaties. Verwerkt nieuw gepubliceerde opdrachten
// (jobAlertsSentAt IS NULL) en stuurt in-app notificaties + e-mail aan ZZP'ers met
// een voldoende matchscore. Idempotent: verwerkte jobs krijgen jobAlertsSentAt.
// Geld loopt nooit via het platform (Besluit 1); dit is signalering, geen transactie.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { scoreJobForFreelancer } from "@/lib/matching";
import {
  JOB_ALERT_BATCH_SIZE,
  JOB_ALERT_SCAN_LIMIT,
  planJobAlerts,
  type JobAlertCandidate,
} from "@/lib/job-alerts";
import { getMailSender } from "@/lib/services/mail-sender";
import { buildJobMatchEmail } from "@/lib/services/reminder-emails";

export interface JobAlertsResult {
  jobsProcessed: number;
  notificationsSent: number;
}

export async function runJobAlertsTask(opts: {
  actorId?: string | null;
  /** Verwerk alleen deze specifieke opdracht (bv. direct na publicatie). */
  jobId?: string;
}): Promise<JobAlertsResult> {
  const where = {
    status: "PUBLISHED",
    jobAlertsSentAt: null,
    ...(opts.jobId ? { id: opts.jobId } : {}),
  };

  const jobs = await prisma.job.findMany({
    where,
    include: {
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
      company: { select: { name: true } },
    },
    take: JOB_ALERT_BATCH_SIZE,
    orderBy: { publishedAt: "asc" },
  });

  if (jobs.length === 0) return { jobsProcessed: 0, notificationsSent: 0 };

  // Laad actieve ZZP'ers met alles wat nodig is voor scoring.
  const freelancers = await prisma.freelancerProfile.findMany({
    where: { user: { status: "ACTIVE", role: "FREELANCER" } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      skills: { select: { skillId: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
      applications: { select: { jobId: true } },
    },
    take: JOB_ALERT_SCAN_LIMIT,
  });

  const loginUrl = process.env.NEXTAUTH_URL ?? "https://app.zzp-platform.nl";
  const mail = getMailSender();
  let totalNotifications = 0;

  for (const job of jobs) {
    const appliedSet = new Set(
      freelancers.flatMap((f) => f.applications.filter((a) => a.jobId === job.id).map(() => f.id)),
    );

    const candidates: JobAlertCandidate[] = freelancers.map((f) => ({
      profileId: f.id,
      userId: f.user.id,
      score: scoreJobForFreelancer(job, f).score,
      hasApplied: appliedSet.has(f.id),
    }));

    const recipients = planJobAlerts(candidates);

    await prisma.$transaction(async (tx) => {
      for (const r of recipients) {
        await tx.notification.create({
          data: {
            userId: r.userId,
            type: "JOB_MATCH",
            title: "Nieuwe opdracht die bij je past",
            body: `"${job.title}" bij ${job.company.name} — ${r.score}% match`,
            link: `/opdrachten/${job.id}`,
          },
        });
      }
      if (recipients.length > 0) {
        await tx.auditLog.create({
          data: auditData({
            actorId: opts.actorId ?? null,
            action: "JOB_ALERTS_SENT",
            entityType: "Job",
            entityId: job.id,
            metadata: { recipients: recipients.length },
          }),
        });
      }
      await tx.job.update({
        where: { id: job.id },
        data: { jobAlertsSentAt: new Date() },
      });
    });

    totalNotifications += recipients.length;

    // E-mail per ontvanger; individuele fouten breken de rest niet af.
    for (const r of recipients) {
      const fl = freelancers.find((f) => f.id === r.profileId);
      if (!fl) continue;
      try {
        await mail.send(
          buildJobMatchEmail({
            name: fl.user.name,
            email: fl.user.email,
            jobTitle: job.title,
            companyName: job.company.name,
            matchScore: r.score,
            jobUrl: `${loginUrl}/opdrachten/${job.id}`,
          }),
        );
      } catch (err) {
        console.error("[job-alerts-task] e-mail mislukt:", err);
      }
    }
  }

  return { jobsProcessed: jobs.length, notificationsSent: totalNotifications };
}
