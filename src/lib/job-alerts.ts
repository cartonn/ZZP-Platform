// Geplande job-alert-planner (PLATFORM_OVERHAUL backlog): stuurt ZZP'ers een notificatie
// als er een nieuwe PUBLISHED opdracht is die bij hun profiel past. Pure planner — de runner
// (`job-alerts-task.ts`) verzorgt DB-toegang en idempotentie. Geen geldstroom.

import { scoreJobForFreelancer } from "@/lib/matching";

export const JOB_ALERT_THRESHOLD = 70;

export interface JobAlertJob {
  id: string;
  title: string;
  /** Opdrachtomschrijving — voedt (met de headline/bio van de ZZP'er) de inhoudelijke aansluiting. */
  description?: string | null;
  skills: readonly { skillId: string; required: boolean }[];
  credentialRequirements: readonly { credentialType: string; required: boolean }[];
  rateMin: number | null;
  rateMax: number | null;
  workMode: string;
  location: string | null;
  /** Branche van de opdracht — voedt de branche-factor in de matchscore. */
  industryId?: string | null;
  /** Tenant-zichtbaarheid: een franchise-dienst alert alleen de eigen roster, tenzij opengezet. */
  tenantId: string | null;
  openOverflow: boolean;
  /** FreelancerProfile.id's die al een reactie op dit job hebben ingediend. */
  applicantProfileIds: readonly string[];
}

export interface JobAlertFreelancer {
  userId: string;
  freelancerProfileId: string;
  /** Functietitel/headline — voedt (met bio + opdrachttekst) de inhoudelijke aansluiting. */
  headline?: string | null;
  /** Bio — voedt de inhoudelijke aansluiting. */
  bio?: string | null;
  skills: readonly { skillId: string }[];
  credentials: readonly { type: string; status: string; expiresAt: Date | null }[];
  hourlyRate: number | null;
  workMode: string;
  location: string | null;
  maxTravelMinutes?: number | null;
  availability: string;
  /** Franchise-lidmaatschap; null = directe platform-ZZP'er. */
  tenantId: string | null;
  availabilityWindows?: readonly { startDate: Date; endDate: Date; type: string }[];
  /** Branche(s) van het profiel — voedt de branche-factor in de matchscore. */
  industries?: readonly { industryId: string }[];
}

/** Mag deze ZZP'er deze opdracht zien? Eigen-tenant of een opengestelde (overflow) dienst. */
function freelancerCanSeeJob(freelancerTenantId: string | null, job: JobAlertJob): boolean {
  return job.openOverflow || (freelancerTenantId ?? null) === job.tenantId;
}

export interface JobAlertItem {
  jobId: string;
  userId: string;
  score: number;
  dedupeKey: string;
  notificationType: "JOB_MATCH";
  title: string;
  body: string;
  link: string;
}

export interface JobAlertPlan {
  alerts: JobAlertItem[];
}

/**
 * Berekent welke ZZP'ers een alert krijgen voor nieuw gepubliceerde opdrachten.
 * Slaat ZZP'ers over die al gereageerd hebben of niet boven de drempel scoren.
 * Idempotentie-dedup via dedupeKey regelt de runner.
 */
export function planJobAlerts(
  jobs: readonly JobAlertJob[],
  freelancers: readonly JobAlertFreelancer[],
  opts?: { threshold?: number; now?: Date },
): JobAlertPlan {
  const threshold = opts?.threshold ?? JOB_ALERT_THRESHOLD;
  const now = opts?.now ?? new Date();
  const alerts: JobAlertItem[] = [];

  for (const job of jobs) {
    const applicantSet = new Set(job.applicantProfileIds);

    for (const freelancer of freelancers) {
      if (applicantSet.has(freelancer.freelancerProfileId)) continue;
      // Geen alert voor een opdracht buiten de tenant-scope van de ZZP'er.
      if (!freelancerCanSeeJob(freelancer.tenantId ?? null, job)) continue;

      const result = scoreJobForFreelancer(job, freelancer, now);
      if (result.score < threshold) continue;

      alerts.push({
        jobId: job.id,
        userId: freelancer.userId,
        score: result.score,
        dedupeKey: `job-alert:${job.id}:${freelancer.userId}`,
        notificationType: "JOB_MATCH",
        title: `Nieuwe opdracht: ${job.title}`,
        body: `Er is een opdracht die bij je past (score ${result.score}/100). Bekijk de details en reageer als je geïnteresseerd bent.`,
        link: `/opdrachten/${job.id}`,
      });
    }
  }

  return { alerts };
}
