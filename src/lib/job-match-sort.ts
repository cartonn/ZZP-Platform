// Sorteren van opdrachten op persoonlijke matchscore (ZZP'er). Pure, deterministische functie —
// server-side de waarheid. De matchscore zelf komt uit `scoreJobForFreelancer` (matching.ts); dit
// bestand bepaalt alléén de volgorde: hoogste score eerst, bij gelijke score de nieuwste opdracht
// eerst (recentst gepubliceerd). Zo krijgt de ZZP'er bovenaan wat het best én het meest actueel past.

export interface ScoredJob<T> {
  job: T;
  /** Persoonlijke matchscore 0–100 (uit scoreJobForFreelancer). */
  score: number;
  /** Publicatiemoment; tie-break bij gelijke score (nieuwer eerst). Null sorteert achteraan. */
  publishedAt: Date | null;
}

/** Publicatietijd als sorteersleutel; ontbrekende datum telt als "oudst" (achteraan). */
function publishedTime(d: Date | null): number {
  return d ? d.getTime() : 0;
}

/**
 * Sorteert gescoorde opdrachten: hoogste matchscore eerst, bij gelijke score de nieuwste eerst.
 * Muteert de invoer niet (werkt op een kopie); stabiel genoeg door de expliciete tie-break.
 */
export function sortJobsByMatch<T>(scored: ScoredJob<T>[]): T[] {
  return [...scored]
    .sort(
      (a, b) => b.score - a.score || publishedTime(b.publishedAt) - publishedTime(a.publishedAt),
    )
    .map((s) => s.job);
}
