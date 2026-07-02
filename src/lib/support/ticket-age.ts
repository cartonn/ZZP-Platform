// Compacte leeftijd-tekst voor een support-ticket in de triage-lijst. Puur en los testbaar
// (geen DB, geen i18n-plumbing): server rendert dit deterministisch en geeft het als string door
// aan de client-lijst. Basis: sinds `updatedAt` (het laatste moment dat er iets aan het ticket
// gebeurde), zodat de lijst "hoe lang ligt dit al stil" toont — precies wat triage nodig heeft.

const MIN_MS = 60 * 1000;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

/** "zojuist" / "N min" / "N u" / "N d" — kort, voor in één regel. `now` injecteerbaar voor tests. */
export function ticketAgeLabel(since: Date, now: Date | number = Date.now()): string {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const diff = Math.max(0, nowMs - since.getTime());
  if (diff < MIN_MS) return "zojuist";
  if (diff < HOUR_MS) return `${Math.floor(diff / MIN_MS)} min`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} u`;
  return `${Math.floor(diff / DAY_MS)} d`;
}
