// Pure planner voor job-match notificaties (PLATFORM_OVERHAUL.md §2 proactief).
// Wanneer een opdracht gepubliceerd wordt, worden passende ZZP'ers proactief op de
// hoogte gesteld. Hergebruikt de bestaande matchscore-drempel. Geen black box:
// filtering en sortering zijn expliciet en testbaar los van de DB.

/** Minimale matchscore om een job-alert te sturen. Gelijk aan MATCH_MIN_SCORE. */
export const JOB_ALERT_MIN_SCORE = 70;
/** Maximaal aantal ZZP'ers dat gescoord wordt per opdracht (begrenst het werk). */
export const JOB_ALERT_SCAN_LIMIT = 200;
/** Maximaal aantal jobs dat per taakrun verwerkt wordt. */
export const JOB_ALERT_BATCH_SIZE = 20;

export interface JobAlertCandidate {
  profileId: string;
  userId: string;
  score: number;
  hasApplied: boolean;
}

export interface JobAlertRecipient {
  profileId: string;
  userId: string;
  score: number;
}

/**
 * Bepaalt welke ZZP'ers een job-alert moeten ontvangen.
 * Pure functie: uitsluitend filtering en sortering, geen DB-toegang.
 * - Sluit uit: te lage score, al gereageerd.
 * - Sorteert aflopend op score.
 */
export function planJobAlerts(
  candidates: readonly JobAlertCandidate[],
  opts: { minScore?: number } = {},
): JobAlertRecipient[] {
  const min = opts.minScore ?? JOB_ALERT_MIN_SCORE;
  return candidates
    .filter((c) => c.score >= min && !c.hasApplied)
    .sort((a, b) => b.score - a.score)
    .map(({ profileId, userId, score }) => ({ profileId, userId, score }));
}
