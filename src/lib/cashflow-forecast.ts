// Cashflow-vooruitblik voor de ZZP'er — geaggregeerde verwachting op /facturen.
//
// Het facturen-overzicht toont per openstaande factuur al de verwachte betaaldatum
// (`forecastInvoicePayout`), maar niet het geaggregeerde antwoord op de #1 cashflow-vraag van een
// ZZP'er: "hoeveel geld komt er de komende 30 dagen realistisch binnen?" Deze pure functie telt de
// bedragen van de openstaande facturen op naar wanneer betaling wordt verwacht.
//
// Server-side waarheid: alleen tonen, nooit beslissen. De vooruitblik verandert geen status en stuurt
// geen geldstroom — het is een verwachting op basis van gemeten betaalhistorie, geen toezegging. Alleen
// facturen met een op historie gebaseerde ("confident") projectie tellen mee; een enkel-vervaldatum-
// anker is te onzeker om een cashflow-belofte op te bouwen en blijft buiten de telling.

import { type PayoutForecast } from "./invoice-payment-forecast";

const MS_PER_DAY = 86_400_000;

/** Horizon (dagen) voor de "komt binnenkort binnen"-emmer. Eén maand = de gangbare betaaltermijn. */
export const CASHFLOW_HORIZON_DAYS = 30;

export interface CashflowInvoiceInput {
  /** Factuurbedrag inclusief btw (Invoice.totalCents). */
  totalCents: number;
  /**
   * De verwachte-betaaldatum-projectie van deze factuur (uit `forecastInvoicePayout`), of `null` voor
   * een reeds betaalde/afgehandelde factuur of een factuur zonder projectie. Alleen een `confident`
   * (op betaalhistorie gebaseerde) projectie telt mee in de vooruitblik.
   */
  forecast: PayoutForecast | null;
}

export interface CashflowForecast {
  /** Verwacht binnen te komen binnen `CASHFLOW_HORIZON_DAYS` dagen (inclusief reeds verstreken). */
  next30Cents: number;
  next30Count: number;
  /** Verwacht ná de horizon. */
  laterCents: number;
  laterCount: number;
}

/**
 * Telt openstaande facturen op naar wanneer betaling wordt verwacht, op basis van de per-factuur
 * historie-projectie. Puur en deterministisch (klok via `now`), geschikt voor unit-tests zonder DB.
 *
 * - Alleen `confident` projecties (op betaalhistorie van de opdrachtgever) tellen mee — een projectie
 *   die enkel op de contractuele vervaldatum rust is te onzeker voor een cashflow-belofte.
 * - Een projectie waarvan de verwachte datum al is verstreken (te-late factuur) telt als
 *   "binnen 30 dagen": het geld wordt nú verwacht, niet later.
 */
export function summarizeCashflowForecast(
  invoices: CashflowInvoiceInput[],
  now: number,
): CashflowForecast {
  const horizon = now + CASHFLOW_HORIZON_DAYS * MS_PER_DAY;
  let next30Cents = 0;
  let next30Count = 0;
  let laterCents = 0;
  let laterCount = 0;

  for (const inv of invoices) {
    const forecast = inv.forecast;
    if (forecast == null || !forecast.confident) continue;
    if (forecast.expectedAt.getTime() <= horizon) {
      next30Cents += inv.totalCents;
      next30Count += 1;
    } else {
      laterCents += inv.totalCents;
      laterCount += 1;
    }
  }

  return { next30Cents, next30Count, laterCents, laterCount };
}
