/**
 * Plaatsingen-per-maand trend voor de bemiddelaar: de operationele doorzet-tegenhanger van de
 * geld-trends op `/inzicht`. Waar "Doorgezet volume" en "Fee per maand" in euro's meten, telt dit
 * hoevéél nieuwe samenwerkingen per kalendermaand tot stand kwamen — de kern-throughput van een
 * bemiddelaar (recruitment-KPI "plaatsingen").
 *
 * Puur en deterministisch. Hergebruikt exact de maand-bucketing (`monthlyRevenue`) en delta
 * (`monthDeltaPct`) uit `./revenue` door elke plaatsing als één "cent" te tellen — zo kan het
 * maandraster (TZ Europe/Amsterdam, maandgrenzen, korte NL-labels) niet driften met de geld-trends.
 * Geld/aantallen in integer; read-only, geen mutaties.
 */

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { monthlyRevenue, monthDeltaPct } from "./revenue";

export interface PlacementsMonth {
  /** Sleutel "YYYY-MM" in Europe/Amsterdam. */
  key: string;
  /** Korte NL-maandlabel, bv. "jan". */
  label: string;
  /** Aantal plaatsingen in die maand. */
  count: number;
}

export interface PlacementsTrend {
  series: PlacementsMonth[];
  /** Procentuele verandering laatste maand vs. voorlaatste; null zonder vergelijkbare basis. */
  deltaPct: number | null;
  /** Aantal plaatsingen in de lopende maand. */
  currentCount: number;
  /** Totaal aantal plaatsingen in het venster. */
  totalCount: number;
  /** Aantal getoonde maanden. */
  months: number;
  hasData: boolean;
}

/** Één plaatsing = de effectieve plaatsingsdatum (agreed start ?? aanmaak). */
export interface PlacementSource {
  occurredAt: Date;
}

/**
 * Pure aggregator: bouwt een PlacementsTrend op uit een rij plaatsingsdata. Telt elke plaatsing als
 * één "cent" door `monthlyRevenue` heen, zodat het maandraster identiek is aan de geld-trends.
 */
export function buildPlacementsTrend(
  rows: PlacementSource[],
  now: Date,
  months = 6,
): PlacementsTrend {
  const raw = monthlyRevenue(
    rows.map((r) => ({ occurredAt: r.occurredAt, totalCents: 1 })),
    now,
    months,
  );
  const series: PlacementsMonth[] = raw.map((m) => ({
    key: m.key,
    label: m.label,
    count: m.cents,
  }));
  return {
    series,
    deltaPct: monthDeltaPct(raw),
    currentCount: series.at(-1)?.count ?? 0,
    totalCount: series.reduce((sum, m) => sum + m.count, 0),
    months,
    hasData: series.some((m) => m.count > 0),
  };
}

/**
 * Eerste dag (UTC) van de vroegste getoonde maand — de DB-vloer, zodat we niet de volledige
 * samenwerkingshistorie ophalen. Spiegelt `revenueWindowStart` in `./revenue-trend`.
 */
function windowStart(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

// Veiligheidscap op de query-omvang. Ruim boven een realistisch aantal plaatsingen per 6 maanden
// per bemiddeling; bucketing negeert bovendien alles buiten het venster.
const MAX_PLACEMENTS = 500;

/**
 * Plaatsingen-per-maand trend voor de ingelogde bemiddelaar: nieuwe samenwerkingen die via zijn
 * bemiddeling (`job.tenantId`) een echte inzet werden — status ACTIVE of COMPLETED (een PROPOSED die
 * nooit startte of een CANCELLED telt niet als plaatsing). De plaatsingsdatum is de afgesproken
 * startdatum (`startDate`), met de aanmaakdatum (`createdAt`) als terugval voor legacy-rijen zonder
 * startdatum. Read-only; alleen geaggregeerde tellingen.
 */
export async function getTenantPlacementsTrend(
  actor: Actor,
  now: Date = new Date(),
  months = 6,
): Promise<PlacementsTrend> {
  const tenantId = actor.tenantId;
  if (!tenantId) return buildPlacementsTrend([], now, months);

  const floor = windowStart(now, months);
  const collaborations = await prisma.collaboration.findMany({
    where: {
      job: { tenantId },
      status: { in: ["ACTIVE", "COMPLETED"] },
      // Effectieve plaatsingsdatum ≥ vloer: startDate wanneer gezet, anders (legacy) createdAt.
      OR: [{ startDate: { gte: floor } }, { startDate: null, createdAt: { gte: floor } }],
    },
    select: { startDate: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: MAX_PLACEMENTS,
  });

  const rows: PlacementSource[] = collaborations.map((c) => ({
    occurredAt: c.startDate ?? c.createdAt,
  }));
  return buildPlacementsTrend(rows, now, months);
}
