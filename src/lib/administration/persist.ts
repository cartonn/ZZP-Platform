// Prisma-gebonden schrijvers voor de administratiemotor. De boekingsregels zelf zijn puur
// (ledger.ts); deze module schrijft ze atomair weg en kent doorlopende factuurnummers toe
// per uitschrijvende partij. Aanroepen vanuit de cascade-handlers (Fase 3) binnen één
// prisma.$transaction, net als runExpiryTask (CLAUDE.md regel 5).

import { Prisma } from "@prisma/client";
import {
  formatPartyInvoiceNumber,
  nextSequence,
  type IssuerKey,
} from "@/lib/administration/numbering";
import { type Posting } from "@/lib/administration/ledger";

/** Welke user hoort bij welke partij — voor per-partij administratie-views. */
export interface PartyOwners {
  FREELANCER?: string | null;
  CLIENT?: string | null;
  PLATFORM?: string | null;
}

export interface PostingRefs {
  owners: PartyOwners;
  invoiceId?: string | null;
  performanceId?: string | null;
  correlationId?: string | null;
  eventId?: string | null;
  occurredAt?: Date;
}

/** Zet pure postings om naar `AdministrationEntry`-createMany-data (idempotentie bij de handler). */
export function toEntryData(postings: readonly Posting[], refs: PostingRefs) {
  const occurredAt = refs.occurredAt ?? new Date();
  return postings.map((p) => ({
    party: p.party,
    ownerUserId: refs.owners[p.party] ?? null,
    account: p.account,
    debitCents: p.debitCents,
    creditCents: p.creditCents,
    invoiceId: refs.invoiceId ?? null,
    performanceId: refs.performanceId ?? null,
    correlationId: refs.correlationId ?? null,
    eventId: refs.eventId ?? null,
    occurredAt,
  }));
}

/**
 * Kent het volgende factuurnummer toe in de reeks van één partij, jaargebonden en gatenvrij.
 * Draait in een interactieve transactie zodat ophogen en toekennen atomair zijn (geen
 * dubbele nummers onder gelijktijdigheid). Geef de `tx`-client uit `prisma.$transaction(async (tx) => ...)`.
 *
 * Atomaire toewijzing via één upsert: op conflict `SET lastSeq = lastSeq + 1`. De increment leest de
 * rij-waarde ONDER de rij-lock, dus twee (bijna-)gelijktijdige transacties — bv. dezelfde ZZP'er die
 * twee facturen tegelijk indient (twee tabs / dubbelklik / twee samenwerkingen) — krijgen elk een uniek
 * volgnummer. De vorige read-then-write (`findUnique` → `update: { lastSeq: seq }` met een in JS
 * voor-berekende waarde) was NIET race-veilig onder Postgres READ COMMITTED: beide transacties lazen
 * dezelfde `lastSeq`, berekenden hetzelfde volgnummer en botsten dan op de Invoice-uniekheid
 * `[issuerKey, partyInvoiceNumber]` — de tweede submit faalde met een rauwe P2002 i.p.v. netjes door te
 * lopen. De rij-lock op de increment serialiseert nu de toewijzing (SQLite serialiseert writes sowieso).
 */
export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  issuerKey: IssuerKey,
  year: number,
): Promise<{ seq: number; number: string }> {
  const row = await tx.invoiceSequence.upsert({
    where: { issuerKey_year: { issuerKey, year } },
    create: { issuerKey, year, lastSeq: nextSequence(undefined) },
    update: { lastSeq: { increment: 1 } },
  });

  return { seq: row.lastSeq, number: formatPartyInvoiceNumber(year, row.lastSeq) };
}
