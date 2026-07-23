import { invoiceGroup } from "@/lib/invoice-filter";

/**
 * "Aankomend" — de payer-tegenhanger van de ZZP-"Nog te factureren"-blik (`unbilled-invoices.ts`).
 *
 * In de cascade ontstaat na goedkeuring van een prestatie automatisch een concept-factuur
 * (`lifecycleStatus="DRAFT"`); de ZZP'er moet die nog indienen (event C) voordat ze openstaand wordt
 * en de opdrachtgever betaalt. Voor de opdrachtgever is dat bijna-zekere kost die nog niet in de
 * payables-vooruitblik zit (die telt alleen uitgestuurde, openstaande facturen). Deze afleiding vat
 * dat goedgekeurde-maar-nog-niet-uitgestuurde werk samen zodat de payer kan begroten wat er nog aankomt.
 *
 * Bewust géén dubbeltelling met de payables-vooruitblik: die ankert op uitgestuurde (openstaande)
 * facturen (`isInvoiceOutstanding`), hier tellen we uitsluitend de concept-groep (`invoiceGroup`
 * === "concept" — cascade-DRAFT én losse legacy-DRAFT), exact dezelfde bron als de "Concept"-pill.
 * Een concept op een bevroren (disputed) samenwerking is onzeker en telt niet mee — spiegelt de
 * `disputedAt: null`-scoping van de ZZP-unbilled-dataloader.
 *
 * Pure functie → unit-testbaar zonder database.
 */

export interface CommittedCostRow {
  lifecycleStatus: string | null;
  status: string;
  totalCents: number;
  /** True wanneer de onderliggende samenwerking bevroren is (dispuut) — het concept is dan onzeker. */
  disputed: boolean;
}

export interface CommittedCostSummary {
  /** Aantal concept-facturen dat als aankomende kost meetelt. */
  count: number;
  /** Brutobedrag (incl. BTW) van al die concept-facturen samen. */
  grossCents: number;
}

/**
 * Vat het goedgekeurde-maar-nog-niet-uitgestuurde werk van een opdrachtgever samen. Geeft `null`
 * wanneer er niets aankomt (geen tegel = geen ruis op de pagina). Bevroren (disputed) concepten
 * worden overgeslagen; alleen de concept-groep telt mee (nooit reeds-uitgestuurde/openstaande
 * facturen — die zitten in de payables-vooruitblik).
 */
export function summarizeCommittedCost(rows: CommittedCostRow[]): CommittedCostSummary | null {
  let count = 0;
  let grossCents = 0;

  for (const row of rows) {
    if (row.disputed) continue;
    if (invoiceGroup(row) !== "concept") continue;
    count += 1;
    grossCents += row.totalCents;
  }

  if (count === 0) return null;

  return { count, grossCents };
}
