/**
 * Presentatie-helpers voor de maand-op-maand geldpuls op KPI-tegels (dashboard).
 * Puur; leunt op de al-geteste `deltaPct` uit `revenue-trend.ts`/`revenue.ts` en
 * berekent zelf niets dubbel. Read-only, geen zij-effecten.
 */

/** Delta-toon die de workspace-KPI-tegel kent (ActionTone). */
export type DeltaTone = "success" | "warning" | "primary";

/**
 * Formatteert een maand-op-maand percentageverschil als korte chip-tekst.
 * `null` (geen vorige-maand-basis) → `undefined` zodat er geen delta-chip verschijnt;
 * positief krijgt een expliciet plusteken, negatief draagt het minteken al in het getal.
 */
export function formatDeltaPct(pct: number | null): string | undefined {
  if (pct === null) return undefined;
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/**
 * Toon-keuze voor een verdienpuls (omzet / gefactureerd): meer geld binnen = positief.
 * `null` (geen basis) of een vlakke maand (0%) → neutraal (`primary`), geen uitgesproken kleur.
 * Uitsluitend voor inkomsten; voor uitgaven (opdrachtgever) is stijging niet "goed" — gebruik
 * daar bewust de neutrale toon.
 */
export function earningsDeltaTone(pct: number | null): DeltaTone {
  if (pct === null || pct === 0) return "primary";
  return pct > 0 ? "success" : "warning";
}
