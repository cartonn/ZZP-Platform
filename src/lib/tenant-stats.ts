// Rol-gerichte BI voor de franchisenemer (FRANCHISER). Tenant-scoped, read-only inzicht: omzet,
// vulgraad, roster-inzetbaarheid en samenwerkingen — plus een uitsplitsing per opdrachtgever.
// Geld in integer-centen. Spiegelt client-stats.ts; de pure aggregator is apart getest.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { ratePercent } from "@/lib/freelancer-stats";
import { computeEngageability } from "@/lib/engageability";
import { type FreelancerCredential } from "@/lib/matching";
import { type Availability } from "@/lib/enums";
import { paidRevenueInvoiceWhere } from "@/lib/administration/paid-revenue";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";

export interface TenantStats {
  /** Betaalde facturen die via tenant-samenwerkingen lopen. */
  revenuePaidCents: number;
  /** Verstuurd/te laat, nog niet betaald. */
  revenueOpenCents: number;
  companies: number;
  /** Gepubliceerde + gesloten diensten (noemer voor de vulgraad). */
  totalJobs: number;
  /** Diensten waarvoor een samenwerking loopt of is afgerond. */
  filledJobs: number;
  fillRate: number;
  /** Nu gepubliceerd zonder lopende samenwerking — vraagt om invulling. */
  openJobs: number;
  activeCollaborations: number;
  completedCollaborations: number;
  /** Samenwerkingen per status (CollaborationStatus → aantal), voor de statusdonut. */
  collaborationsByStatus: Record<string, number>;
  rosterFreelancers: number;
  /** ZZP'ers met inzetbaarheidsstatus ACTIEF. */
  engageableFreelancers: number;
  engageabilityRate: number;
}

export interface CompanyBreakdownRow {
  companyId: string;
  name: string;
  revenuePaidCents: number;
  totalJobs: number;
  filledJobs: number;
  fillRate: number;
}

/**
 * Pure aggregator: voegt opdrachtgevers, hun diensten (gevuld/ja-nee) en betaalde facturen samen tot
 * één rij per opdrachtgever, gesorteerd op omzet (dan op aantal diensten). Facturen zonder bekende
 * opdrachtgever worden genegeerd. Apart van de DB zodat het deterministisch te testen is.
 */
export function buildCompanyBreakdown(
  companies: readonly { id: string; name: string }[],
  jobs: readonly { companyId: string; filled: boolean }[],
  revenue: readonly { companyId: string | null; totalCents: number }[],
): CompanyBreakdownRow[] {
  const rows = new Map<string, CompanyBreakdownRow>();
  for (const c of companies) {
    rows.set(c.id, {
      companyId: c.id,
      name: c.name,
      revenuePaidCents: 0,
      totalJobs: 0,
      filledJobs: 0,
      fillRate: 0,
    });
  }
  for (const j of jobs) {
    const r = rows.get(j.companyId);
    if (!r) continue;
    r.totalJobs += 1;
    if (j.filled) r.filledJobs += 1;
  }
  for (const inv of revenue) {
    if (!inv.companyId) continue;
    const r = rows.get(inv.companyId);
    if (r) r.revenuePaidCents += inv.totalCents;
  }
  const out = [...rows.values()];
  for (const r of out) r.fillRate = ratePercent(r.filledJobs, r.totalJobs);
  return out.sort((a, b) => b.revenuePaidCents - a.revenuePaidCents || b.totalJobs - a.totalJobs);
}

/**
 * BI voor de ingelogde franchisenemer, of `null` als de actor geen franchise heeft. Alle queries zijn
 * tenant-scoped (geen cijfers van andere franchises).
 */
