// Diensten-overzicht: query + pure helpers voor de ZZP'er-diensten-pagina en CSV-import.
// "Dienst" = één Performance-record (urenstaat of oplevering) binnen een samenwerking.

import { prisma } from "@/lib/db";
import { type OrtSegment, ortSubtotalCents, resolveOrtRates } from "@/lib/ort";
import {
  type OrtBreakdown,
  reconcileSubtotalWithInvoice,
  summarizeOrtBreakdown,
} from "@/lib/ort-breakdown";
import { parseCsvRecords, escapeCsvField } from "@/lib/csv";
import { MAX_SHIFT_HOURS } from "@/lib/shift";

export interface DienstSummary {
  id: string;
  collaborationId: string;
  jobTitle: string;
  companyName: string;
  type: "HOURS" | "MILESTONE";
  status: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  hours: number | null;
  subtotalCents: number | null;
  hasOrt: boolean;
  /** Uitsplitsing regulier/ORT-uren + basis/toeslag (voor de export en afstemming met een loonstrook). */
  ortBreakdown: OrtBreakdown;
  description: string;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
}

/** Haalt alle prestaties (urenstaaten/opleveringen) op voor de ZZP'er, gesorteerd op periode. */
export async function getDienstenForFreelancer(userId: string): Promise<DienstSummary[]> {
  const rows = await prisma.performance.findMany({
    where: {
      collaboration: {
        freelancer: { userId },
      },
    },
    include: {
      // De afgeleide factuur (na goedkeuring) draagt het bevroren subtotaal; toon dat i.p.v. een
      // live-herberekening die van de toeslagen kan driften. Zie `reconcileSubtotalWithInvoice` —
      // gelijk aan de opdrachtgever-view (`/prestaties`), zodat beide overzichten voor dezelfde
      // (reeds gefactureerde) prestatie hetzelfde bedrag tonen.
      invoice: { select: { subtotalCents: true } },
      collaboration: {
        select: {
          id: true,
          ortProfile: true,
          ortCustomRates: true,
          job: { select: { title: true } },
          company: { select: { name: true } },
        },
      },
    },
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((p) => {
    const col = p.collaboration;
    const ortSegs = p.ortSegments ? (JSON.parse(p.ortSegments) as OrtSegment[]) : null;
    const rates = resolveOrtRates({
      ortProfile: col.ortProfile,
      ortCustomRates: col.ortCustomRates,
    });

    const hasOrt = !!(ortSegs && ortSegs.length > 0);

    let liveSubtotalCents: number | null = null;
    if (p.type === "HOURS" && p.rateCents != null) {
      if (hasOrt) {
        liveSubtotalCents = ortSubtotalCents(ortSegs, p.rateCents, rates);
      } else if (p.hours != null) {
        liveSubtotalCents = Math.round(p.hours * p.rateCents);
      }
    } else if (p.type === "MILESTONE" && p.amountCents != null) {
      liveSubtotalCents = p.amountCents;
    }

    const liveOrtBreakdown = summarizeOrtBreakdown({
      segments: ortSegs,
      hours: p.hours,
      rateCents: p.type === "HOURS" ? p.rateCents : null,
      rates,
    });

    // De bevroren factuur wint van de live-herberekening (geen ORT-drift). Zelfde bron als
    // `/prestaties` (opdrachtgever), zodat de ZZP'er en de opdrachtgever nooit een verschillend
    // bedrag zien voor dezelfde reeds gefactureerde prestatie.
    const { subtotalCents, ortBreakdown } = reconcileSubtotalWithInvoice({
      subtotalCents: liveSubtotalCents,
      ortBreakdown: liveOrtBreakdown,
      hasOrt,
      invoicedSubtotalCents: p.invoice?.subtotalCents,
    });

    return {
      id: p.id,
      collaborationId: col.id,
      jobTitle: col.job.title,
      companyName: col.company.name,
      type: p.type as "HOURS" | "MILESTONE",
      status: p.status,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      hours: p.hours,
      subtotalCents,
      hasOrt,
      ortBreakdown,
      description: p.description,
      submittedAt: p.submittedAt,
      approvedAt: p.approvedAt,
      rejectedAt: p.rejectedAt,
      rejectionReason: p.rejectionReason,
    };
  });
}

// ---------------------------------------------------------------------------
// CSV-export
// ---------------------------------------------------------------------------

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function fmtEur(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function fmtHours(hours: number): string {
  return hours.toString().replace(".", ",");
}

const STATUS_LABEL_EXPORT: Record<string, string> = {
  DRAFT: "Concept",
  SUBMITTED: "Ter goedkeuring",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

const TYPE_LABEL_EXPORT: Record<string, string> = {
  HOURS: "Uren",
  MILESTONE: "Milestone",
};

/** Genereert een semikolon-gescheiden CSV van de diensten. Puur — geen DB-aanroepen. */
export function exportDienstenCsv(diensten: DienstSummary[]): string {
  const header = [
    "Opdracht",
    "Opdrachtgever",
    "Type",
    "Status",
    "Periode start",
    "Periode eind",
    "Uren",
    "ORT",
    "Reguliere uren",
    "ORT-uren",
    "Basisbedrag (EUR)",
    "ORT-toeslag (EUR)",
    "Subtotaal (EUR)",
    "Ingediend op",
    "Goedgekeurd op",
    "Afgekeurd op",
    "Reden afkeuring",
    "Omschrijving",
  ].join(";");

  const rows = diensten.map((d) =>
    [
      d.jobTitle,
      d.companyName,
      TYPE_LABEL_EXPORT[d.type] ?? d.type,
      STATUS_LABEL_EXPORT[d.status] ?? d.status,
      fmtDate(d.periodStart),
      fmtDate(d.periodEnd),
      d.hours != null ? d.hours.toString().replace(".", ",") : "",
      d.hasOrt ? "Ja" : "Nee",
      d.type === "HOURS" ? fmtHours(d.ortBreakdown.normalHours) : "",
      d.type === "HOURS" ? fmtHours(d.ortBreakdown.ortHours) : "",
      d.type === "HOURS" ? fmtEur(d.ortBreakdown.baseCents) : "",
      d.type === "HOURS" ? fmtEur(d.ortBreakdown.surchargeCents) : "",
      fmtEur(d.subtotalCents),
      fmtDate(d.submittedAt),
      fmtDate(d.approvedAt),
      fmtDate(d.rejectedAt),
      d.rejectionReason ?? "",
      d.description,
    ]
      .map((v) => escapeCsvField(String(v)))
      .join(";"),
  );

  return [header, ...rows].join("\r\n");
}

// ---------------------------------------------------------------------------
// CSV-import helpers
// ---------------------------------------------------------------------------

export interface ParsedShift {
  start: Date;
  end: Date;
  description: string;
}

export interface CsvParseError {
  line: number;
  message: string;
}

export interface CsvParseResult {
  shifts: ParsedShift[];
  errors: CsvParseError[];
}

/** Maximum aantal geldige dienst-rijen dat één import mag bevatten (handhaving in de server-action). */
export const MAX_CSV_IMPORT_SIZE = 100;

/**
 * Parseert CSV-tekst voor diensten-import. Formaat (semikolon-gescheiden):
 *   start;eind;omschrijving
 * Kolom "omschrijving" is optioneel (mag het scheidingsteken of newlines bevatten als ze
 * gequote zijn). Een optionele kopregel wordt overgeslagen. Tijdstempels: ISO-8601 of
 * "2024-01-15 22:00" (spatie i.p.v. T toegestaan). Gebruikt de gedeelde RFC4180-parser (@/lib/csv).
 */
export function parseCsvShifts(text: string): CsvParseResult {
  const shifts: ParsedShift[] = [];
  const errors: CsvParseError[] = [];

  // Vast scheidingsteken ';' voor dit formaat; de parser handelt gequote velden en newlines af.
  const records = parseCsvRecords(text, ";");

  let startLine = 0;
  if (records.length > 0) {
    const firstCol = (records[0]![0] ?? "").trim().toLowerCase();
    if (["start", "datum_start", "begin", "van"].includes(firstCol)) {
      startLine = 1;
    }
  }

  for (let i = startLine; i < records.length; i++) {
    const lineNum = i + 1;
    const cols = records[i]!.map((c) => c.trim());

    if (cols.length < 2) {
      errors.push({ line: lineNum, message: "Minimaal twee kolommen vereist (start;eind)." });
      continue;
    }

    const [rawStart, rawEnd, ...descParts] = cols;
    const description = descParts.join(";").slice(0, 500);

    // Vervang spatie door T zodat "2024-01-15 22:00" werkt als ISO-8601.
    const startStr = (rawStart ?? "").replace(" ", "T");
    const endStr = (rawEnd ?? "").replace(" ", "T");

    const start = new Date(startStr);
    if (isNaN(start.getTime())) {
      errors.push({ line: lineNum, message: `Ongeldige begintijd: "${rawStart}".` });
      continue;
    }
    const end = new Date(endStr);
    if (isNaN(end.getTime())) {
      errors.push({ line: lineNum, message: `Ongeldige eindtijd: "${rawEnd}".` });
      continue;
    }
    if (end.getTime() <= start.getTime()) {
      errors.push({ line: lineNum, message: "Eindtijd moet na begintijd liggen." });
      continue;
    }
    // Weiger een absurde dienstduur netjes (server-side waarheid): segmentatie is O(duur), dus een
    // eindtijd ver in de toekomst (bv. jaar 9999) zou de import synchroon laten blokkeren.
    if (end.getTime() - start.getTime() > MAX_SHIFT_HOURS * 3_600_000) {
      errors.push({
        line: lineNum,
        message: `Een dienst mag niet langer dan ${MAX_SHIFT_HOURS} uur duren.`,
      });
      continue;
    }

    shifts.push({ start, end, description });
  }

  return { shifts, errors };
}
