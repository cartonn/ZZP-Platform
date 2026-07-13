import { invoiceGroup } from "@/lib/invoice-filter";

/**
 * "Nog te factureren" — geleverd/goedgekeurd werk waarvan het geld nog niet in beweging is.
 *
 * In de cascade ontstaat na goedkeuring van een prestatie automatisch een concept-factuur
 * (`lifecycleStatus="DRAFT"`); de ZZP'er moet die nog indienen (event C) voordat de opdrachtgever
 * betaalt. Daarnaast bestaat de losse, nog-niet-verzonden legacy-DRAFT-factuur. Beide zijn "geld dat
 * blijft liggen". We bepalen het lidmaatschap cascade-bewust via `invoiceGroup` — exact dezelfde bron
 * als de "Concept"-pill op /facturen — zodat de dashboard-blik nooit uit de pas loopt met de lijst.
 *
 * Pure functie → unit-testbaar zonder database.
 */

const MS_PER_DAY = 86_400_000;

/** Vanaf hoeveel dagen een concept-factuur "blijft liggen" (aging-signaal op de tegel). */
export const UNBILLED_AGING_DAYS = 7;

export interface UnbilledInvoiceRow {
  lifecycleStatus: string | null;
  status: string;
  totalCents: number;
  createdAt: Date;
}

export interface UnbilledInvoiceSummary {
  count: number;
  /** Brutobedrag (incl. BTW) van alle concept-facturen samen. */
  grossCents: number;
  /** Hele dagen sinds de oudste concept-factuur ontstond (aging-signaal). */
  oldestAgeDays: number;
  /** True zodra de oudste concept-factuur ≥ UNBILLED_AGING_DAYS blijft liggen. */
  aging: boolean;
}

/**
 * Vat de concept-facturen van een ZZP'er samen. Geeft `null` wanneer er niets te factureren is
 * (geen tegel = geen ruis op het dashboard).
 */
export function summarizeUnbilledInvoices(
  rows: UnbilledInvoiceRow[],
  now: number,
): UnbilledInvoiceSummary | null {
  let count = 0;
  let grossCents = 0;
  let oldest = Infinity;

  for (const row of rows) {
    if (invoiceGroup(row) !== "concept") continue;
    count += 1;
    grossCents += row.totalCents;
    const created = row.createdAt.getTime();
    if (created < oldest) oldest = created;
  }

  if (count === 0) return null;

  const oldestAgeDays =
    oldest === Infinity ? 0 : Math.max(0, Math.floor((now - oldest) / MS_PER_DAY));

  return { count, grossCents, oldestAgeDays, aging: oldestAgeDays >= UNBILLED_AGING_DAYS };
}
