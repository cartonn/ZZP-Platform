// Factuurnummering — doorlopend en uniek PER UITSCHRIJVENDE PARTIJ (PLATFORM_OVERHAUL.md §5,
// anti-patroon: geen platform-brede nummering). Elke ZZP'er heeft een eigen reeks; de platform-fee
// heeft een eigen reeks. Geen gaten. Pure formattering hier; de transactionele toewijzing (ophogen
// onder gelijktijdigheid) gebeurt in de prisma-runner met een unieke index op (party, jaar, seq).

/** Sleutel van de uitschrijvende partij: een ZZP'er-userId, of "PLATFORM" voor de fee-reeks. */
export type IssuerKey = string;

export const PLATFORM_ISSUER: IssuerKey = "PLATFORM";

/**
 * Formatteert een factuurnummer binnen de reeks van één partij, jaargebonden.
 * Bijv. (2026, 7) → "2026-0007". De reeks is per partij doorlopend, dus twee partijen mógen
 * hetzelfde nummer hebben — uniciteit geldt per (partij, nummer), niet globaal.
 */
export function formatPartyInvoiceNumber(year: number, seq: number): string {
  if (!Number.isInteger(year) || year < 2000) throw new Error(`Ongeldig jaar: ${year}`);
  if (!Number.isInteger(seq) || seq < 1) throw new Error(`Ongeldig volgnummer: ${seq}`);
  return `${year}-${String(seq).padStart(4, "0")}`;
}

/** Het volgende volgnummer in een reeks (puur). 0 of leeg → 1; anders +1. */
export function nextSequence(lastSeq: number | null | undefined): number {
  const last = lastSeq ?? 0;
  if (!Number.isInteger(last) || last < 0) throw new Error(`Ongeldig laatste volgnummer: ${last}`);
  return last + 1;
}

/** Controleert of een reeks gatenvrij is (1..n zonder ontbrekende nummers). Voor audits/tests. */
export function isGapFree(sequences: readonly number[]): boolean {
  const sorted = [...sequences].sort((a, b) => a - b);
  return sorted.every((n, i) => n === i + 1);
}