export async function getTenantStats(
  actor: Actor,
  now: Date = new Date(),
): Promise<TenantStats | null> {
  const tenantId = actor.tenantId;
  if (!tenantId) return null;

  const collabInTenant = { job: { tenantId } };

  const [paid, open, companies, totalJobs, filledJobs, openJobs, collabRows, rosterProfiles] =
    await Promise.all([
      // Cascade-bewust: cascade-facturen houden hun live `status` op 'DRAFT' en bewegen alleen via
      // `lifecycleStatus`. Alléén op `status` filteren mist ELKE cascade-factuur — dezelfde
      // dual-path-regel die client-stats/freelancer-stats gebruiken (paidRevenueInvoiceWhere /
      // outstandingInvoiceWhere), zodat de franchiser-KPI's niet driften van de rest van de app.
      prisma.invoice.aggregate({
        where: { ...paidRevenueInvoiceWhere, collaboration: collabInTenant },
        _sum: { totalCents: true },
      }),
      prisma.invoice.aggregate({
        where: { ...outstandingInvoiceWhere, collaboration: collabInTenant },
        _sum: { totalCents: true },
      }),
      prisma.company.count({ where: { tenantId } }),
      prisma.job.count({ where: { tenantId, status: { in: ["PUBLISHED", "CLOSED"] } } }),
      prisma.job.count({
        where: {
          tenantId,
          status: { in: ["PUBLISHED", "CLOSED"] },
          collaborations: { some: { status: { in: ["ACTIVE", "COMPLETED"] } } },
        },
      }),
      prisma.job.count({
        where: { tenantId, status: "PUBLISHED", collaborations: { none: { status: "ACTIVE" } } },
      }),
      prisma.collaboration.groupBy({
        by: ["status"],
        where: collabInTenant,
        _count: { _all: true },
      }),
      prisma.freelancerProfile.findMany({
        where: { tenantId },
        select: {
          availability: true,
          completeness: true,
          user: { select: { identityVerifiedAt: true, lastLoginAt: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      }),
    ]);

  const byStatus = new Map(collabRows.map((r) => [r.status, r._count._all]));

  const engageableFreelancers = rosterProfiles.filter(
    (f) =>
      computeEngageability(
        {
          credentials: f.credentials.map(
            (c): FreelancerCredential => ({
              type: c.type as FreelancerCredential["type"],
              status: c.status as FreelancerCredential["status"],
              expiresAt: c.expiresAt,
            }),
          ),
          completeness: f.completeness,
          availability: f.availability as Availability,
          identityVerified: f.user.identityVerifiedAt != null,
          lastActiveAt: f.user.lastLoginAt,
        },
        now,
      ).status === "ACTIEF",
  ).length;

  return {
    revenuePaidCents: paid._sum.totalCents ?? 0,
    revenueOpenCents: open._sum.totalCents ?? 0,
    companies,
    totalJobs,
    filledJobs,
    fillRate: ratePercent(filledJobs, totalJobs),
    openJobs,
    activeCollaborations: byStatus.get("ACTIVE") ?? 0,
    completedCollaborations: byStatus.get("COMPLETED") ?? 0,
    collaborationsByStatus: Object.fromEntries(byStatus),
    rosterFreelancers: rosterProfiles.length,
    engageableFreelancers,
    engageabilityRate: ratePercent(engageableFreelancers, rosterProfiles.length),
  };
}

/** Omzet + vulgraad per opdrachtgever binnen de tenant (read-only drill-down voor het inzicht). */
export async function getTenantCompanyBreakdown(actor: Actor): Promise<CompanyBreakdownRow[]> {
  const tenantId = actor.tenantId;
  if (!tenantId) return [];

  const [companies, jobs, paidInvoices] = await Promise.all([
    prisma.company.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    prisma.job.findMany({
      where: { tenantId, status: { in: ["PUBLISHED", "CLOSED"] } },
      select: {
        companyId: true,
        collaborations: {
          where: { status: { in: ["ACTIVE", "COMPLETED"] } },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.invoice.findMany({
      // Cascade-bewust (zie getTenantStats): via de canonieke betaald-regel, niet de legacy `status`.
      where: { ...paidRevenueInvoiceWhere, collaboration: { job: { tenantId } } },
      select: { totalCents: true, collaboration: { select: { companyId: true } } },
    }),
  ]);

  return buildCompanyBreakdown(
    companies,
    jobs.map((j) => ({ companyId: j.companyId, filled: j.collaborations.length > 0 })),
    paidInvoices.map((i) => ({
      companyId: i.collaboration?.companyId ?? null,
      totalCents: i.totalCents ?? 0,
    })),
  );
}
