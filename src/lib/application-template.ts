/**
 * Standaard-motivatie (quick-apply). De ZZP'er bewaart één keer een standaardtekst op zijn
 * profiel; die vult het motivatieveld op het reageerformulier voor, zodat hij niet bij elke
 * opdracht vanaf nul begint. Puur en deterministisch: geen DB, geen tijd. Server-side blijft de
 * ingezonden motivatie de waarheid (het profielveld is enkel een startpunt dat per opdracht wordt
 * aangepast).
 */

/** Maximale lengte van de opgeslagen standaardtekst (gelijk aan het motivatieveld). */
export const DEFAULT_MOTIVATION_MAX = 2000;

/**
 * Normaliseer de opgeslagen standaardmotivatie: trim en behandel een lege string als "geen
 * standaard" (`null`). Eén bron van waarheid voor de lees-/toonkant.
 */
export function normalizeDefaultMotivation(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Heeft deze ZZP'er een bruikbare standaardtekst opgeslagen? */
export function hasDefaultMotivation(value: string | null | undefined): boolean {
  return normalizeDefaultMotivation(value) !== null;
}

export type MotivationDraft = {
  /** Voorgevulde tekst voor het reageerveld (leeg als er geen standaard is). */
  text: string;
  /** True als de tekst uit de opgeslagen standaard komt — toon dan de "aangepaste"-hint. */
  fromTemplate: boolean;
};

/**
 * Bepaal de begintekst van het motivatieveld op het reageerformulier. Met een opgeslagen standaard
 * begint de ZZP'er met die tekst (die hij per opdracht aanpast); zonder standaard met een leeg veld.
 */
export function resolveMotivationDraft(
  defaultMotivation: string | null | undefined,
): MotivationDraft {
  const normalized = normalizeDefaultMotivation(defaultMotivation);
  return normalized ? { text: normalized, fromTemplate: true } : { text: "", fromTemplate: false };
}
