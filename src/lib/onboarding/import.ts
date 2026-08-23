// Onboarding bulk-import — pure kern (geen DB, volledig testbaar). Zet een geüploade CSV om in
// een gevalideerd importvoorstel: kolommen herkennen (NL/EN-aliassen), per rij valideren met
// duidelijke meldingen, dubbele e-mails binnen het bestand markeren, en een samenvatting geven.
// De server-laag voegt hier DB-bewuste checks aan toe (bestaat e-mail al, bestaat vaardigheid).
//
// Kwaliteitslat: een onboarding van 50 ZZP'ers mag nooit half slagen of stilletjes data droppen.
// Daarom: dry-run preview met per-rij status (ok/waarschuwing/fout), niets schrijven vóór bevestiging.

import { z } from "zod";
import { escapeCsvField, parseCsvRecords, detectDelimiter } from "@/lib/csv";
import { httpUrl } from "@/lib/validation";
import { isValidKvk, normalizeKvk, isValidBtwId, normalizeBtwId } from "@/lib/fiscal";

// Veldgrenzen — één bron van waarheid met de canonieke Zod-schema's in `validation.ts`
// (`registerSchema`/`freelancerProfileSchema`): naam ≤120, bedrijfsnaam ≤160, headline/locatie ≤120.
// De bulk-import is het enige mutatiepad dat NIET door die schema's loopt; zonder deze grenzen kan een
// CSV-cel een onbegrensde naam of een ongeldig/ongenormaliseerd KvK-/BTW-nummer de DB in schrijven —
// een tweede, zwakkere waarheidsbron (CLAUDE.md regel 2/6). Geen XSS (JSX escapet), wel data-integriteit.
const NAME_MAX = 120;
const COMPANY_NAME_MAX = 160;
const TEXT_MAX = 120; // headline + locatie

// Her-export zodat bestaande importers (de admin-import-actie + tests) dit pad blijven gebruiken.
export { parseCsvRecords, detectDelimiter };

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

/**
 * Valideert een website-kolom: alleen het http(s)-schema mag door (`httpUrl`, dezelfde bron van
 * waarheid als het handmatige bedrijfsprofiel-formulier). Een `javascript:`/`data:`-URI zou anders
 * ongefilterd in `Company.website` belanden en wordt elders als rauwe `href` gerenderd (opdracht-
 * detail + bedrijfsprofiel) → stored XSS (OWASP A03 / CWE-79). Bij een ongeldige waarde: waarschuwen
 * en de waarde droppen (net als een onleesbaar uurtarief) — een kapotte website blokkeert de
 * onboarding van het bedrijf niet.
 */
function parseWebsite(raw: string, issues: ImportIssue[]): string | null {
  if (!raw) return null;
  const parsed = httpUrl().safeParse(raw);
  if (!parsed.success) {
    issues.push({
      level: "warning",
      field: "website",
      message: `Website "${raw}" is geen geldige http(s)-URL — overgeslagen.`,
    });
    return null;
  }
  return parsed.data;
}

function parseHourlyRate(raw: string, issues: ImportIssue[]): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/[€\s]/g, "").replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    issues.push({
      level: "warning",
      field: "hourlyRate",
      message: `Uurtarief "${raw}" onleesbaar — overgeslagen.`,
    });
    return null;
  }
  if (num < 0 || num > 10000) {
    issues.push({
      level: "warning",
      field: "hourlyRate",
      message: `Uurtarief "${raw}" buiten bereik — overgeslagen.`,
    });
    return null;
  }
  return Math.round(num);
}

/**
 * Valideert + normaliseert een KvK-nummer via dezelfde bron van waarheid als het handmatige
 * profielformulier (`isValidKvk`/`normalizeKvk`). Een ongeldige waarde blokkeert de onboarding niet:
 * waarschuwen en droppen (net als een onleesbaar uurtarief of een kapotte website) — het KvK-veld is
 * optioneel. Een geldige waarde wordt genormaliseerd (spaties/punten weg) zodat de import dezelfde
 * canonieke vorm oplevert als het formulier.
 */
function parseKvk(raw: string, issues: ImportIssue[]): string | null {
  if (!raw) return null;
  if (!isValidKvk(raw)) {
    issues.push({
      level: "warning",
      field: "kvkNumber",
      message: `KvK-nummer "${raw}" is ongeldig (8 cijfers) — overgeslagen.`,
    });
    return null;
  }
  return normalizeKvk(raw);
}

