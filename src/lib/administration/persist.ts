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
 */
export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  issuerKey: IssuerKey,
  year: number,
): Promise<{ seq: number; number: string }> {
  const existing = await tx.invoiceSequence.findUnique({
    where: { issuerKey_year: { issuerKey, year } },
  });
  const seq = nextSequence(existing?.lastSeq);

  await tx.invoiceSequence.upsert({
    where: { issuerKey_year: { issuerKey, year } },
    create: { issuerKey, year, lastSeq: seq },
    update: { lastSeq: seq },
  });

  return { seq, number: formatPartyInvoiceNumber(year, seq) };
}
