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

// --- IBAN -----------------------------------------------------------------

/** Strip alle witruimte, zet om naar hoofdletters. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

// Verwachte totale lengte per landcode (ISO 13616). Alleen SEPA-landen die voor
// een NL-platform realistisch zijn; onbekende landcodes vallen door de lengte-check.
const IBAN_LENGTHS: Record<string, number> = {
  NL: 18,
  BE: 16,
  DE: 22,
  FR: 27,
  ES: 24,
  IT: 27,
  LU: 20,
  AT: 20,
  PT: 25,
  IE: 22,
  FI: 18,
  PL: 28,
  SE: 24,
  DK: 18,
  NO: 15,
  CH: 21,
  GB: 22,
};

/**
 * True als het IBAN geldig is: bekende landcode + juiste lengte + geslaagde
 * mod-97-controle (ISO 7064). Geen DB-toegang, volledig deterministisch.
 */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected === undefined || iban.length !== expected) return false;
  return mod97(iban) === 1;
}

// Verplaats de eerste 4 tekens naar het einde, vervang letters door hun
// getalwaarde (A=10 … Z=35) en bereken de rest bij deling door 97 iteratief
// (voorkomt overflow op grote getallen).
function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (const digit of value) {
      remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder;
}

/** Weergave in groepen van vier tekens (bijv. "NL91 ABNA 0417 1643 00"). */
export function formatIban(raw: string): string {
  return normalizeIban(raw)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
