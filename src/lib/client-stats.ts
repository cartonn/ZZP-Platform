// Rol-gerichte BI voor de opdrachtgever (punt 3b). Pure afgeleide helpers + één DB-functie. Geld in
// integer-centen. Read-only inzicht; scoping op de eigen company. Spiegelt admin-stats.ts.

import { prisma } from "@/lib/db";
import { clientCredentialAlerts } from "@/lib/collaboration-alerts";
import { ratePercent } from "@/lib/freelancer-stats";

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
  /** Actieve inzetten zonder compliance-waarschuwing. */
  compliantPlacements: number;
  /** Compliance-graad over de actieve inzetten (100 bij geen actieve inzetten). */
  complianceRate: number;
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

  const [paid, open, publishedJobs, filledJobs, collabRows, alerts, activeCount] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: { counterpartyUserId: userId, status: "PAID" },
        _sum: { totalCents: true },
      }),
      prisma.invoice.aggregate({
        where: { counterpartyUserId: userId, status: { in: ["SENT", "OVERDUE"] } },
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
    ]);

  const collabByStatus = new Map(collabRows.map((r) => [r.status, r._count._all]));
  const compliantPlacements = Math.max(0, activeCount - alerts.length);

  return {
    spentCents: paid._sum.totalCents ?? 0,
    openCents: open._sum.totalCents ?? 0,
    publishedJobs,
    filledJobs,
    fillRate: ratePercent(filledJobs, publishedJobs),
    activeCollaborations: collabByStatus.get("ACTIVE") ?? 0,
    completedCollaborations: collabByStatus.get("COMPLETED") ?? 0,
    compliantPlacements,
    complianceRate: activeCount === 0 ? 100 : ratePercent(compliantPlacements, activeCount),
  };
}
