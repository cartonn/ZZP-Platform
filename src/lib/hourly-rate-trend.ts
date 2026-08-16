/**
 * Gemiddeld-uurtarief-per-maand-trend voor de ZZP'er op /inzicht. De tarief-tegenhanger van de
 * omzet-/winst-/uren-trends: niet hoevéél uur er is gewerkt of hoeveel er is verdiend, maar tegen
 * welk gemiddeld uurtarief — zodat de ZZP'er ziet of zijn tarief over tijd stijgt of erodeert
 * (betere opdrachtgevers/onderhandeling vs. bijklussen tegen een laag tarief).
 *
 * Bron: exact dezelfde goedgekeurde uren-prestaties als `worked-hours-trend` (`Performance.status ===
 * "APPROVED"`, `type === "HOURS"`), met het bevroren uurtarief-snapshot (`rateCents`). Het maandcijfer
 * is een NAAR UREN GEWOGEN gemiddelde: `Σ(rateCents × uren) / Σ(uren)`, niet het rekenkundig gemiddelde
 * van de tarieven — een maand met 100 uur à €80 en 4 uur à €40 leest als ~€78/u, niet €60/u. Dit is het
 * afgesproken basistarief exclusief ORT-toeslagen (een schone, ondubbelzinnige metriek; de effectieve
 * opbrengst-per-uur inclusief ORT is een andere maat en zou met de ORT-motor kunnen driften).
 *
 * Hergebruikt de identieke maand-bucketing (`monthlyRevenue`) en delta-berekening (`monthDeltaPct`)
 * uit `./revenue`, zodat de tariefstrip nooit driftet met de geldtrends (zelfde tijdzone
 * Europe/Amsterdam, zelfde maandgrenzen, zelfde ankerlogica tegen maandgrens-/zomertijdrandjes).
 * Read-only; geen mutaties, geen schema.
 */

import { prisma } from "@/lib/db";
import { monthlyRevenue, monthDeltaPct } from "@/lib/revenue";

/** Eén goedgekeurde uren-prestatie, teruggebracht tot het moment, de uren en het uurtarief-snapshot. */
export interface HourlyRateRow {
  /** Wanneer het werk plaatsvond (periode-einde); bepaalt de maandbucket. */
  occurredAt: Date;
  /** Gewerkte uren (mag kwartieren). */
  hours: number;
  /** Bevroren uurtarief in centen bij goedkeuring. */
  rateCents: number;
}

export interface HourlyRateMonth {
  key: string; //         "YYYY-MM" (Europe/Amsterdam, stabiel sorteerbaar)
  label: string; //       korte NL-maandlabel (bv. "mrt")
  /** Naar uren gewogen gemiddeld uurtarief in centen; null als er die maand geen uren zijn. */
  rateCents: number | null;
  hours: number; //       gewerkte uren in die maand (kwartier-precisie bewaard)
}

export interface HourlyRateTrend {
  series: HourlyRateMonth[];
  /** Procentuele verandering t.o.v. de vorige maand; null zonder vergelijkbare basis. */
  deltaPct: number | null;
  /** Gewogen gemiddeld uurtarief in de lopende (laatste) maand; null als die maand geen uren heeft. */
  currentRateCents: number | null;
  /** Gewogen gemiddeld uurtarief over het hele venster (Σ verdiend / Σ uren); null zonder uren. */
  averageRateCents: number | null;
  /** Venstergrootte in maanden. */
  months: number;
  /** false zolang geen enkele maand positieve uren heeft. */
  hasData: boolean;
}

/** Uren → integer-honderdsten, zodat de som-bucketing kwartieren exact bewaart. */
function toHundredths(hours: number): number {
  return Math.round(hours * 100);
}

/**
 * Pure aggregator: bouwt een gemiddeld-uurtarief-trend uit een rij prestatie-momenten. Draait twee
 * parallelle sommen door dezelfde `monthlyRevenue`-bucketing (identieke sleutels/labels/volgorde): het
 * verdiende basisbedrag (`rateCents × uren`) en de uren (als honderdsten). Per maand is het tarief het
 * gewogen gemiddelde `verdiend / uren`; maanden zonder uren krijgen `rateCents: null`. Geen I/O.
 */
