// Prestaties-overzicht: query + export voor de opdrachtgever.
// "Prestatie" = één Performance-record (urenstaat of oplevering) van een ZZP'er
// in een samenwerking van de opdrachtgever.

import { prisma } from "@/lib/db";
import { type OrtSegment, ortSubtotalCents, resolveOrtRates } from "@/lib/ort";
import { toCsv } from "@/lib/csv";

export interface PrestatieOverzicht {
  id: string;
  collaborationId: string;
  jobTitle: string;
  freelancerName: string;
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

/** Haalt alle prestaties op van ZZP'ers over alle samenwerkingen van de opdrachtgever. */
export async function getPrestatiesForClient(userId: string): Promise<PrestatieOverzicht[]> {
  const rows = await prisma.performance.findMany({
    where: {
      collaboration: {
        company: { userId },
      },
    },
    include: {
      collaboration: {
        select: {
          id: true,
          ortProfile: true,
          ortCustomRates: true,
          job: { select: { title: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
    // Eigenaar-scoped, maar onbegrensde groei voorkomen: een opdrachtgever met veel ZZP'ers/
    // langlopende samenwerkingen kan honderden prestaties hebben. Ruime cap; recentste eerst.
    take: 500,
  });

  return rows.map((p) => {
    const col = p.collaboration;
    const ortSegs = p.ortSegments ? (JSON.parse(p.ortSegments) as OrtSegment[]) : null;
    const rates = resolveOrtRates({
      ortProfile: col.ortProfile,
      ortCustomRates: col.ortCustomRates,
    });

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
      freelancerName: col.freelancer.user.name ?? "Onbekend",
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

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Concept",
  SUBMITTED: "Ter goedkeuring",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

const TYPE_LABEL: Record<string, string> = {
  HOURS: "Uren",
  MILESTONE: "Milestone",
};

/** Genereert een semikolon-gescheiden CSV van de prestaties. Puur — geen DB-aanroepen. */
export function exportPrestatiesCsv(prestaties: PrestatieOverzicht[]): string {
  const header = [
    "ZZP'er",
    "Opdracht",
    "Type",
    "Status",
    "Periode start",
    "Periode eind",
    "Uren",
    "ORT",
    "Subtotaal (EUR)",
    "Ingediend op",
    "Goedgekeurd op",
    "Afgekeurd op",
    "Reden afkeuring",
    "Omschrijving",
  ];

  const rows = prestaties.map((p) => [
    p.freelancerName,
    p.jobTitle,
    TYPE_LABEL[p.type] ?? p.type,
    STATUS_LABEL[p.status] ?? p.status,
    fmtDate(p.periodStart),
    fmtDate(p.periodEnd),
    p.hours != null ? p.hours.toString().replace(".", ",") : "",
    p.hasOrt ? "Ja" : "Nee",
    fmtEur(p.subtotalCents),
    fmtDate(p.submittedAt),
    fmtDate(p.approvedAt),
    fmtDate(p.rejectedAt),
    p.rejectionReason ?? "",
    p.description,
  ]);

  // Via de gedeelde CSV-kern (toCsv/escapeCsvField): dit levert de formule-injectie-beveiliging
  // (CWE-1236) die de handmatige quoting hiervoor miste. Vrije tekst van de ZZP'er (naam,
  // omschrijving, afkeurreden) belandt in de spreadsheet van de opdrachtgever; een cel die met
  // = + - @ begint zou anders als formule worden uitgevoerd (OWASP A03).
  return toCsv([header, ...rows]);
}
