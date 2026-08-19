// Factuurregister-CSV (verkoopboek voor de ZZP'er, inkoopboek voor de opdrachtgever): één rij per
// factuur — nummer, datum, vervaldatum, tegenpartij, omschrijving, bedrag excl. btw, btw, bedrag
// incl. btw, status en betaaldatum. Dit is wat een boekhouder als factuuroverzicht vraagt, en het
// vult de bestaande grootboek-CSV (@/lib/administration/csv — regel per boeking) aan.
//
// Pure functies: bouwen de CSV-tekst; de route levert hem als download. Bedragen in hele euro's met
// punt-decimaal, scheidingsteken ';' (gangbaar voor NL-Excel), via de gedeelde CSV-primitieven.
// De status hergebruikt exact `invoiceGroup` (dezelfde cascade-bewuste indeling als de filter-pills
// op /facturen) → geen drift tussen het scherm en de export.

import { centsToEuroPlain, toCsv } from "@/lib/administration/csv";
import { invoiceGroup, INVOICE_FILTER_LABEL } from "@/lib/invoice-filter";

export interface InvoiceRegisterRow {
  number: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  /** Naam van de tegenpartij: opdrachtgever (ZZP'er-export) of ZZP'er (opdrachtgever-export). */
  counterpartyName: string | null;
  /** Omschrijving — de opdrachttitel van de samenwerking. */
  description: string | null;
  totalCents: number;
  /** Bedrag excl. btw; legacy losse facturen kennen deze splitsing niet (null). */
  subtotalCents: number | null;
  /** Btw-bedrag; legacy losse facturen kennen deze splitsing niet (null). */
  vatCents: number | null;
  status: string;
  lifecycleStatus: string | null;
  /** Betaaldatum wanneer betaald, anders null. */
  paidAt: Date | null;
}

export const INVOICE_REGISTER_CSV_HEADER = [
  "factuurnummer",
  "factuurdatum",
  "vervaldatum",
  "tegenpartij",
  "omschrijving",
  "bedrag_excl_btw",
  "btw",
  "bedrag_incl_btw",
  "status",
  "betaald_op",
] as const;

const isoDate = (d: Date | null): string => (d ? d.toISOString().slice(0, 10) : "");

/**
 * Excl.-btw-bedrag van een factuur. Cascade-facturen dragen de splitsing (`subtotalCents`); een
 * legacy losse factuur niet — die tonen we deterministisch als totaal excl. + €0 btw (we verzinnen
 * nooit een btw-splitsing die er niet is). Invariant bij cascade: excl. + btw = incl.
 */
export function invoiceNetCents(
  row: Pick<InvoiceRegisterRow, "subtotalCents" | "totalCents">,
): number {
  return row.subtotalCents ?? row.totalCents;
}

/** Btw-bedrag van een factuur; legacy losse factuur → 0 (geen bekende splitsing). */
export function invoiceVatCents(row: Pick<InvoiceRegisterRow, "vatCents">): number {
  return row.vatCents ?? 0;
}

/**
 * Chronologische sortering voor het register: op factuurdatum oplopend, concepten (zonder datum)
 * onderaan, met het factuurnummer als stabiele tiebreak. Muteert de invoer niet.
 */
function sortForRegister(rows: readonly InvoiceRegisterRow[]): InvoiceRegisterRow[] {
  return [...rows].sort((a, b) => {
    const at = a.issuedAt ? a.issuedAt.getTime() : Infinity;
    const bt = b.issuedAt ? b.issuedAt.getTime() : Infinity;
    if (at !== bt) return at - bt;
    return a.number.localeCompare(b.number);
  });
}

/** Factuurregels → CSV met een vaste kop. Oplopend op factuurdatum (concepten onderaan). */
export function invoiceRegisterCsv(rows: readonly InvoiceRegisterRow[]): string {
  const body = sortForRegister(rows).map((r) => [
    r.number,
    isoDate(r.issuedAt),
    isoDate(r.dueAt),
    r.counterpartyName ?? "",
    r.description ?? "",
    centsToEuroPlain(invoiceNetCents(r)),
    centsToEuroPlain(invoiceVatCents(r)),
    centsToEuroPlain(r.totalCents),
    INVOICE_FILTER_LABEL[invoiceGroup(r)],
    isoDate(r.paidAt),
  ]);
  return toCsv([[...INVOICE_REGISTER_CSV_HEADER], ...body]);
}
