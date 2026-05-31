// Gedeelde CSV-hulpfuncties voor exports vanuit het ZZP-platform.
//
// Bevat bescherming tegen formule-injectie (ook wel "CSV injection" of
// "formula injection" genoemd): wanneer een STRING-cel begint met een van de
// gevaarlijke tekens `=`, `+`, `-`, `@`, TAB of CR, plaatsen spreadsheet-
// applicaties (Excel, Google Sheets, LibreOffice Calc) de celinhoud als een
// formule. Om dit te neutraliseren wordt een apostrof (`'`) als prefix
// toegevoegd, conform de gangbare aanbeveling. De apostrof is onderdeel van de
// letterlijke celtekst en wordt door de meeste spreadsheets niet weergegeven.
//
// Getallen, booleans, null en undefined worden NIET van een apostrof voorzien
// en blijven numeriek bruikbaar in de spreadsheet.

export type CsvCell = string | number | boolean | null | undefined;

// Tekens waarmee een STRING-cel niet mag beginnen (formule-injectierisico).
const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Escapet één CSV-cel volgens RFC 4180 én biedt bescherming tegen
 * formule-injectie voor string-waarden.
 *
 * Regels:
 * 1. null/undefined → lege string.
 * 2. number/boolean → directe serialisatie naar string, géén prefix.
 * 3. string die begint met `= + - @ \t \r` → apostrof als prefix,
 *    daarna RFC 4180-quoting als het resultaat `,` `"` `\n` of `\r` bevat.
 * 4. Overige strings → RFC 4180-quoting indien nodig, anders ongewijzigd.
 */
export function csvEscape(value: CsvCell): string {
  // null / undefined → leeg veld
  if (value === null || value === undefined) return "";

  // Getallen en booleans: direct serialiseren, GEEN formule-prefix.
  if (typeof value !== "string") return String(value);

  // String-pad: controleer of formule-injectieprefix nodig is.
  let str = value;
  if (str.length > 0 && FORMULA_TRIGGER_CHARS.has(str[0]!)) {
    str = "'" + str;
  }

  // RFC 4180-quoting: wrap in dubbele aanhalingstekens als het veld
  // een komma, dubbele aanhalingsteken, newline of CR bevat.
  if (/[,"\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Bouwt één CSV-rij (zonder newline) uit een array van celwaarden.
 */
export function csvRow(cells: CsvCell[]): string {
  return cells.map(csvEscape).join(",");
}

/**
 * Bouwt een volledig CSV-document (meerdere rijen, CRLF-gescheiden).
 * De eerste rij is conventioneel de koptekstrij.
 */
export function csvDocument(rows: CsvCell[][]): string {
  return rows.map(csvRow).join("\r\n");
}
