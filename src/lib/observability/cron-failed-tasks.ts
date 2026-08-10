// Pure (de)serialisatie van de namen van gefaalde geplande taken voor de cron-heartbeat.
//
// De cron-heartbeat (dead-man's-switch) registreerde tot nu toe alleen ÓF de laatste run een
// taakfout had (`lastOk`). Wélke van de ~28 taken faalde stond alleen in de server-logs — de
// operator moest grepen. Deze module legt de gefaalde taak-namen vast als één plat, komma-gescheiden
// tekstveld (`CronHeartbeat.lastFailedTasks`), zodat /admin/systeemstatus direct "faalde op: X, Y"
// kan tonen.
//
// PRIVACY: de namen zijn statische code-identifiers (bv. "expiry", "message-retention") die letterlijk
// uit de taaklijst in de run-all-route komen — nooit persoonsgegevens. Toch saneren we defensief:
// alleen bekende, veilige tekens blijven staan, zodat een onverwachte naam nooit log-injectie of een
// UI-verrassing kan veroorzaken.
//
// GEEN Next/HTTP/DB-afhankelijkheden — puur (namen ⇄ string), volledig unit-testbaar.

/** Scheidingsteken in het opgeslagen tekstveld. Taak-namen bevatten dit teken nooit. */
const SEPARATOR = ",";

/** Maximaal aantal namen dat we bewaren — ruim boven de ~28 taken, begrenst een pathologische invoer. */
export const MAX_FAILED_TASK_NAMES = 64;

/** Maximale lengte per naam — taak-namen zijn korte slugs; kapt een gek lange waarde af. */
export const MAX_FAILED_TASK_NAME_LENGTH = 64;

/**
 * Saneert één taak-naam tot een veilige slug: alleen letters, cijfers, `-` en `_`; getrimd en
 * afgekapt. Retourneert `null` als er na sanering niets overblijft (zodat rommel wordt gedropt i.p.v.
 * een lege naam op te slaan).
 */
function sanitizeName(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, MAX_FAILED_TASK_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normaliseert een lijst taak-namen: saneert elke naam, dropt lege, dedupliceert, sorteert
 * deterministisch (stabiele UI/opslag) en kapt af op {@link MAX_FAILED_TASK_NAMES}.
 */
export function normalizeFailedTasks(names: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const name of names) {
    const clean = sanitizeName(name);
    if (clean) seen.add(clean);
  }
  return [...seen].sort().slice(0, MAX_FAILED_TASK_NAMES);
}

/**
 * Serialiseert taak-namen naar het opgeslagen tekstveld. Retourneert `null` bij een lege lijst zodat
 * de DB-kolom `null` wordt (geen "" die als "één lege naam" gelezen zou kunnen worden).
 */
export function serializeFailedTasks(names: readonly string[]): string | null {
  const normalized = normalizeFailedTasks(names);
  return normalized.length > 0 ? normalized.join(SEPARATOR) : null;
}

/**
 * Parseert het opgeslagen tekstveld terug naar een genormaliseerde lijst. Robuust tegen `null`,
 * lege string en legacy-rommel: het resultaat is altijd een schone, gesorteerde lijst (mogelijk leeg).
 */
export function parseFailedTasks(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return normalizeFailedTasks(raw.split(SEPARATOR));
}
