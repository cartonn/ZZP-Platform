/**
 * Omzettrend per rol: puur berekenen via `buildRevenueTrend` + drie DB-fetchers
 * (freelancer, opdrachtgever, franchiser). Hergebruikt `monthlyRevenue` en
 * `monthDeltaPct` uit `./revenue`; implementeert zelf niets dubbel.
 * Geld in integer-centen. Read-only; geen mutaties.
 */

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { monthlyRevenue, monthDeltaPct, type RevenueSource } from "./revenue";
import { revenueCountedInvoiceWhere } from "./administration/revenue-recognition";

export type { RevenueMonth } from "./revenue";

export interface RevenueTrend {
  series: ReturnType<typeof monthlyRevenue>;
  deltaPct: number | null;
  currentCents: number;
  totalCents: number;
  hasData: boolean;
}

/**
 * Eerste dag (UTC) van de vroegste maand die `monthlyRevenue` toont — de DB-vloer voor de fetchers,
 * zodat we niet de volledige factuurhistorie ophalen om er daarna alles buiten het venster uit te
 * gooien. `monthlyRevenue` bucket per kalendermaand `months-1` terug t.o.v. `now`.
 */
function revenueWindowStart(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

/**
 * Pure mapper: factuurrijen (`issuedAt` gegarandeerd aanwezig in de query) → `RevenueSource`.
 * Centraliseert de identieke vertaling die elke fetcher anders zou dupliceren; `totalCents`
 * valt terug op 0 wanneer (legacy) niet gezet.
 */
export function toRevenueRows(
  invoices: { issuedAt: Date | null; totalCents: number | null }[],
): RevenueSource[] {
  return invoices.map((inv) => ({
    occurredAt: inv.issuedAt!,
    totalCents: inv.totalCents ?? 0,
  }));
}

/** Pure aggregator: bouwt een RevenueTrend op uit een rij RevenueSource-waarden. */
export function buildRevenueTrend(rows: RevenueSource[], now: Date, months = 6): RevenueTrend {
  const series = monthlyRevenue(rows, now, months);
  const deltaPct = monthDeltaPct(series);
  const currentCents = series.at(-1)?.cents ?? 0;
  const totalCents = series.reduce((sum, m) => sum + m.cents, 0);
  const hasData = series.some((m) => m.cents > 0);
  return { series, deltaPct, currentCents, totalCents, hasData };
}

/**
 * Omzettrend voor de ingelogde ZZP'er: facturen waarvan de ZZP'er de uitsteller is. Scoping via de
 * altijd-gevulde relatie (`collaboration.freelancer.userId`) i.p.v. de kolom `issuerUserId` (alleen
 * door de cascade-handler gezet), zodat ook legacy loose-facturen meetellen. Excl.
 * geannuleerde/gecrediteerde en facturen zonder factuurdatum.
 */
export async function getFreelancerRevenueTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<RevenueTrend> {
  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { freelancer: { userId } },
      issuedAt: { gte: revenueWindowStart(now, months) },
      ...revenueCountedInvoiceWhere,
    },
    select: { issuedAt: true, totalCents: true },
  });

  return buildRevenueTrend(toRevenueRows(invoices), now, months);
}

/**
 * Omzettrend voor de ingelogde opdrachtgever: facturen waarvan de opdrachtgever de tegenpartij is.
 * Scoping via de altijd-gevulde relatie (`collaboration.company.userId`) i.p.v. de kolom
 * `counterpartyUserId` (alleen door de cascade-handler gezet), zodat ook legacy loose-facturen
 * meetellen. Excl. geannuleerde/gecrediteerde en zonder factuurdatum.
 */
export async function getClientRevenueTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<RevenueTrend> {
  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { company: { userId } },
      issuedAt: { gte: revenueWindowStart(now, months) },
      ...revenueCountedInvoiceWhere,
    },
    select: { issuedAt: true, totalCents: true },
  });

  return buildRevenueTrend(toRevenueRows(invoices), now, months);
}

/**
 * Omzettrend voor de ingelogde franchisenemer: facturen via tenant-samenwerkingen
 * (`collaboration.job.tenantId`), excl. platform-fees (`issuerUserId` moet aanwezig zijn),
 * excl. geannuleerde en zonder factuurdatum. Geeft een lege trend terug als de actor
 * geen tenant heeft.
 */
export async function getTenantRevenueTrend(
  actor: Actor,
  now: Date = new Date(),
  months = 6,
): Promise<RevenueTrend> {
  const tenantId = actor.tenantId;
  if (!tenantId) return buildRevenueTrend([], now, months);

  const invoices = await prisma.invoice.findMany({
    where: {
      issuedAt: { gte: revenueWindowStart(now, months) },
      ...revenueCountedInvoiceWhere,
      issuerUserId: { not: null },
      collaboration: { job: { tenantId } },
    },
    select: { issuedAt: true, totalCents: true },
  });

  return buildRevenueTrend(toRevenueRows(invoices), now, months);
}

/**
 * Doorzettrend voor het hele platform (admin): het totale gefactureerde volume per maand —
 * elke cascade-transactie wordt door de ZZP'er één keer aan de opdrachtgever gefactureerd, dus
 * sommeren over `issuerUserId not null` telt elke transactie precies één keer en sluit
 * eventuele platform-fee-facturen (`issuerUserId` null) uit. Dit is doorzet/GMV dat via het
 * platform loopt, geen platform-inkomsten (het platform boekt niets — Besluit 1). Excl.
 * geannuleerde/gecrediteerde facturen en facturen zonder factuurdatum.
 */
export async function getPlatformRevenueTrend(
  now: Date = new Date(),
  months = 6,
): Promise<RevenueTrend> {
  const invoices = await prisma.invoice.findMany({
    where: {
      issuedAt: { gte: revenueWindowStart(now, months) },
      ...revenueCountedInvoiceWhere,
      issuerUserId: { not: null },
    },
    select: { issuedAt: true, totalCents: true },
  });

  return buildRevenueTrend(toRevenueRows(invoices), now, months);
}
