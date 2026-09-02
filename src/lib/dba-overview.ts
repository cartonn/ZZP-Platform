// Geconsolideerd DBA-risico-overzicht voor beheerders: laad alle ACTIEVE samenwerkingen,
// bereken per samenwerking het DBA-oordeel met de pure engine, en bied helpers voor
// sortering en samenvatting. Hergebruikt logica uit dba-monitor-task.ts en dba-monitor.ts.

import { prisma } from "@/lib/db";
import {
  assessCollaborationDba,
  jobDbaIndicators,
  revenueConcentrationPct,
  effectiveRelationshipStart,
  bridgedPriorPlacementCount,
  type DbaAssessment,
  type DbaSignalLevel,
  DBA_SIGNAL_LEVELS,
} from "@/lib/dba-monitor";
import { loadRelationshipSpans, relationshipPairKey } from "@/lib/data/dba-relationship-spans";
import { getDbaThresholds } from "@/lib/platform-config";
import { DBA_RELATIONSHIP_GAP_BRIDGE_DAYS } from "@/lib/config";

export interface DbaOverviewRow {
  collaborationId: string;
  jobTitle: string;
  companyName: string;
  freelancerName: string;
  startDate: Date | null;
  /** Start van de dóórlopende relatie (aaneengesloten inzetten overbrugd); voedt de duurmeter. */
  relationshipStartDate: Date | null;
  /** Aantal eerdere aaneengesloten inzetten dat in de relatieduur is opgenomen (0 = geen). */
  bridgedPriorPlacements: number;
  assessment: DbaAssessment;
}

export interface DbaOverviewSummary {
  total: number;
  byLevel: Record<DbaSignalLevel, number>;
}

/** Numerieke rangorde per niveau: lager = hogere prioriteit (HOOG=0, VERHOOGD=1, LAAG=2). */
export function rankDbaLevel(level: DbaSignalLevel): number {
  switch (level) {
    case "HOOG":
      return 0;
    case "VERHOOGD":
      return 1;
    case "LAAG":
      return 2;
  }
}

/**
 * Sorteer: hoogste risico eerst; bij gelijk niveau langste duur eerst
 * (durationMonths desc, null telt als 0).
 */
export function sortDbaRows(rows: readonly DbaOverviewRow[]): DbaOverviewRow[] {
  return [...rows].sort((a, b) => {
    const rankDiff = rankDbaLevel(a.assessment.level) - rankDbaLevel(b.assessment.level);
    if (rankDiff !== 0) return rankDiff;
    const durA = a.assessment.durationMonths ?? 0;
    const durB = b.assessment.durationMonths ?? 0;
    return durB - durA; // langste duur eerst
  });
}

/**
 * Tel totalen en aantal per niveau. Alle drie niveaus zijn altijd aanwezig (ook als 0),
 * zodat de UI altijd een volledig overzicht heeft.
 */
export function summarizeDbaOverview(rows: readonly DbaOverviewRow[]): DbaOverviewSummary {
  const byLevel: Record<DbaSignalLevel, number> = { HOOG: 0, VERHOOGD: 0, LAAG: 0 };
  for (const row of rows) {
    byLevel[row.assessment.level] += 1;
  }
  return { total: rows.length, byLevel };
}

/**
 * DB I/O: laad ACTIEVE samenwerkingen en bereken DBA-assessments.
 * Resultaat is gesorteerd via sortDbaRows (hoogste risico eerst).
 */
export async function loadDbaOverview(now: Date = new Date()): Promise<DbaOverviewRow[]> {
  const collaborations = await prisma.collaboration.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      startDate: true,
      freelancerId: true,
      companyId: true,
      freelancer: {
        select: {
          userId: true,
          user: { select: { name: true } },
        },
      },
      company: {
        select: {
          userId: true,
          name: true,
        },
      },
      job: {
        select: {
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
        },
      },
    },
  });

  // Omzet per ZZP'er gesplitst per opdrachtgever, uit de gerealiseerde OMZET-boekingen.
  const freelancerIds = [...new Set(collaborations.map((c) => c.freelancer.userId))];
  const revenueRows = await prisma.administrationEntry.findMany({
    where: { account: "OMZET", ownerUserId: { in: freelancerIds }, invoiceId: { not: null } },
    select: { ownerUserId: true, creditCents: true, debitCents: true, invoiceId: true },
  });

  // Resolve de opdrachtgever per factuur (AdministrationEntry heeft geen invoice-relatie).
  const invoiceIds = [
    ...new Set(revenueRows.map((r) => r.invoiceId).filter((x): x is string => !!x)),
  ];
  const invoices = invoiceIds.length
    ? await prisma.invoice.findMany({
        where: { id: { in: invoiceIds } },
        select: { id: true, counterpartyUserId: true },
      })
    : [];
  const invoiceClient = new Map(invoices.map((i) => [i.id, i.counterpartyUserId]));

  // revenueByFreelancer[freelancerUserId][clientUserId] = omzet in centen (credit-saldo).
  const revenueByFreelancer = new Map<string, Record<string, number>>();
  for (const r of revenueRows) {
    const fid = r.ownerUserId;
    const cid = r.invoiceId ? invoiceClient.get(r.invoiceId) : null;
    if (!fid || !cid) continue;
    const map = revenueByFreelancer.get(fid) ?? {};
    map[cid] = (map[cid] ?? 0) + r.creditCents - r.debitCents;
    revenueByFreelancer.set(fid, map);
  }

  const thresholds = await getDbaThresholds();

  // Dóórlopende relatieduur: overbrug terug-op-terug inzetten bij hetzelfde paar (Wet DBA).
  const spansByPair = await loadRelationshipSpans(
    collaborations.map((c) => ({ freelancerId: c.freelancerId, companyId: c.companyId })),
  );

  const rows: DbaOverviewRow[] = collaborations.map((c) => {
    const fid = c.freelancer.userId;
    const clientUserId = c.company.userId;
    const spans = spansByPair.get(relationshipPairKey(c.freelancerId, c.companyId)) ?? [
      { start: c.startDate, end: null },
    ];
    const relationshipStartDate = effectiveRelationshipStart(
      spans,
      c.startDate,
      now,
      DBA_RELATIONSHIP_GAP_BRIDGE_DAYS,
    );
    const bridgedPriorPlacements = bridgedPriorPlacementCount(spans, relationshipStartDate);
    const assessment = assessCollaborationDba(
      {
        collaborationId: c.id,
        startDate: relationshipStartDate,
        bridgedPriorPlacements,
        revenueConcentrationPct: revenueConcentrationPct(
          revenueByFreelancer.get(fid) ?? {},
          clientUserId,
        ),
        ...jobDbaIndicators(c.job),
      },
      now,
      thresholds,
    );
    return {
      collaborationId: c.id,
      jobTitle: c.job.title,
      companyName: c.company.name,
      freelancerName: c.freelancer.user.name,
      startDate: c.startDate,
      relationshipStartDate,
      bridgedPriorPlacements,
      assessment,
    };
  });

  return sortDbaRows(rows);
}

// Re-exporteer DBA_SIGNAL_LEVELS voor gebruik in de UI zonder extra import.
export { DBA_SIGNAL_LEVELS };
export type { DbaAssessment, DbaSignalLevel };