/** Idem voor het BTW-id (`isValidBtwId`/`normalizeBtwId`). Ongeldig → waarschuwen en droppen. */
function parseBtw(raw: string, issues: ImportIssue[]): string | null {
  if (!raw) return null;
  if (!isValidBtwId(raw)) {
    issues.push({
      level: "warning",
      field: "btwNumber",
      message: `BTW-id "${raw}" is ongeldig (bijv. NL123456789B01) — overgeslagen.`,
    });
    return null;
  }
  return normalizeBtwId(raw);
}

/**
 * Optioneel cosmetisch tekstveld (headline/locatie) begrensd tot `max` tekens (spiegelt
 * `optionalText(120)`). Te lang → waarschuwen en afkappen i.p.v. de rij blokkeren.
 */
function capText(raw: string, max: number, field: string, issues: ImportIssue[]): string | null {
  if (!raw) return null;
  if (raw.length > max) {
    issues.push({
      level: "warning",
      field,
      message: `Veld "${field}" is te lang (max ${max} tekens) — afgekapt.`,
    });
    return raw.slice(0, max);
  }
  return raw;
}

/**
 * Bouwt het importvoorstel uit ruwe CSV-tekst (alleen formaatvalidatie; DB-checks doet de server).
 * Lege bestanden of bestanden zonder herkende verplichte kolommen leveren een lege preview met
 * een uitleg in de eerste (virtuele) rij niet — die fout meldt de server-laag aan de gebruiker.
 */
export function buildImportPreview(text: string): ImportPreview {
  const records = parseCsvRecords(text);
  if (records.length < 2) {
    return {
      rows: [],
      summary: { total: 0, importable: 0, errors: 0, warnings: 0, duplicatesInFile: 0 },
    };
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

    if (name.length < 2)
      issues.push({ level: "error", field: "name", message: "Naam ontbreekt of is te kort." });
    else if (name.length > NAME_MAX)
      issues.push({
        level: "error",
        field: "name",
        message: `Naam is te lang (max ${NAME_MAX} tekens).`,
      });

    let email = "";
    const emailParsed = emailSchema.safeParse(emailRaw);
    if (!emailRaw) {
      issues.push({ level: "error", field: "email", message: "E-mailadres ontbreekt." });
    } else if (!emailParsed.success) {
      issues.push({
        level: "error",
        field: "email",
        message: `Ongeldig e-mailadres: "${emailRaw}".`,
      });
    } else {
      email = emailParsed.data;
      if (seenEmails.has(email)) {
        duplicatesInFile++;
        issues.push({
          level: "error",
          field: "email",
          message: "Dubbel e-mailadres binnen het bestand.",
        });
      } else {
        seenEmails.add(email);
      }
    }

    const role = parseRole(roleRaw);
    if (!roleRaw) {
      issues.push({
        level: "error",
        field: "role",
        message: "Rol ontbreekt (ZZP'er of opdrachtgever).",
      });
    } else if (!role) {
      issues.push({ level: "error", field: "role", message: `Onbekende rol: "${roleRaw}".` });
    }

    if (role === "CLIENT" && !companyName) {
      issues.push({
        level: "error",
        field: "companyName",
        message: "Bedrijfsnaam is verplicht voor een opdrachtgever.",
      });
    } else if (companyName && companyName.length > COMPANY_NAME_MAX) {
      issues.push({
        level: "error",
        field: "companyName",
        message: `Bedrijfsnaam is te lang (max ${COMPANY_NAME_MAX} tekens).`,
      });
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
      headline: capText(get(rec, "headline"), TEXT_MAX, "headline", issues),
      hourlyRate,
      location: capText(get(rec, "location"), TEXT_MAX, "location", issues),
      kvkNumber: parseKvk(get(rec, "kvkNumber"), issues),
      btwNumber: parseBtw(get(rec, "btwNumber"), issues),
      website: parseWebsite(get(rec, "website"), issues),
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
    [
      "Sanne de Vries",
      "sanne@example.nl",
      "ZZP'er",
      "",
      "Verpleegkundige IC",
      "55",
      "Utrecht",
      "12345678",
      "NL001234567B01",
      "",
      "IC;Reanimatie;BIG",
    ],
    [
      "Zorgburo Noord",
      "info@zorgburonoord.nl",
      "Opdrachtgever",
      "Zorgburo Noord",
      "",
      "",
      "Groningen",
      "",
      "",
      "https://zorgburonoord.nl",
      "",
    ],
  ];
  return rows.map((row) => row.map((c) => escapeCsvField(c)).join(";")).join("\r\n");
}