export function buildHourlyRateTrend(
  rows: readonly HourlyRateRow[],
  now: Date,
  months = 6,
): HourlyRateTrend {
  // rateCents × hours = het verdiende basisbedrag in centen voor die prestatie (integer via afronding).
  const earned = monthlyRevenue(
    rows.map((r) => ({ occurredAt: r.occurredAt, totalCents: Math.round(r.rateCents * r.hours) })),
    now,
    months,
  );
  const hours = monthlyRevenue(
    rows.map((r) => ({ occurredAt: r.occurredAt, totalCents: toHundredths(r.hours) })),
    now,
    months,
  );

  const series: HourlyRateMonth[] = earned.map((m, i) => {
    // `earned` en `hours` komen uit dezelfde `monthlyRevenue`-aanroep → identieke lengte/volgorde.
    const hoursHundredths = hours[i]?.cents ?? 0;
    return {
      key: m.key,
      label: m.label,
      hours: hoursHundredths / 100,
      // gewogen gemiddelde = verdiende centen / uren; uren als honderdsten terug naar uren.
      rateCents: hoursHundredths > 0 ? Math.round((m.cents * 100) / hoursHundredths) : null,
    };
  });

  const totalEarnedCents = earned.reduce((sum, m) => sum + m.cents, 0);
  const totalHoursHundredths = hours.reduce((sum, m) => sum + m.cents, 0);

  // Delta over een schone tarief-reeks: maanden zonder uren tellen als 0 → monthDeltaPct geeft null
  // (het guard't op prev/cur > 0), precies zoals bedoeld voor een lege lopende maand.
  const rateSeriesForDelta = series.map((m) => ({
    key: m.key,
    label: m.label,
    cents: m.rateCents ?? 0,
  }));

  return {
    series,
    deltaPct: monthDeltaPct(rateSeriesForDelta),
    currentRateCents: series.at(-1)?.rateCents ?? null,
    averageRateCents:
      totalHoursHundredths > 0 ? Math.round((totalEarnedCents * 100) / totalHoursHundredths) : null,
    months,
    hasData: series.some((m) => m.hours > 0),
  };
}

/** Eerste dag (UTC) van de vroegste maand in het venster — de DB-vloer voor de fetcher. */
function windowStart(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

/**
 * Gemiddeld-uurtarief-trend voor de ingelogde ZZP'er: leest de eigen goedgekeurde uren-prestaties met
 * een geldig tarief (venster-gescoopt op de werkperiode) en aggregeert ze. De maandbucket volgt het
 * periode-einde (waar het werk viel), met veilige terugval op periode-begin en goedkeuringsdatum als
 * een periode ontbreekt. Owner-gescoopt via de samenwerking; geen andermans uren. Read-only.
 */
export async function getFreelancerHourlyRateTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<HourlyRateTrend> {
  const floor = windowStart(now, months);
  const rows = await prisma.performance.findMany({
    where: {
      status: "APPROVED",
      type: "HOURS",
      collaboration: { freelancer: { userId } },
      OR: [{ periodEnd: { gte: floor } }, { periodEnd: null, approvedAt: { gte: floor } }],
    },
    select: { hours: true, rateCents: true, periodEnd: true, periodStart: true, approvedAt: true },
  });

  return buildHourlyRateTrend(pricedHourlyRateRows(rows, now), now, months);
}

/**
 * Gemiddeld-uurtarief-trend voor de ingelogde opdrachtgever: de kosten-tegenhanger van de ZZP'er-
 * variant. Leest exact dezelfde goedgekeurde uren-prestaties, maar gescoopt op de samenwerkingen van
 * dít bedrijf (`collaboration.company.userId`), en aggregeert ze via de identieke pure
 * `buildHourlyRateTrend`. Zo ziet de opdrachtgever of het gemiddelde uurtarief dat hij betaalt over
 * tijd oploopt (tariefinflatie) of daalt. Owner-gescoopt; nooit een andermans samenwerking. Read-only.
 */
export async function getClientHourlyRateTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<HourlyRateTrend> {
  const floor = windowStart(now, months);
  const rows = await prisma.performance.findMany({
    where: {
      status: "APPROVED",
      type: "HOURS",
      collaboration: { company: { userId } },
      OR: [{ periodEnd: { gte: floor } }, { periodEnd: null, approvedAt: { gte: floor } }],
    },
    select: { hours: true, rateCents: true, periodEnd: true, periodStart: true, approvedAt: true },
  });

  return buildHourlyRateTrend(pricedHourlyRateRows(rows, now), now, months);
}

/** Gedeelde normalisatie: filter op echte uren + geldig tarief en kies het bucket-moment (periode-einde). */
function pricedHourlyRateRows(
  rows: readonly {
    hours: number | null;
    rateCents: number | null;
    periodEnd: Date | null;
    periodStart: Date | null;
    approvedAt: Date | null;
  }[],
  now: Date,
): HourlyRateRow[] {
  return (
    rows
      // Alleen prestaties met echte uren én een geldig tarief tellen mee voor een gewogen gemiddelde.
      .filter((r) => (r.hours ?? 0) > 0 && (r.rateCents ?? 0) > 0)
      .map((r) => ({
        occurredAt: r.periodEnd ?? r.periodStart ?? r.approvedAt ?? now,
        hours: r.hours ?? 0,
        rateCents: r.rateCents ?? 0,
      }))
  );
}
