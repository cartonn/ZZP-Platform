/**
 * Kosten-per-maand-trend voor de ZZP'er op /uitgaven. Puur en deterministisch: hergebruikt
 * de identieke maand-bucketing (`monthlyRevenue`) en delta-berekening (`monthDeltaPct`) uit
 * `./revenue`, zodat de kostenstrip nooit driftet met de omzet-/winsttrends (zelfde tijdzone
 * Europe/Amsterdam, zelfde maandgrenzen, zelfde afronding). Kosten volgen de NETTO-bedragen
 * (exclusief btw), net als de "Kosten dit jaar"-kaart en de winst-per-maand-trend. Geld in
 * integer-centen. Read-only; geen mutaties.
 */

import { monthlyRevenue, monthDeltaPct, type RevenueSource } from "./revenue";

export type { RevenueMonth as ExpenseMonth } from "./revenue";

export interface ExpenseLikeRow {
  occurredAt: Date;
  netCents: number;
}

export interface ExpenseTrend {
  series: ReturnType<typeof monthlyRevenue>;
  /** Procentuele verandering t.o.v. de vorige maand; null zonder vergelijkbare basis. */
  deltaPct: number | null;
  /** Netto kosten in de lopende (laatste) maand van het venster. */
  currentCents: number;
  /** Totale netto kosten over het hele venster. */
  totalCents: number;
  /** false zolang er geen enkele kostenmaand met een positief bedrag is. */
  hasData: boolean;
}

/**
 * Pure mapper: uitgave-rijen → `RevenueSource` (netto centen als "bedrag"). Centraliseert de
 * vertaling zodat de fetcher niet dupliceert. Negatieve/nul netto-bedragen blijven behouden —
 * de bucketing sommeert ze; `hasData` kijkt naar positieve maanden.
 */
export function toExpenseRows(expenses: readonly ExpenseLikeRow[]): RevenueSource[] {
  return expenses.map((e) => ({ occurredAt: e.occurredAt, totalCents: e.netCents }));
}

/** Pure aggregator: bouwt een `ExpenseTrend` op uit een rij `RevenueSource`-waarden. */
export function buildExpenseTrend(rows: RevenueSource[], now: Date, months = 6): ExpenseTrend {
  const series = monthlyRevenue(rows, now, months);
  const deltaPct = monthDeltaPct(series);
  const currentCents = series.at(-1)?.cents ?? 0;
  const totalCents = series.reduce((sum, m) => sum + m.cents, 0);
  const hasData = series.some((m) => m.cents > 0);
  return { series, deltaPct, currentCents, totalCents, hasData };
}

/**
 * Convenience: uitgave-rijen → `ExpenseTrend` in één stap. De aanroeper laadt de uitgaven
 * (owner-gescoopt) en levert `now`; deze functie doet geen I/O.
 */
export function expenseTrend(
  expenses: readonly ExpenseLikeRow[],
  now: Date,
  months = 6,
): ExpenseTrend {
  return buildExpenseTrend(toExpenseRows(expenses), now, months);
}
