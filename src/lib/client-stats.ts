// Rol-gerichte BI voor de opdrachtgever (punt 3b). Pure afgeleide helpers + één DB-functie. Geld in
// integer-centen. Read-only inzicht; scoping op de eigen company. Spiegelt admin-stats.ts.

import { prisma } from "@/lib/db";
import { clientCredentialAlerts } from "@/lib/collaboration-alerts";
import { ratePercent } from "@/lib/freelancer-stats";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";
import { plural } from "@/lib/plural";

/**
 * Korte NL-context onder de vervullingsgraad-tegel: "X van je Y opdrachten heeft een plaatsing".
 * Maakt het kale percentage duidbaar. Zonder gepubliceerde opdrachten valt het percentage weg,
 * dus tonen we de uitnodiging om te plaatsen. Pure functie (geen I/O) — unit-testbaar.
 */
export function fillRateHint(filledJobs: number, publishedJobs: number): string {
  if (publishedJobs === 0) return "Nog geen opdrachten geplaatst";
  return `${filledJobs} van je ${plural(publishedJobs, "opdracht", "opdrachten")} heeft een plaatsing`;
}

export interface ClientStats {
  /** Betaalde facturen (uitgaven die voldaan zijn). */
  spentCents: number;
  /** Ontvangen, nog niet betaalde facturen. */
  openCents: number;
  publishedJobs: number;
  /** Gepubliceerde opdrachten waarvoor een samenwerking loopt of is afgerond. */
  filledJobs: number;
  /** Vervullingsgraad: vervulde / gepubliceerde opdrachten. */
  fillRate: number;
  activeCollaborations: number;
  completedCollaborations: number;
  /** Samenwerkingen per status (CollaborationStatus → aantal), voor de statusdonut. */
  collaborationsByStatus: Record<string, number>;
  /** Actieve inzetten zonder compliance-waarschuwing. */
  compliantPlacements: number;
  /** Compliance-graad over de actieve inzetten (100 bij geen actieve inzetten). */
  complianceRate: number;
  /** Reacties op de eigen opdrachten per status (ApplicationStatus → aantal), voor de reactie-trechter. */
  applicationsByStatus: Record<string, number>;
  /**
   * Aanmaakmoment van de langst wachtende, nog onbekeken (NEW) reactie op de eigen opdrachten; `null`
   * als er geen NEW-reactie is. Voedt de "langst wachtende"-leeftijd in de reactie-trechter — een
   * ghosting-risicosignaal. `createdAt` is onveranderlijk, dus een betrouwbare leeftijdsbron.
   */
  oldestUnreviewedApplicationAt: Date | null;
}

/**
 * BI voor de ingelogde opdrachtgever, of `null` als er (nog) geen bedrijfsprofiel is. Scoping op de
 * eigen company (geen cijfers van andere opdrachtgevers).
 */
export async function getClientStats(userId: string): Promise<ClientStats | null> {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!company) return null;

  const [
    paid,
    open,
    publishedJobs,
    filledJobs,
    collabRows,
    alerts,
    activeCount,
    appRows,
    oldestNew,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { counterpartyUserId: userId, status: "PAID" },
      _sum: { totalCents: true },
    }),
    prisma.invoice.aggregate({
      // Cascade-bewust: cascade-facturen blijven status='DRAFT' en gelden als openstaand op hun
      // lifecycleStatus (SUBMITTED/APPROVED/OVERDUE); legacy-facturen op status SENT/OVERDUE.
      where: { counterpartyUserId: userId, ...outstandingInvoiceWhere },
      _sum: { totalCents: true },
    }),
    prisma.job.count({
      where: { companyId: company.id, status: { in: ["PUBLISHED", "CLOSED"] } },
    }),
    prisma.job.count({
      where: {
        companyId: company.id,
        status: { in: ["PUBLISHED", "CLOSED"] },
        collaborations: { some: { status: { in: ["ACTIVE", "COMPLETED"] } } },
      },
    }),
    prisma.collaboration.groupBy({
      by: ["status"],
      where: { companyId: company.id },
      _count: { _all: true },
    }),
    clientCredentialAlerts(userId),
    prisma.collaboration.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    // Reacties op de eigen opdrachten, per status — voor de kandidaat-/reactie-trechter op /inzicht.
    prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId: company.id } },
      _count: { _all: true },
    }),
    // Langst wachtende, nog onbekeken reactie — voedt het ghosting-risicosignaal in de trechter.
    prisma.application.aggregate({
      where: { status: "NEW", job: { companyId: company.id } },
      _min: { createdAt: true },
    }),
  ]);

  const collabByStatus = new Map(collabRows.map((r) => [r.status, r._count._all]));
  const appByStatus = new Map(appRows.map((r) => [r.status, r._count._all]));
  const compliantPlacements = Math.max(0, activeCount - alerts.length);

  return {
    spentCents: paid._sum.totalCents ?? 0,
    openCents: open._sum.totalCents ?? 0,
    publishedJobs,
    filledJobs,
    fillRate: ratePercent(filledJobs, publishedJobs),
    activeCollaborations: collabByStatus.get("ACTIVE") ?? 0,
    completedCollaborations: collabByStatus.get("COMPLETED") ?? 0,
    collaborationsByStatus: Object.fromEntries(collabByStatus),
    compliantPlacements,
    complianceRate: activeCount === 0 ? 100 : ratePercent(compliantPlacements, activeCount),
    applicationsByStatus: Object.fromEntries(appByStatus),
    oldestUnreviewedApplicationAt: oldestNew._min.createdAt ?? null,
  };
}
