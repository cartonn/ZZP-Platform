// Onboarding bulk-import — pure kern (geen DB, volledig testbaar). Zet een geüploade CSV om in
// een gevalideerd importvoorstel: kolommen herkennen (NL/EN-aliassen), per rij valideren met
// duidelijke meldingen, dubbele e-mails binnen het bestand markeren, en een samenvatting geven.
// De server-laag voegt hier DB-bewuste checks aan toe (bestaat e-mail al, bestaat vaardigheid).
//
// Kwaliteitslat: een onboarding van 50 ZZP'ers mag nooit half slagen of stilletjes data droppen.
// Daarom: dry-run preview met per-rij status (ok/waarschuwing/fout), niets schrijven vóór bevestiging.

import { z } from "zod";
import { escapeCsvField } from "@/lib/administration/csv";

export type ImportRole = "FREELANCER" | "CLIENT";

export interface ImportIssue {
  level: "error" | "warning";
  field?: string;
  message: string;
}

export interface ParsedImportRow {
  /** 1-gebaseerd rijnummer in het bestand (kop = rij 1, eerste datarij = rij 2). */
  rowNumber: number;
  name: string;
  email: string;
  role: ImportRole | null;
  companyName: string | null;
  headline: string | null;
  hourlyRate: number | null; // hele euro's
  location: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
  website: string | null;
  skills: string[]; // ruwe namen, ontdubbeld
  issues: ImportIssue[];
  /** Geen fout-issues → de rij kan worden aangemaakt. */
  importable: boolean;
}

export interface ImportSummary {
  total: number;
  importable: number;
  errors: number;
  warnings: number;
  duplicatesInFile: number;
}

export interface ImportPreview {
  rows: ParsedImportRow[];
  summary: ImportSummary;
}

// --- CSV-parser (RFC 4180-achtig) ------------------------------------------
// Ondersteunt ; , en tab als scheidingsteken (autodetectie op de kopregel), velden tussen
// dubbele quotes met "" als escape, CRLF/LF en een BOM. Excel-NL exporteert met ';' en quotet
// velden met komma's — dat moet gewoon werken.

const DELIMITERS = [";", ",", "\t"] as const;
type Delimiter = (typeof DELIMITERS)[number];

export function detectDelimiter(headerLine: string): Delimiter {
  let best: Delimiter = ";";
  let bestCount = -1;
  for (const d of DELIMITERS) {
    // tel voorkomens buiten quotes
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

/** Splitst CSV-tekst in records (rijen van velden). Lege regels worden overgeslagen. */
export function parseCsvRecords(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLineEnd = clean.search(/\r\n|\n|\r/);
  const headerLine = firstLineEnd === -1 ? clean : clean.slice(0, firstLineEnd);
  const delim = detectDelimiter(headerLine);

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
      // \r of \r\n
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
  // laatste veld/record
  if (field.length > 0 || record.length > 0) endRecord();
  return records;
}

// --- Kolomherkenning -------------------------------------------------------

type CanonicalField =
  | "name"
  | "email"
  | "role"
  | "companyName"
  | "headline"
  | "hourlyRate"
  | "location"
  | "kvkNumber"
  | "btwNumber"
  | "website"
  | "skills";

const HEADER_ALIASES: Record<CanonicalField, string[]> = {
  name: ["naam", "name", "volledige naam", "voornaam achternaam", "contactpersoon"],
  email: ["email", "e-mail", "mail", "emailadres", "e-mailadres"],
  role: ["rol", "role", "type", "soort"],
  companyName: ["bedrijf", "bedrijfsnaam", "company", "organisatie", "opdrachtgever"],
  headline: ["functie", "headline", "titel", "rol omschrijving", "functietitel"],
  hourlyRate: ["uurtarief", "tarief", "rate", "hourlyrate", "uurloon"],
  location: ["locatie", "plaats", "location", "woonplaats", "stad"],
  kvkNumber: ["kvk", "kvknummer", "kvk-nummer", "kvk nummer"],
  btwNumber: ["btw", "btwnummer", "btw-nummer", "vat", "btw nummer"],
  website: ["website", "url", "web", "site"],
  skills: ["vaardigheden", "skills", "expertise", "competenties"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Wijst elke canonieke veldnaam toe aan een kolomindex (of -1 als niet aanwezig). */
export function mapColumns(headers: string[]): Record<CanonicalField, number> {
  const normalized = headers.map(normalizeHeader);
  const map = {} as Record<CanonicalField, number>;
  for (const field of Object.keys(HEADER_ALIASES) as CanonicalField[]) {
    map[field] = normalized.findIndex((h) => HEADER_ALIASES[field].includes(h));
  }
  return map;
}

// --- Rolherkenning ---------------------------------------------------------

const ROLE_ALIASES: Record<string, ImportRole> = {
  freelancer: "FREELANCER",
  zzp: "FREELANCER",
  "zzp'er": "FREELANCER",
  zzper: "FREELANCER",
  zelfstandige: "FREELANCER",
  professional: "FREELANCER",
  client: "CLIENT",
  opdrachtgever: "CLIENT",
  klant: "CLIENT",
  bedrijf: "CLIENT",
  company: "CLIENT",
  organisatie: "CLIENT",
};

export function parseRole(raw: string): ImportRole | null {
  return ROLE_ALIASES[raw.trim().toLowerCase()] ?? null;
}

// --- Validatie per rij -----------------------------------------------------

const emailSchema = z.string().trim().toLowerCase().email();

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

/** Splitst een vaardighedenkolom ("BIG, IC; reanimatie") in ontdubbelde namen. */
function parseSkills(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[;,/]/)) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function parseHourlyRate(raw: string, issues: ImportIssue[]): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/[€\s]/g, "").replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    issues.push({ level: "warning", field: "hourlyRate", message: `Uurtarief "${raw}" onleesbaar — overgeslagen.` });
    return null;
  }
  if (num < 0 || num > 10000) {
    issues.push({ level: "warning", field: "hourlyRate", message: `Uurtarief "${raw}" buiten bereik — overgeslagen.` });
    return null;
  }
  return Math.round(num);
}

