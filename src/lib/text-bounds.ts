// Lengtegrenzen + normalisatie voor vrije-tekst-invoer aan mutatie-grenzen.
//
// Waarom: diverse mutaties lezen vrije tekst rechtstreeks via `String(formData.get(...))` zonder
// bovengrens (afwijzings-/dispuut-/creditreden, milestonetitel, kandidaatnotitie). Prisma
// parametriseert en JSX escapet, dus injectie is niet het risico — maar onbegrensde payload belandt
// wél in PII-tabellen, notificatiebodies én audit-metadata (bloat + defense-in-depth-gat, OWASP A04).
// Deze helper trimt en kapt op een ruime bovengrens, zodat een geldige mutatie nooit wordt geweigerd
// (in tegenstelling tot een hard-falende `z.string().max()`) maar de opslag begrensd blijft.
//
// `boundText` is puur en deterministisch: leeg blijft leeg, zodat de bestaande "reden verplicht"-
// checks (die op een lege string werpen) ongewijzigd blijven werken.

/** Ruime bovengrens voor een vrije-tekst-reden (afwijzing/dispuut/credit). */
export const MAX_REASON_LEN = 2000;

/** Bovengrens voor een korte titel (milestonetitel). */
export const MAX_TITLE_LEN = 200;

/** Bovengrens voor een korte omschrijving (prestatie-omschrijving). */
export const MAX_DESCRIPTION_LEN = 500;

/**
 * Trimt de invoer en kapt hem op `max` tekens. Niet-strings (null/undefined/getal) worden een lege
 * string. Na het kappen wordt nogmaals getrimd zodat een afgekapte string nooit met witruimte eindigt.
 */
export function boundText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

/** Begrenst een vrije-tekst-reden (trim + kap op {@link MAX_REASON_LEN}). */
export function boundReason(input: unknown): string {
  return boundText(input, MAX_REASON_LEN);
}
