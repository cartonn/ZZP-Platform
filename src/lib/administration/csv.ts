// CSV-export van de administratie (PLATFORM_OVERHAUL.md §5: exporteerbaar voor de boekhouder).
// Pure functies: bouwen de CSV-tekst; de route levert hem als download. Bedragen in hele euro's
// met punt-decimaal, scheidingsteken ';' (gangbaar voor NL-Excel). Geen floats opslaan — alleen
// hier omrekenen van centen naar weergave. De generieke CSV-primitieven komen uit @/lib/csv.

import { escapeCsvField, toCsv } from "@/lib/csv";

// Her-export zodat bestaande importers (@/lib/administration/csv) blijven werken.
export { escapeCsvField, toCsv };

/** Centen → euro-weergave met punt-decimaal, bv. 101640 → "1016.40". */
export function centsToEuroPlain(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export interface VatReturnCsvRow {
  year: number;
  quarter: number;
  payableCents: number;
  deductibleCents: number;
  balanceCents: number;
}

/** BTW-kwartaaloverzicht → CSV met vaste kop. */
export function vatReturnsCsv(rows: readonly VatReturnCsvRow[]): string {
  const header = ["jaar", "kwartaal", "af_te_dragen", "voorbelasting", "saldo"];
  const body = rows.map((r) => [
    r.year,
    `Q${r.quarter}`,
    centsToEuroPlain(r.payableCents),
    centsToEuroPlain(r.deductibleCents),
    centsToEuroPlain(r.balanceCents),
  ]);
  return toCsv([header, ...body]);
}

export interface AdministrationCsvRow {
  occurredAt: Date;
  account: string;
  debitCents: number;
  creditCents: number;
  invoiceId: string | null;
  correlationId: string | null;
}

/** Grootboekregels → CSV met een vaste kop. Oplopend op datum. */
export function administrationCsv(rows: readonly AdministrationCsvRow[]): string {
  const header = ["datum", "rekening", "debet", "credit", "factuur", "correlatie"];
  const body = [...rows]
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .map((r) => [
      r.occurredAt.toISOString().slice(0, 10),
      r.account,
      centsToEuroPlain(r.debitCents),
      centsToEuroPlain(r.creditCents),
      r.invoiceId ?? "",
      r.correlationId ?? "",
    ]);
  return toCsv([header, ...body]);
}
