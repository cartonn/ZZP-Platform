// Rol-gerichte BI voor de ZZP'er (punt 3b). Pure afgeleide helpers (los testbaar) + één DB-functie
// die alles in één Promise.all ophaalt en aggregeert. Geld in integer-centen. Spiegelt het patroon
// van admin-stats.ts. Geen mutaties — read-only inzicht.

import { prisma } from "@/lib/db";
import { type Availability } from "@/lib/enums";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";
import { paidRevenueInvoiceWhere } from "@/lib/administration/paid-revenue";
import { freelancerIssuedInvoiceWhere } from "@/lib/administration/invoice-party-scope";

export interface FreelancerStats {
  /** Betaalde facturen (omzet die binnen is). */
  earnedCents: number;
  /** Verstuurde, nog niet betaalde facturen. */
  pendingCents: number;
  approvedHours: number;
  activeCollaborations: number;
  completedCollaborations: number;
  applicationsTotal: number;
  applicationsAccepted: number;
  /** Reacties per status (ApplicationStatus → aantal), voor de statusdonut. */
  applicationsByStatus: Record<string, number>;
  /** Samenwerkingen per status (CollaborationStatus → aantal), voor de statusdonut. */
  collaborationsByStatus: Record<string, number>;
  /** Gewonnen-percentage: geaccepteerde reacties t.o.v. totaal. */
  winRate: number;
  /** Gemiddelde match-score over de reacties (0–100), of null zonder reacties. */
  avgMatchScore: number | null;
  availability: Availability;
}

/** Percentage van een deel t.o.v. het totaal (0 bij geen data). Gedeeld door beide BI-libs. */
export function ratePercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * BI voor de ingelogde ZZP'er, of `null` als er (nog) geen freelancer-profiel is. Tenant-neutraal:
 * een ZZP'er ziet altijd alleen zijn eigen cijfers (scoping op userId/profileId).
 */
export async function getFreelancerStats(userId: string): Promise<FreelancerStats | null> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true, availability: true },
  });
  if (!profile) return null;

  const [paid, pending, approvedHours, collabRows, appRows, matchAgg] = await Promise.all([
    prisma.invoice.aggregate({
      // "Betaald" = geld dat binnen is. Net als bij "Openstaand" mist alléén op de legacy
      // `status: "PAID"` filteren élke cascade-factuur: die houdt haar legacy `status` op DRAFT en
      // wordt via `lifecycleStatus` PAID/PROCESSED. De canonieke `paidRevenueInvoiceWhere` dekt
      // beide paden (cascade PAID/PROCESSED, legacy PAID); CREDITED/CANCELLED tellen niet mee.
      // Scoping via `freelancerIssuedInvoiceWhere`: cascade op `issuerUserId`, legacy via de
      // samenwerking — alléén op `issuerUserId` filteren miste élke ná de cutover handmatig gemaakte
      // factuur (die zet geen issuerUserId), dus betaalde omzet bleef onzichtbaar op het dashboard.
      where: { AND: [freelancerIssuedInvoiceWhere(userId), paidRevenueInvoiceWhere] },
      _sum: { totalCents: true },
    }),
    prisma.invoice.aggregate({
      // "Openstaand" = nog te ontvangen omzet. De legacy `status`-kolom spiegelt de
      // cascade-`lifecycleStatus` maar deels: een cascade-factuur (de primaire flow) houdt haar
      // legacy `status` op DRAFT terwijl ze SUBMITTED of APPROVED is — pas PAID/CANCELLED (en later
      // via de te-laat-cron OVERDUE) worden teruggespiegeld. Alleen op `status IN (SENT,OVERDUE)`
      // filteren mist dus élke openstaande cascade-factuur tot de betaaltermijn verstrijkt, waardoor
      // de KPI de echte openstaande omzet tot ~30 dagen per factuur ondertelt. De canonieke
      // `outstandingInvoiceWhere` (OR over lifecycle SUBMITTED/APPROVED/OVERDUE + legacy SENT/OVERDUE)
      // dekt beide paden; PAID/CANCELLED/DRAFT tellen niet mee. Persona-sweep run 79.
      // Scoping via `freelancerIssuedInvoiceWhere` (cascade + legacy), zie de "betaald"-aggregatie.
      where: { AND: [freelancerIssuedInvoiceWhere(userId), outstandingInvoiceWhere] },
      _sum: { totalCents: true },
    }),
    prisma.performance.aggregate({
      where: { collaboration: { freelancerId: profile.id }, status: "APPROVED", type: "HOURS" },
      _sum: { hours: true },
    }),
    prisma.collaboration.groupBy({
      by: ["status"],
      where: { freelancerId: profile.id },
      _count: { _all: true },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { freelancerId: profile.id },
      _count: { _all: true },
    }),
    prisma.application.aggregate({
      where: { freelancerId: profile.id, matchScore: { not: null } },
      _avg: { matchScore: true },
    }),
  ]);

  const collabByStatus = new Map(collabRows.map((r) => [r.status, r._count._all]));
  const appByStatus = new Map(appRows.map((r) => [r.status, r._count._all]));
  const applicationsTotal = appRows.reduce((sum, r) => sum + r._count._all, 0);
  const applicationsAccepted = appByStatus.get("ACCEPTED") ?? 0;
  const avg = matchAgg._avg.matchScore;

  return {
    earnedCents: paid._sum.totalCents ?? 0,
    pendingCents: pending._sum.totalCents ?? 0,
    approvedHours: approvedHours._sum.hours ?? 0,
    activeCollaborations: collabByStatus.get("ACTIVE") ?? 0,
    completedCollaborations: collabByStatus.get("COMPLETED") ?? 0,
    applicationsTotal,
    applicationsAccepted,
    applicationsByStatus: Object.fromEntries(appByStatus),
    collaborationsByStatus: Object.fromEntries(collabByStatus),
    winRate: ratePercent(applicationsAccepted, applicationsTotal),
    avgMatchScore: avg != null ? Math.round(avg) : null,
    availability: profile.availability as Availability,
  };
}
