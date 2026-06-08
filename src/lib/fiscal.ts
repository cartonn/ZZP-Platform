// Puur module voor Nederlandse fiscale identificatoren (KvK-nummer en BTW-id).
// Geen imports uit app/db — alleen deterministische helpers.

// --- KvK-nummer -----------------------------------------------------------

/** Strip alle witruimte en punten uit een KvK-invoerwaarde. */
export function normalizeKvk(raw: string): string {
  return raw.replace(/[\s.]/g, "");
}

/** True als de genormaliseerde waarde precies 8 ASCII-cijfers bevat. */
export function isValidKvk(raw: string): boolean {
  return /^\d{8}$/.test(normalizeKvk(raw));
}

/** Stabiele weergave-helper — geeft de genormaliseerde waarde terug. */
export function formatKvk(raw: string): string {
  return normalizeKvk(raw);
}

// --- BTW-id ---------------------------------------------------------------

/** Strip alle witruimte en punten, zet om naar hoofdletters. */
export function normalizeBtwId(raw: string): string {
  return raw.replace(/[\s.]/g, "").toUpperCase();
}

/**
 * True als het BTW-id voldoet aan het formaat NL{9 cijfers}B{2 cijfers}
 * met een suffix in het bereik 01–99.
 *
 * Let op: er wordt GEEN elfproef (11-test) toegepast. Moderne Nederlandse
 * BTW-id's zijn willekeurig gegenereerd en bevatten geen controlecijfer meer.
 * Een elfproef zou geldige nummers ten onrechte afwijzen.
 */
export function isValidBtwId(raw: string): boolean {
  const normalized = normalizeBtwId(raw);
  if (!/^NL\d{9}B\d{2}$/.test(normalized)) return false;
  const suffix = parseInt(normalized.slice(-2), 10);
  return suffix >= 1 && suffix <= 99;
}

/** Stabiele weergave-helper — geeft de genormaliseerde waarde terug. */
export function formatBtwId(raw: string): string {
  return normalizeBtwId(raw);
}
