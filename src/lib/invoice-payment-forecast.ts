// Verwachte-betaaldatum voor een openstaande ZZP-factuur — deterministisch en uitlegbaar.
//
// Het facturen-overzicht toont per openstaande factuur de contractuele vervaldatum (`invoice-due.ts`),
// maar dat is de jurídische deadline, niet wanneer het geld realistisch binnenkomt. De #1
// cashflow-vraag van een ZZP'er is "wanneer krijg ik mijn geld?". Deze pure functie beantwoordt die
// vraag door het historische betaalgedrag van déze opdrachtgever (gemiddeld aantal dagen na
// factuurdatum, uit `computePaymentBehavior`) op de factuurdatum te projecteren.
//
// Server-side waarheid: alleen tonen, nooit beslissen. De forecast verandert geen status en stuurt
// geen geldstroom; het is een verwachting voor de ZZP'er, geen toezegging.

const MS_PER_DAY = 86_400_000;

/** Vanaf hoeveel betaalde facturen van deze opdrachtgever een historie-projectie betrouwbaar is. */
export const PAYOUT_FORECAST_MIN_SAMPLE = 3;

export interface PayoutForecastInput {
  /** Factuurdatum (Invoice.issuedAt) — het anker waarop de gemiddelde betaaltermijn wordt opgeteld. */
  issuedAt: Date | null;
  /** Contractuele vervaldatum (Invoice.dueAt) — fallback-anker zonder voldoende historie. */
  dueAt: Date | null;
  /** Gemiddeld aantal dagen factuurdatum→betaling van deze opdrachtgever (computePaymentBehavior). */
  avgDaysToPay: number | null;
  /** Aantal betaalde facturen waarop het gemiddelde rust. */
  sampleSize: number;
}

/** Waarop de verwachting rust: gemeten historie van deze opdrachtgever, of enkel de vervaldatum. */
export type PayoutForecastBasis = "history" | "due";

export interface PayoutForecast {
  /** Verwachte betaaldatum. */
  expectedAt: Date;
  basis: PayoutForecastBasis;
  /** True wanneer de verwachting op gemeten betaalhistorie rust (i.p.v. de contractuele vervaldag). */
  confident: boolean;
  /** Aantal dagen waarmee de verwachting later valt dan de vervaldatum (>0 = na de vervaldag). */
  daysAfterDue: number | null;
}

/**
 * Leidt de verwachte betaaldatum af voor een openstaande factuur. Geeft `null` wanneer er niets te
 * projecteren valt (geen factuurdatum én geen vervaldatum).
 *
 * - **history**: genoeg betaalhistorie van deze opdrachtgever (≥ `PAYOUT_FORECAST_MIN_SAMPLE`) én een
 *   gemiddelde betaaltermijn → `issuedAt + avgDaysToPay`. Dit is de betrouwbare ("confident") basis.
 * - **due**: onvoldoende historie → val terug op de contractuele vervaldatum.
 *
 * Het gemiddelde wordt op de factuurdatum geprojecteerd (niet op de vervaldag), omdat
 * `computePaymentBehavior` zijn termijn vanaf `issuedAt` meet — zo blijven meet- en projectie-anker
 * gelijk. Ontbreekt de factuurdatum, dan kan er geen historie-projectie zijn en val we terug op de
 * vervaldatum.
 */
export function forecastInvoicePayout(input: PayoutForecastInput): PayoutForecast | null {
  const { issuedAt, dueAt, avgDaysToPay, sampleSize } = input;

  const hasHistory =
    issuedAt != null && avgDaysToPay != null && sampleSize >= PAYOUT_FORECAST_MIN_SAMPLE;

  if (hasHistory) {
    // avgDaysToPay is geheeltallig (Math.round in computePaymentBehavior); clamp negatief weg.
    const days = Math.max(0, avgDaysToPay);
    const expectedAt = new Date(issuedAt.getTime() + days * MS_PER_DAY);
    return {
      expectedAt,
      basis: "history",
      confident: true,
      daysAfterDue:
        dueAt != null ? Math.round((expectedAt.getTime() - dueAt.getTime()) / MS_PER_DAY) : null,
    };
  }

  if (dueAt != null) {
    return { expectedAt: dueAt, basis: "due", confident: false, daysAfterDue: 0 };
  }

  return null;
}
