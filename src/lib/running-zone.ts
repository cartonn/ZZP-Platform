/**
 * "Wat loopt er nu"-zone op het dashboard: bewust begrensd tot de meest recent
 * bewogen samenwerkingen (audit T3 — geen onbegrensde lijstqueries op het dashboard).
 * De volledige, gepagineerde lijst leeft op /samenwerkingen; het dashboard toont
 * alleen wat telt en verwijst eerlijk door zodra er meer loopt dan de zone laat zien.
 */

/** Maximaal aantal kaarten in de zone — zelfde grens voor elke rol. */
export const RUNNING_ZONE_LIMIT = 6;

export interface RunningZonePlan {
  /** Lopende samenwerkingen die buiten de zone vallen (voor de doorverwijs-tegel). */
  overflow: number;
  /**
   * Weekoverzicht alleen bij ≥ 2 lopende samenwerkingen én volledige data —
   * met een afgekapte set zou de "Deze week"-telling liegen.
   */
  showWeek: boolean;
}

export function runningZonePlan(
  total: number,
  limit: number = RUNNING_ZONE_LIMIT,
): RunningZonePlan {
  return {
    overflow: Math.max(0, total - limit),
    showWeek: total >= 2 && total <= limit,
  };
}
