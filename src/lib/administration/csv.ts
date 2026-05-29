// CSV-export van de administratie (PLATFORM_OVERHAUL.md §5: exporteerbaar voor de boekhouder).
// Pure functies: bouwen de CSV-tekst; de route levert hem als download. Bedragen in hele euro's
// met punt-decimaal, scheidingsteken ';' (gangbaar voor NL-Excel). Geen floats opslaan — alleen
// hier omrekenen van centen naar weergave.

/** Escapet één veld: dubbele quotes verdubbelen en quoten bij ; " of newline. */
export function escapeCsvField(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Bouwt CSV-tekst uit rijen (eerste rij = kop). Velden worden ge-escaped. */
export function toCsv(rows: readonly (readonly (string | number)[])[]): string {
  return rows.map((row) => row.map((c) => escapeCsvField(String(c))).join(";")).join("\r\n");
}

/** Centen → euro-weergave met punt-decimaal, bv. 101640 → "1016.40". */
export function centsToEuroPlain(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
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
