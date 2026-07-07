// Gedeelde daggrens- en dag-diff-helpers. De debiteuren- (`debtor-summary.ts`) en crediteuren-
// kaarten (`creditor-summary.ts`) zijn bewuste spiegel-implementaties: dezelfde factuur moet aan
// beide kanten hetzelfde "te laat / open"-oordeel geven. Daarvoor delen ze één daggrens: een factuur
// telt pas als te laat wanneer haar vervaldatum vóór UTC-middernacht van vandaag ligt — op de
// vervaldag zelf nog niet. Deze module is de enige bron van die grens (voorheen dupliceerden beide
// bestanden een eigen DAY_MS/startOfDayUTC/daysUntil), zodat de semantiek niet uiteen kan lopen.

export const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC-middernacht (in ms) van een tijdstip — de gedeelde daggrens voor "te laat". */
export function startOfDayUTC(now: Date | number): number {
  const d = typeof now === "number" ? new Date(now) : now;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Is de vervaldatum vóór de daggrens? Op de vervaldag zelf (`due.getTime() === boundaryMs`) is dat
 * `false` — dan is de factuur nog niet te laat. `null` (geen vervaldatum) is nooit te laat.
 */
export function isPastDue(due: Date | null, boundaryMs: number): boolean {
  return due != null && due.getTime() < boundaryMs;
}

/** Hele dagen tot `due`, gemeten vanaf `fromMs`; negatief wanneer de vervaldag is gepasseerd. */
export function daysUntil(due: Date, fromMs: number): number {
  return Math.floor((due.getTime() - fromMs) / DAY_MS);
}

/** Hele dagen sinds `since` tot `untilMs` (>= 0). */
export function daysSince(since: Date, untilMs: number): number {
  return Math.max(0, Math.floor((untilMs - since.getTime()) / DAY_MS));
}
