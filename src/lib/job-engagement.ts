// Job-engagement-signaal (spiegelbeeld van job-alerts): waarschuwt de OPDRACHTGEVER wanneer
// een gepubliceerde opdracht "koud" blijft — lang open zonder noemenswaardige respons. Job-alerts
// duwt passende ZZP'ers naar een nieuwe opdracht; deze planner duwt de opdrachtgever een seintje
// dat zijn opdracht weinig reacties trekt (tarief/zichtbaarheid/skill-mismatch), zodat hij kan
// bijsturen i.p.v. blind te wachten. Pure planner — de runner (`job-engagement-task.ts`) verzorgt
// DB-toegang en idempotentie. Geen geldstroom, geen schemawijziging.

/** Minimale leeftijd (dagen sinds publicatie) voordat een opdracht "koud" kan zijn. */
export const JOB_COLD_MIN_AGE_DAYS = 7;
/** Maximaal aantal reacties waaronder een opdracht als koud telt (drempel = "minder dan 3"). */
export const JOB_COLD_MAX_APPLICATIONS = 2;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface EngagementJob {
  id: string;
  title: string;
  /** Eigenaar van de opdracht (Company.userId) — ontvanger van het signaal. */
  ownerUserId: string;
  /** null = nog niet gepubliceerd; zo'n opdracht telt nooit als koud. */
  publishedAt: Date | null;
  /** Aantal reacties (Application) op deze opdracht. */
  applicationCount: number;
}

export interface ColdJobAlert {
  jobId: string;
  userId: string;
  ageDays: number;
  applicationCount: number;
  dedupeKey: string;
  notificationType: "JOB_COLD";
  title: string;
  body: string;
  link: string;
}

export interface JobEngagementPlan {
  alerts: ColdJobAlert[];
}

/** Hele dagen tussen `from` en `now` (vloer, nooit negatief). */
export function jobAgeInDays(from: Date, now: Date): number {
  const diff = now.getTime() - from.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_PER_DAY);
}

/**
 * Bepaalt welke opdrachten koud zijn en de eigenaar een signaal verdienen. Een opdracht is koud
 * wanneer hij minstens `minAgeDays` geleden is gepubliceerd én niet meer dan `maxApplications`
 * reacties heeft. De dedupeKey is per opdracht uniek, zodat de runner per opdracht hooguit één keer
 * waarschuwt (geen herhaald gezeur). Niet-gepubliceerde opdrachten worden genegeerd.
 */
export function planJobEngagement(
  jobs: readonly EngagementJob[],
  opts?: { now?: Date; minAgeDays?: number; maxApplications?: number },
): JobEngagementPlan {
  const now = opts?.now ?? new Date();
  const minAgeDays = opts?.minAgeDays ?? JOB_COLD_MIN_AGE_DAYS;
  const maxApplications = opts?.maxApplications ?? JOB_COLD_MAX_APPLICATIONS;
  const alerts: ColdJobAlert[] = [];

  for (const job of jobs) {
    if (job.publishedAt === null) continue;
    if (job.applicationCount > maxApplications) continue;

    const ageDays = jobAgeInDays(job.publishedAt, now);
    if (ageDays < minAgeDays) continue;

    const reactieLabel =
      job.applicationCount === 0
        ? "nog geen reacties"
        : job.applicationCount === 1
          ? "pas één reactie"
          : `pas ${job.applicationCount} reacties`;

    alerts.push({
      jobId: job.id,
      userId: job.ownerUserId,
      ageDays,
      applicationCount: job.applicationCount,
      dedupeKey: `job-cold:${job.id}`,
      notificationType: "JOB_COLD",
      title: `Weinig reacties op "${job.title}"`,
      body: `Je opdracht staat ${ageDays} dagen open met ${reactieLabel}. Bekijk of het tarief, de vereisten of de zichtbaarheid de respons in de weg zitten.`,
      link: `/opdrachten/${job.id}`,
    });
  }

  return { alerts };
}
