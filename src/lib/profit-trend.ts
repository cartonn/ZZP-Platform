/**
 * Winst-per-maand-trend voor de ZZP'er: bucket het grootboek (AdministrationEntry) per
 * kalendermaand en bereken per maand omzet (netto credit op OMZET), kosten (netto debet op
 * KOSTEN) en winst (omzet − kosten). Herbruikt exact de rekening-classificatie van
 * `administration/overview.ts` (dezelfde bron als de YTD-winst op /ontzorgd → geen drift) en de
 * maand-bucketing van `revenue.ts` (`monthlyRevenue`, met dezelfde ankerlogica tegen
 * maandgrens-/zomertijdrandjes). Geld in integer-centen. Read-only; geen mutaties, geen schema.
 */

import { prisma } from "@/lib/db";
import {
  administrationPartyForRole,
  type LedgerEntry,
  type PersonalLedgerParty,
} from "@/lib/administration/overview";
import { monthlyRevenue } from "@/lib/revenue";

export interface ProfitMonth {
  key: string; //          "YYYY-MM"
  label: string; //        korte NL-maandlabel (bv. "mrt")
  revenueCents: number; // omzet in die maand (netto credit op OMZET)
  costCents: number; //    kosten in die maand (netto debet op KOSTEN)
  profitCents: number; //  omzet − kosten (kan negatief zijn — een verliesmaand is eerlijk)
}

export interface ProfitTrend {
  series: ProfitMonth[];
  totalRevenueCents: number;
  totalCostCents: number;
  totalProfitCents: number; //   som over het venster (kan negatief)
  currentProfitCents: number; // winst van de lopende (laatste) maand
  months: number; //             venstergrootte
  hasData: boolean; //           minstens één maand met omzet of kosten
}

/**
 * Pure aggregator: bouwt een winst-trend uit grootboekregels voor één partij. De OMZET- en
 * KOSTEN-reeksen lopen door dezelfde `monthlyRevenue`-bucketing (identieke sleutels/labels/volgorde),
 * zodat ze index-voor-index gecombineerd kunnen worden tot een winstreeks. Geen I/O.
 */
export function buildProfitTrend(
  entries: readonly LedgerEntry[],
  party: PersonalLedgerParty,
  now: Date,
  months = 6,
): ProfitTrend {
  const scoped = entries.filter((e) => e.party === party);

  // Omzet = netto credit op OMZET; kosten = netto debet op KOSTEN. Zelfde tekenconventie als
  // `revenueCents`/`costCents` in administration/overview.ts.
  const revenueRows = scoped
    .filter((e) => e.account === "OMZET")
    .map((e) => ({ occurredAt: e.occurredAt, totalCents: e.creditCents - e.debitCents }));
  const costRows = scoped
    .filter((e) => e.account === "KOSTEN")
    .map((e) => ({ occurredAt: e.occurredAt, totalCents: e.debitCents - e.creditCents }));

  const revenueSeries = monthlyRevenue(revenueRows, now, months);
  const costSeries = monthlyRevenue(costRows, now, months);

  const series: ProfitMonth[] = revenueSeries.map((m, i) => {
    const revenueCents = m.cents;
    const costCents = costSeries[i]?.cents ?? 0;
    return {
      key: m.key,
      label: m.label,
      revenueCents,
      costCents,
      profitCents: revenueCents - costCents,
    };
  });

  const totalRevenueCents = series.reduce((sum, m) => sum + m.revenueCents, 0);
  const totalCostCents = series.reduce((sum, m) => sum + m.costCents, 0);

  return {
    series,
    totalRevenueCents,
    totalCostCents,
    totalProfitCents: totalRevenueCents - totalCostCents,
    currentProfitCents: series.at(-1)?.profitCents ?? 0,
    months,
    hasData: series.some((m) => m.revenueCents !== 0 || m.costCents !== 0),
  };
}

/** Eerste dag (UTC) van de vroegste maand in het venster — de DB-vloer voor de fetcher. */
function windowStart(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

/**
 * Winst-trend voor de ingelogde ZZP'er: leest de eigen grootboekregels (venster-gescoopt op
 * `occurredAt`) en aggregeert ze. Niet-FREELANCER-rollen krijgen een lege trend.
 */
export async function getFreelancerProfitTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<ProfitTrend> {
  const party = administrationPartyForRole("FREELANCER");
  if (!party) return buildProfitTrend([], "FREELANCER", now, months);

  const rows = await prisma.administrationEntry.findMany({
    where: { ownerUserId: userId, occurredAt: { gte: windowStart(now, months) } },
    select: {
      party: true,
      account: true,
      debitCents: true,
      creditCents: true,
      occurredAt: true,
    },
  });

  const entries: LedgerEntry[] = rows.map((r) => ({
    party: r.party as LedgerEntry["party"],
    account: r.account as LedgerEntry["account"],
    debitCents: r.debitCents,
    creditCents: r.creditCents,
    occurredAt: r.occurredAt,
  }));

  return buildProfitTrend(entries, party, now, months);
}
