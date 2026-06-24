// Budgetpassendheid van een tariefvoorstel: vergelijkt de door de ZZP'er voorgestelde rate
// (de werkelijke vraag voor déze opdracht) met het gepubliceerde budget van de opdracht
// (rateMin..rateMax). Beslis-hulp voor de opdrachtgever op /kandidaten — los van de matchmotor,
// die het profiel-`hourlyRate` gebruikt en niet de `proposedRate` van de reactie.
//
// Puur en deterministisch: geen DB, geen tijd, muteert niets.

export type RateBudgetFit = "within" | "below" | "above" | "unknown";

/**
 * Classificeert een tariefvoorstel t.o.v. het opdrachtbudget.
 *
 * - `unknown`  — geen voorstel, of de opdracht heeft helemaal geen budgetgrenzen.
 * - `above`    — voorstel boven het plafond (rateMax) → over budget (actiepunt).
 * - `below`    — voorstel onder de bodem (rateMin) → goedkoper dan gevraagd.
 * - `within`   — voorstel valt binnen [rateMin, rateMax] (grenzen inclusief).
 *
 * Het plafond (above) gaat vóór de bodem (below): als er alleen een rateMax is en het
 * voorstel ligt erboven, is dat het signaal. Eén grens volstaat — de andere mag ontbreken.
 */
export function classifyProposedRateFit(
  proposedRate: number | null | undefined,
  rateMin: number | null | undefined,
  rateMax: number | null | undefined,
): RateBudgetFit {
  if (proposedRate == null) return "unknown";
  if (rateMin == null && rateMax == null) return "unknown";
  if (rateMax != null && proposedRate > rateMax) return "above";
  if (rateMin != null && proposedRate < rateMin) return "below";
  return "within";
}

export const RATE_FIT_LABEL: Record<Exclude<RateBudgetFit, "unknown">, string> = {
  within: "Binnen budget",
  below: "Onder budget",
  above: "Boven budget",
};

export type RateFitBadgeVariant = "success" | "muted" | "warning";

export const RATE_FIT_VARIANT: Record<Exclude<RateBudgetFit, "unknown">, RateFitBadgeVariant> = {
  within: "success",
  below: "muted",
  above: "warning",
};
