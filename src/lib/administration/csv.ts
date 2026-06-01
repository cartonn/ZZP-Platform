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

export interface PlatformInvoiceCsvRow {
  date: Date | null;
  partyInvoiceNumber: string | null;
  freelancerName: string;
  clientName: string;
  jobTitle: string;
  subtotalCents: number | null;
  vatCents: number | null;
  totalCents: number;
  lifecycleStatus: string | null;
  dueAt: Date | null;
}

const LIFECYCLE_LABEL: Record<string, string> = {
  DRAFT: "Concept",
  SUBMITTED: "Ingediend",
  APPROVED: "Goedgekeurd",
  PAID: "Betaald",
  PROCESSED: "Verwerkt",
  REJECTED: "Afgekeurd",
  OVERDUE: "Te laat",
  CREDITED: "Gecrediteerd",
};

/** Platform-brede factuurexport → CSV voor financieel toezicht. Gesorteerd op datum. */
export function platformInvoicesCsv(rows: readonly PlatformInvoiceCsvRow[]): string {
  const header = [
    "datum",
    "factuurnummer",
    "zzper",
    "opdrachtgever",
    "opdracht",
    "subtotaal_excl",
    "btw",
    "totaal_incl",
    "status",
    "vervaldatum",
  ];
  const body = [...rows]
    .sort((a, b) => {
      const ta = (a.date ?? new Date(0)).getTime();
      const tb = (b.date ?? new Date(0)).getTime();
      return ta - tb;
    })
    .map((r) => [
      r.date ? r.date.toISOString().slice(0, 10) : "",
      r.partyInvoiceNumber ?? "",
      r.freelancerName,
      r.clientName,
      r.jobTitle,
      centsToEuroPlain(r.subtotalCents ?? r.totalCents),
      centsToEuroPlain(r.vatCents ?? 0),
      centsToEuroPlain(r.totalCents),
      r.lifecycleStatus ? (LIFECYCLE_LABEL[r.lifecycleStatus] ?? r.lifecycleStatus) : "",
      r.dueAt ? r.dueAt.toISOString().slice(0, 10) : "",
    ]);
  return toCsv([header, ...body]);
}
