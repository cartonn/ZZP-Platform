// KOR-grens tempo-projectie: extrapoleert de omzet-tot-nu naar het tempo over het hele jaar en
// bepaalt of/rond welke maand de ZZP'er de €20.000-omzetgrens van de kleineondernemersregeling
// (KOR) kruist. Een ZZP'er die de KOR toepast is vrijgesteld van BTW; zodra de jaaromzet €20.000
// passeert vervalt de vrijstelling en moet vanaf dat moment BTW worden berekend. Een tijdige,
// gedateerde waarschuwing laat de ZZP'er dit inplannen i.p.v. het pas achteraf te merken.
//
// Pure afleiding op de reeds-getelde jaaromzet — geen query, geen schemawijziging. Indicatief
// (zie TAX_DISCLAIMER); de KOR-administratie blijft mensenwerk.

import { KOR_THRESHOLD_CENTS } from "@/lib/tax/config";

export type KorProjectionStatus =
  | "over" //            de jaaromzet is de grens al gepasseerd
  | "projected_over" //  op het huidige tempo wordt de grens dit jaar nog gekruist
  | "approaching" //     ≥80% van de grens, maar het tempo kruist 'm dit jaar niet
  | "under"; //          ruim onder de grens

export interface KorProjectionInput {
  /** Jaaromzet tot nu (exclusief BTW), in centen. */
  revenueCents: number;
  now: Date;
  /** Overschrijfbaar voor tests; default = wettelijke KOR-grens. */
  thresholdCents?: number;
}

export interface KorProjection {
  status: KorProjectionStatus;
  revenueCents: number;
  thresholdCents: number;
  /** omzet / grens (≥0; kan >1 bij `over`). */
  usedFraction: number;
  /** omzet op jaarbasis, geëxtrapoleerd uit het tempo-tot-nu; null als (nog) niet betrouwbaar. */
  projectedAnnualCents: number | null;
  /** maand (1–12, UTC) waarin de projectie de grens kruist; null als niet dit jaar / al over / geen tempo. */
  projectedCrossMonth: number | null;
  projectedCrossMonthLabel: string | null;
  /** resterende ruimte tot de grens in centen (≥0; 0 zodra over). */
  remainingHeadroomCents: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Minimaal aantal verstreken dagen in het jaar vóór we het tempo vertrouwen (te vroeg = te ruizig). */
export const KOR_PROJECTION_MIN_DAY = 21;
const APPROACHING_FRACTION = 0.8;

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function dayOfYear(now: Date): number {
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  return Math.floor((now.getTime() - startOfYear) / MS_PER_DAY) + 1; // 1-based
}

function daysInYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 366 : 365;
}

export function korThresholdProjection(input: KorProjectionInput): KorProjection {
  const thresholdCents = input.thresholdCents ?? KOR_THRESHOLD_CENTS;
  const revenueCents = Math.max(0, Math.round(input.revenueCents));
  const usedFraction = thresholdCents > 0 ? revenueCents / thresholdCents : 0;
  const remainingHeadroomCents = Math.max(0, thresholdCents - revenueCents);

  const base = {
    revenueCents,
    thresholdCents,
    usedFraction,
    projectedAnnualCents: null as number | null,
    projectedCrossMonth: null as number | null,
    projectedCrossMonthLabel: null as string | null,
    remainingHeadroomCents,
  };

  // Al over de grens: de KOR-vrijstelling is dit jaar vervallen.
  if (revenueCents >= thresholdCents) {
    return { ...base, status: "over", remainingHeadroomCents: 0 };
  }

  const approaching = usedFraction >= APPROACHING_FRACTION;
  const year = input.now.getUTCFullYear();
  const doy = dayOfYear(input.now);

  // Te vroeg in het jaar of nog geen omzet → geen tempo-projectie, val terug op de statische band.
  if (doy < KOR_PROJECTION_MIN_DAY || revenueCents <= 0) {
    return { ...base, status: approaching ? "approaching" : "under" };
  }

  const diy = daysInYear(year);
  const dailyRate = revenueCents / doy; // > 0 hier
  const projectedAnnualCents = Math.round(dailyRate * diy);
  const daysToCross = remainingHeadroomCents / dailyRate;
  const crossDate = new Date(input.now.getTime() + Math.ceil(daysToCross) * MS_PER_DAY);
  const crossesThisYear = crossDate.getUTCFullYear() === year;

  if (crossesThisYear) {
    const month = crossDate.getUTCMonth() + 1;
    return {
      ...base,
      status: "projected_over",
      projectedAnnualCents,
      projectedCrossMonth: month,
      projectedCrossMonthLabel: MONTHS_NL[month - 1] ?? null,
    };
  }

  return { ...base, status: approaching ? "approaching" : "under", projectedAnnualCents };
}
