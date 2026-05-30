// Diensten-overzicht: query + pure helpers voor de ZZP'er-diensten-pagina en CSV-import.
// "Dienst" = één Performance-record (urenstaat of oplevering) binnen een samenwerking.

import { prisma } from "@/lib/db";
import { type OrtSegment, ortSubtotalCents, resolveOrtRates } from "@/lib/ort";

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
    const rates = resolveOrtRates({ ortProfile: col.ortProfile, ortCustomRates: col.ortCustomRates });

    let subtotalCents: number | null = null;
    if (p.type === "HOURS" && p.rateCents != null) {
      if (ortSegs && ortSegs.length > 0) {
        subtotalCents = ortSubtotalCents(ortSegs, p.rateCents, rates);
      } else if (p.hours != null) {
        subtotalCents = Math.round(p.hours * p.rateCents);
      }
    } else if (p.type === "MILESTONE" && p.amountCents != null) {
      subtotalCents = p.amountCents;
    }

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
      hasOrt: !!(ortSegs && ortSegs.length > 0),
      description: p.description,
      submittedAt: p.submittedAt,
      approvedAt: p.approvedAt,
      rejectedAt: p.rejectedAt,
      rejectionReason: p.rejectionReason,
    };
  });
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

/**
 * Parseert CSV-tekst voor diensten-import. Formaat (semikolon-gescheiden):
 *   start;eind;omschrijving
 * Kolom "omschrijving" is optioneel. Een optionele kopregels-regel wordt overgeslagen.
 * Tijdstempels: ISO-8601 of "2024-01-15 22:00" (spatie i.p.v. T toegestaan).
 */
export function parseCsvShifts(text: string): CsvParseResult {
  const shifts: ParsedShift[] = [];
  const errors: CsvParseError[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let startLine = 0;
  if (lines.length > 0) {
    const firstCol = lines[0]!.split(";")[0]!.trim().toLowerCase();
    if (["start", "datum_start", "begin", "van"].includes(firstCol)) {
      startLine = 1;
    }
  }

  for (let i = startLine; i < lines.length; i++) {
    const lineNum = i + 1;
    const cols = lines[i]!.split(";").map((c) => c.trim());

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

    shifts.push({ start, end, description });
  }

  return { shifts, errors };
}
