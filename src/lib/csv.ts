// Canonieke CSV-kern (puur, geen DB). Eén bron van waarheid voor zowel het *lezen* (robuuste,
// RFC 4180-achtige parser) als het *schrijven* (escapen + samenvoegen) van CSV. Alle CSV-consumenten
// — onboarding-import, diensten-import/-export, administratie-export — gebruiken deze module, zodat
// rare invoer (gequote velden, scheidingsteken in een veld, BOM, CRLF) overal identiek wordt verwerkt.

// --- Lezen (RFC 4180-achtig) -----------------------------------------------
// Ondersteunt ; , en tab als scheidingsteken (autodetectie op de kopregel), velden tussen
// dubbele quotes met "" als escape, CRLF/LF/CR en een BOM. Excel-NL exporteert met ';' en quotet
// velden met komma's of newlines — dat moet gewoon werken.

export const CSV_DELIMITERS = [";", ",", "\t"] as const;
export type CsvDelimiter = (typeof CSV_DELIMITERS)[number];

/** Kiest het scheidingsteken op basis van de kopregel (telt voorkomens buiten quotes). */
export function detectDelimiter(headerLine: string): CsvDelimiter {
  let best: CsvDelimiter = ";";
  let bestCount = -1;
  for (const d of CSV_DELIMITERS) {
    let count = 0;
    let inQuotes = false;
    for (const ch of headerLine) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === d && !inQuotes) count++;
    }
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Splitst CSV-tekst in records (rijen van velden). Volledig lege regels worden overgeslagen.
 * Het scheidingsteken wordt automatisch gedetecteerd, tenzij expliciet meegegeven.
 */
export function parseCsvRecords(text: string, delimiter?: CsvDelimiter): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLineEnd = clean.search(/\r\n|\n|\r/);
  const headerLine = firstLineEnd === -1 ? clean : clean.slice(0, firstLineEnd);
  const delim = delimiter ?? detectDelimiter(headerLine);

  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;
  const n = clean.length;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    // Sla volledig lege regels over (één leeg veld).
    if (!(record.length === 1 && record[0]!.trim() === "")) records.push(record);
    record = [];
  };

  while (i < n) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delim) {
      endField();
      i++;
      continue;
    }
    if (ch === "\r") {
      if (clean[i + 1] === "\n") i++;
      endRecord();
      i++;
      continue;
    }
    if (ch === "\n") {
      endRecord();
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || record.length > 0) endRecord();
  return records;
}

// --- Schrijven -------------------------------------------------------------

/** Herkent een gewoon negatief getal (geheel of decimaal met punt of komma). */
const PLAIN_NEGATIVE = /^-\d+(?:[.,]\d+)?$/;

/**
 * Bepaalt of een cel een formule-injectie-prefix nodig heeft.
 * Gevaarlijke starttekens: = + @ \t \r en - (tenzij het een gewoon negatief getal is).
 */
function needsFormulaGuard(value: string): boolean {
  if (value.length === 0) return false;
  const first = value[0];
  if (first === "=" || first === "+" || first === "@" || first === "\t" || first === "\r") {
    return true;
  }
  if (first === "-") {
    // Gewone negatieve getallen (bv. -5, -1016.40, -1016,40) mogen ongewijzigd door.
    return !PLAIN_NEGATIVE.test(value);
  }
  return false;
}

/**
 * Escapet één veld voor CSV-uitvoer:
 * 1. Formule-injectie-beveiliging (CWE-1236): cellen die beginnen met =, +, @, \t, \r of -
 *    (tenzij een gewoon negatief getal) krijgen een voorloopse apostrof '
 *    zodat spreadsheet-programma's de inhoud als tekst behandelen.
 * 2. RFC 4180-quoting: quotet bij scheidingsteken, dubbele quote of newline;
 *    verdubbelt aanwezige dubbele quotes.
 * De apostrof wordt BINNEN de quotes geplaatst wanneer quoting nodig is.
 */
export function escapeCsvField(value: string, delimiter: CsvDelimiter = ";"): string {
  const guarded = needsFormulaGuard(value) ? `'${value}` : value;
  const needsQuote = guarded.includes(delimiter) || /["\n\r]/.test(guarded);
  return needsQuote ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** Bouwt CSV-tekst uit rijen (eerste rij = kop). Velden worden ge-escaped; CRLF tussen rijen. */
export function toCsv(
  rows: readonly (readonly (string | number)[])[],
  delimiter: CsvDelimiter = ";",
): string {
  return rows
    .map((row) => row.map((c) => escapeCsvField(String(c), delimiter)).join(delimiter))
    .join("\r\n");
}