/**
 * Bouwt het importvoorstel uit ruwe CSV-tekst (alleen formaatvalidatie; DB-checks doet de server).
 * Lege bestanden of bestanden zonder herkende verplichte kolommen leveren een lege preview met
 * een uitleg in de eerste (virtuele) rij niet — die fout meldt de server-laag aan de gebruiker.
 */
export function buildImportPreview(text: string): ImportPreview {
  const records = parseCsvRecords(text);
  if (records.length < 2) {
    return { rows: [], summary: { total: 0, importable: 0, errors: 0, warnings: 0, duplicatesInFile: 0 } };
  }
  const headers = records[0] ?? [];
  const cols = mapColumns(headers);
  const get = (rec: string[], field: CanonicalField): string =>
    cols[field] >= 0 ? clean(rec[cols[field]]) : "";

  const seenEmails = new Set<string>();
  const rows: ParsedImportRow[] = [];
  let duplicatesInFile = 0;

  for (let r = 1; r < records.length; r++) {
    const rec = records[r];
    if (!rec) continue;
    const issues: ImportIssue[] = [];

    const name = get(rec, "name");
    const emailRaw = get(rec, "email");
    const roleRaw = get(rec, "role");
    const companyName = get(rec, "companyName") || null;

    if (name.length < 2) issues.push({ level: "error", field: "name", message: "Naam ontbreekt of is te kort." });

    let email = "";
    const emailParsed = emailSchema.safeParse(emailRaw);
    if (!emailRaw) {
      issues.push({ level: "error", field: "email", message: "E-mailadres ontbreekt." });
    } else if (!emailParsed.success) {
      issues.push({ level: "error", field: "email", message: `Ongeldig e-mailadres: "${emailRaw}".` });
    } else {
      email = emailParsed.data;
      if (seenEmails.has(email)) {
        duplicatesInFile++;
        issues.push({ level: "error", field: "email", message: "Dubbel e-mailadres binnen het bestand." });
      } else {
        seenEmails.add(email);
      }
    }

    const role = parseRole(roleRaw);
    if (!roleRaw) {
      issues.push({ level: "error", field: "role", message: "Rol ontbreekt (ZZP'er of opdrachtgever)." });
    } else if (!role) {
      issues.push({ level: "error", field: "role", message: `Onbekende rol: "${roleRaw}".` });
    }

    if (role === "CLIENT" && !companyName) {
      issues.push({ level: "error", field: "companyName", message: "Bedrijfsnaam is verplicht voor een opdrachtgever." });
    }

    const hourlyRate = parseHourlyRate(get(rec, "hourlyRate"), issues);
    const skills = role === "FREELANCER" ? parseSkills(get(rec, "skills")) : [];

    const importable = !issues.some((i) => i.level === "error");
    rows.push({
      rowNumber: r + 1,
      name,
      email,
      role,
      companyName,
      headline: get(rec, "headline") || null,
      hourlyRate,
      location: get(rec, "location") || null,
      kvkNumber: get(rec, "kvkNumber") || null,
      btwNumber: get(rec, "btwNumber") || null,
      website: get(rec, "website") || null,
      skills,
      issues,
      importable,
    });
  }

  return { rows, summary: summarize(rows, duplicatesInFile) };
}

export function summarize(rows: ParsedImportRow[], duplicatesInFile: number): ImportSummary {
  let importable = 0;
  let errors = 0;
  let warnings = 0;
  for (const row of rows) {
    if (row.importable) importable++;
    if (row.issues.some((i) => i.level === "error")) errors++;
    if (row.issues.some((i) => i.level === "warning")) warnings++;
  }
  return { total: rows.length, importable, errors, warnings, duplicatesInFile };
}

/** De verplichte/optionele kolommen voor de voorbeeld-CSV en de UI-uitleg. */
export const IMPORT_TEMPLATE_HEADERS = [
  "naam",
  "email",
  "rol",
  "bedrijfsnaam",
  "functie",
  "uurtarief",
  "locatie",
  "kvk",
  "btw",
  "website",
  "vaardigheden",
] as const;

/** Voorbeeld-CSV-inhoud (puntkomma-gescheiden, Excel-NL-vriendelijk; velden met ';' worden gequote). */
export function importTemplateCsv(): string {
  const rows: string[][] = [
    [...IMPORT_TEMPLATE_HEADERS],
    ["Sanne de Vries", "sanne@example.nl", "ZZP'er", "", "Verpleegkundige IC", "55", "Utrecht", "12345678", "NL001234567B01", "", "IC;Reanimatie;BIG"],
    ["Zorgburo Noord", "info@zorgburonoord.nl", "Opdrachtgever", "Zorgburo Noord", "", "", "Groningen", "", "", "https://zorgburonoord.nl", ""],
  ];
  return rows.map((row) => row.map((c) => escapeCsvField(c)).join(";")).join("\r\n");
}
