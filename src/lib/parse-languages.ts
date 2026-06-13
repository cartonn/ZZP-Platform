/**
 * Talen van een freelancer-profiel worden als JSON-array-string opgeslagen
 * (bijv. `'["Nederlands","Engels"]'`). Deze helpers parseren dat defensief: bij
 * `null`, lege of ongeldige invoer komt er een lege lijst (resp. lege tekst) uit,
 * nooit een exception. Eén bron van waarheid voor alle weergaven (audit L3).
 */
export function parseLanguages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

/** Komma-gescheiden weergave van de talen (voor compacte drawer-velden). */
export function parseLanguagesText(raw: string | null): string {
  return parseLanguages(raw).join(", ");
}
