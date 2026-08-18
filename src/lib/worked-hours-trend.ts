/**
 * Gewerkte-uren-per-maand-trend voor de ZZP'er op /inzicht. De operationele tegenhanger van de
 * omzet-/winst-/kostentrends: hoevéél is er per maand gewerkt (i.p.v. hoeveel er verdiend is), zodat
 * drukke en rustige maanden zichtbaar worden en de ZZP'er zijn capaciteit kan plannen. Telt de uren
 * van goedgekeurde uren-prestaties (`Performance.status === "APPROVED"`, `type === "HOURS"`) — exact
 * dezelfde bron als de directe uren van het urencriterium, zodat beide oppervlakken niet driften.
 *
 * Hergebruikt de identieke maand-bucketing (`monthlyRevenue`) en delta-berekening (`monthDeltaPct`)
 * uit `./revenue`, zodat de urenstrip nooit driftet met de geldtrends (zelfde tijdzone
 * Europe/Amsterdam, zelfde maandgrenzen, zelfde ankerlogica tegen maandgrens-/zomertijdrandjes). Om
 * kwartier-precisie exact te bewaren gaan de uren als integer-honderdsten (uur × 100) door de
 * som-bucketing en worden ze pas op het eind terug naar uren gedeeld. Read-only; geen mutaties, geen
 * schema.
 */

import { prisma } from "@/lib/db";
import { monthlyRevenue, monthDeltaPct } from "@/lib/revenue";

/** Eén goedgekeurde uren-prestatie, teruggebracht tot het moment + de gewerkte uren. */
export interface WorkedHoursRow {
  /** Wanneer het werk plaatsvond (periode-einde); bepaalt de maandbucket. */
  occurredAt: Date;
  /** Gewerkte uren (mag kwartieren). */
  hours: number;
}

export interface WorkedHoursMonth {
  key: string; //    "YYYY-MM" (Europe/Amsterdam, stabiel sorteerbaar)
  label: string; //  korte NL-maandlabel (bv. "mrt")
  hours: number; //  gewerkte uren in die maand (kwartier-precisie bewaard)
}

export interface WorkedHoursTrend {
  series: WorkedHoursMonth[];
  /** Procentuele verandering t.o.v. de vorige maand; null zonder vergelijkbare basis. */
  deltaPct: number | null;
  /** Gewerkte uren in de lopende (laatste) maand van het venster. */
  currentHours: number;
  /** Totaal gewerkte uren over het hele venster. */
  totalHours: number;
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
 * Pure aggregator: bouwt een gewerkte-uren-trend uit een rij prestatie-momenten. Draait de uren als
 * honderdsten door dezelfde `monthlyRevenue`-bucketing als de geldtrends (identieke sleutels/labels/
 * volgorde) en deelt ze pas na het sommeren terug naar uren. Geen I/O.
 */
export function buildWorkedHoursTrend(
  rows: readonly WorkedHoursRow[],
  now: Date,
  months = 6,
): WorkedHoursTrend {
  const source = rows.map((r) => ({ occurredAt: r.occurredAt, totalCents: toHundredths(r.hours) }));
  const raw = monthlyRevenue(source, now, months);
  const series: WorkedHoursMonth[] = raw.map((m) => ({
    key: m.key,
    label: m.label,
    hours: m.cents / 100,
  }));
  const totalHours = series.reduce((sum, m) => sum + m.hours, 0);
  return {
    series,
    deltaPct: monthDeltaPct(raw),
    currentHours: series.at(-1)?.hours ?? 0,
    totalHours,
    months,
    hasData: series.some((m) => m.hours > 0),
  };
}

/** Eerste dag (UTC) van de vroegste maand in het venster — de DB-vloer voor de fetcher. */
function windowStart(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

/**
 * Gewerkte-uren-trend voor de ingelogde ZZP'er: leest de eigen goedgekeurde uren-prestaties
 * (venster-gescoopt op de werkperiode) en aggregeert ze. De maandbucket volgt het periode-einde
 * (waar het werk viel), met veilige terugval op periode-begin en goedkeuringsdatum als een periode
 * ontbreekt. Owner-gescoopt via de samenwerking; geen andermans uren. Read-only.
 */
export async function getFreelancerWorkedHoursTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<WorkedHoursTrend> {
  const floor = windowStart(now, months);
  const rows = await prisma.performance.findMany({
    where: {
      status: "APPROVED",
      type: "HOURS",
      collaboration: { freelancer: { userId } },
      OR: [{ periodEnd: { gte: floor } }, { periodEnd: null, approvedAt: { gte: floor } }],
    },
    select: { hours: true, periodEnd: true, periodStart: true, approvedAt: true },
  });

  return buildWorkedHoursTrend(workedRows(rows, now), now, months);
}

/**
 * Afgenomen-uren-trend voor de ingelogde opdrachtgever: de capaciteits-tegenhanger van de ZZP'er-
 * variant. Leest exact dezelfde goedgekeurde uren-prestaties, maar gescoopt op de samenwerkingen van
 * dít bedrijf (`collaboration.company.userId`), en aggregeert ze via de identieke pure
 * `buildWorkedHoursTrend`. Zo ziet de opdrachtgever hoevéél externe capaciteit (uren) hij per maand
 * afneemt en of die groeit of krimpt — zodat hij vooruit kan plannen. Owner-gescoopt; nooit een
 * andermans samenwerking. Read-only.
 */
export async function getClientWorkedHoursTrend(
  userId: string,
  now: Date = new Date(),
  months = 6,
): Promise<WorkedHoursTrend> {
  const floor = windowStart(now, months);
  const rows = await prisma.performance.findMany({
    where: {
      status: "APPROVED",
      type: "HOURS",
      collaboration: { company: { userId } },
      OR: [{ periodEnd: { gte: floor } }, { periodEnd: null, approvedAt: { gte: floor } }],
    },
    select: { hours: true, periodEnd: true, periodStart: true, approvedAt: true },
  });

  return buildWorkedHoursTrend(workedRows(rows, now), now, months);
}

/** Gedeelde normalisatie: kies het bucket-moment (periode-einde met veilige terugval) + de uren. */
function workedRows(
  rows: readonly {
    hours: number | null;
    periodEnd: Date | null;
    periodStart: Date | null;
    approvedAt: Date | null;
  }[],
  now: Date,
): WorkedHoursRow[] {
  return rows.map((r) => ({
    occurredAt: r.periodEnd ?? r.periodStart ?? r.approvedAt ?? now,
    hours: r.hours ?? 0,
  }));
}
