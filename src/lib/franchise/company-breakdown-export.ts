// CSV-export van de opdrachtgever-uitsplitsing (`/inzicht`, bemiddelaar). De bemiddelaar ziet daar per
// opdrachtgever de betaalde omzet, het aantal diensten en de vulgraad; die uitsplitsing kon hij nergens
// exporteren. Deze leaf-module bouwt puur (geen DB/IO) de CSV-tekst uit de reeds tenant-gescopet
// opgehaalde `CompanyBreakdownRow`-rijen, zodat de bemiddelaar zijn opdrachtgever-omzet in een
// spreadsheet kan bewerken, delen of tegen zijn eigen boekhouding kan leggen — benchmark: staffing-
// platformen die een exporteerbaar omzetoverzicht per klant bieden. De server bepaalt de waarheid
// (CLAUDE.md regel 1); deze module levert enkel de presentatie. Formule-injectie (CWE-1236) wordt
// afgevangen door `toCsv`/`escapeCsvField`.

import { toCsv } from "@/lib/csv";
import { centsToEuroPlain } from "@/lib/administration/csv";
import { type CompanyBreakdownRow } from "@/lib/tenant-stats";

/** Kolomkoppen (Nederlands, UI-taal). Eén bron van waarheid voor de export + de tests. */
export const COMPANY_BREAKDOWN_EXPORT_HEADERS = [
  "Opdrachtgever",
  "Betaalde omzet (EUR)",
  "Diensten",
  "Vervuld",
  "Vulgraad (%)",
] as const;

/**
 * Bouwt de CSV-tekst uit de opdrachtgever-uitsplitsing. De rij-volgorde wordt behouden (de aanroeper
 * levert de rijen al gesorteerd zoals op het scherm), zodat de export nooit afwijkt van wat de
 * bemiddelaar ziet. Geld in euro's met punt-decimaal (spiegelt de administratie-exports).
 */
export function companyBreakdownCsv(rows: readonly CompanyBreakdownRow[]): string {
  return toCsv([
    COMPANY_BREAKDOWN_EXPORT_HEADERS,
    ...rows.map((r) => [
      r.name,
      centsToEuroPlain(r.revenuePaidCents),
      r.totalJobs,
      r.filledJobs,
      r.fillRate,
    ]),
  ]);
}
