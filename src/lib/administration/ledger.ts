// Administratiemotor — pure boekingsregels per cascade-event (PLATFORM_OVERHAUL.md §4 & §5).
// Perspectieven op dezelfde transactie: ZZP'er = debiteur, opdrachtgever = crediteur; platform
// alleen op de eigen fee-factuur. Dubbel boekhouden: per partij balanceert elke boeking
// (debet = credit). GEEN geldverwerking — "ONTVANGEN"/"BETAALD" zijn registratie-tegenrekeningen
// die de vordering/schuld afboeken zodra een rechtstreekse betaling wordt gemarkeerd (Besluit 1).

import { z } from "zod";

export const LEDGER_PARTIES = ["FREELANCER", "CLIENT", "PLATFORM"] as const;
export type LedgerParty = (typeof LEDGER_PARTIES)[number];
export const ledgerPartySchema = z.enum(LEDGER_PARTIES);

export const LEDGER_ACCOUNTS = [
  "DEBITEUREN", //          vordering (uitschrijver)
  "CREDITEUREN", //         schuld (ontvanger)
  "OMZET", //               omzet (uitschrijver)
  "KOSTEN", //              kosten (ontvanger)
  "BTW_AF_TE_DRAGEN", //    af te dragen omzetbelasting (uitschrijver)
  "BTW_VOORBELASTING", //   terugvorderbare voorbelasting (ontvanger)
  "ONTVANGEN", //           registratie: ontvangen betaling (uitschrijver)
  "BETAALD", //             registratie: gedane betaling (ontvanger)
] as const;
export type LedgerAccount = (typeof LEDGER_ACCOUNTS)[number];
export const ledgerAccountSchema = z.enum(LEDGER_ACCOUNTS);

/** Eén boekingsregel. Precies één van debet/credit is gevuld; de ander is 0. */
export interface Posting {
  party: LedgerParty;
  account: LedgerAccount;
  debitCents: number;
  creditCents: number;
}

/** De financiële kerncijfers van een factuur (server-berekend, zie vat.ts). */
export interface InvoiceFinancials {
  issuer: LedgerParty; //        FREELANCER (of PLATFORM bij fee)
  counterparty: LedgerParty; //  CLIENT
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
}

function debit(party: LedgerParty, account: LedgerAccount, cents: number): Posting {
  return { party, account, debitCents: cents, creditCents: 0 };
}
function credit(party: LedgerParty, account: LedgerAccount, cents: number): Posting {
  return { party, account, debitCents: 0, creditCents: cents };
}

/**
 * Event C — ZZP'er dient factuur in. Bij de uitschrijver: vordering op debiteuren, omzet en
 * af te dragen BTW geregistreerd.
 */
export function planInvoiceSubmitted(fin: InvoiceFinancials): Posting[] {
  return [
    debit(fin.issuer, "DEBITEUREN", fin.totalCents),
    credit(fin.issuer, "OMZET", fin.subtotalCents),
    credit(fin.issuer, "BTW_AF_TE_DRAGEN", fin.vatCents),
  ];
}

/**
 * Event D — opdrachtgever keurt factuur goed. Bij de ontvanger: kosten + voorbelasting,
 * tegenover een crediteurenschuld.
 */
export function planInvoiceApproved(fin: InvoiceFinancials): Posting[] {
  return [
    debit(fin.counterparty, "KOSTEN", fin.subtotalCents),
    debit(fin.counterparty, "BTW_VOORBELASTING", fin.vatCents),
    credit(fin.counterparty, "CREDITEUREN", fin.totalCents),
  ];
}

/**
 * Event E — rechtstreekse betaling geregistreerd (geen geld via platform). Debiteur afgeboekt bij
 * de uitschrijver, crediteur afgeboekt bij de ontvanger.
 */
export function planPaymentConfirmed(fin: InvoiceFinancials): Posting[] {
  return [
    debit(fin.issuer, "ONTVANGEN", fin.totalCents),
    credit(fin.issuer, "DEBITEUREN", fin.totalCents),
    debit(fin.counterparty, "CREDITEUREN", fin.totalCents),
    credit(fin.counterparty, "BETAALD", fin.totalCents),
  ];
}

/**
 * Zijpad — creditfactuur: tegenboeking van indienen + goedkeuren (alle bedragen negatief).
 *
 * Was de factuur al betaald (lifecycle PAID/PROCESSED), dan zijn de betaal-tegenboekingen
 * (ONTVANGEN/BETAALD + afboeking debiteuren/crediteuren uit `planPaymentConfirmed`) al gemaakt.
 * Crediteren = terugbetalen, dus die moeten óók terug: geef `reversePayment` mee. Zonder dat blijft
 * er een spookvordering (DEBITEUREN < 0) bij de ZZP'er en een spookschuld (CREDITEUREN > 0) bij de
 * opdrachtgever staan, die rechtstreeks in de debiteuren-/crediteurenoverzichten lekt.
 */
export function planInvoiceCredited(
  fin: InvoiceFinancials,
  opts: { reversePayment?: boolean } = {},
): Posting[] {
  const negated: InvoiceFinancials = {
    issuer: fin.issuer,
    counterparty: fin.counterparty,
    subtotalCents: -fin.subtotalCents,
    vatCents: -fin.vatCents,
    totalCents: -fin.totalCents,
  };
  const postings = [...planInvoiceSubmitted(negated), ...planInvoiceApproved(negated)];
  if (opts.reversePayment) postings.push(...planPaymentConfirmed(negated));
  return postings;
}

// --- Analyse / overzichten --------------------------------------------------

/** Sommeert per partij per rekening het netto saldo (debet − credit). */
export function summarizeByParty(
  postings: readonly Posting[],
): Record<LedgerParty, Partial<Record<LedgerAccount, number>>> {
  const result = {
    FREELANCER: {} as Partial<Record<LedgerAccount, number>>,
    CLIENT: {} as Partial<Record<LedgerAccount, number>>,
    PLATFORM: {} as Partial<Record<LedgerAccount, number>>,
  };
  for (const p of postings) {
    const acc = result[p.party];
    acc[p.account] = (acc[p.account] ?? 0) + p.debitCents - p.creditCents;
  }
  return result;
}

/** Per partij moet debet gelijk zijn aan credit (sluitende boeking). */
export function isBalanced(postings: readonly Posting[], party: LedgerParty): boolean {
  let debits = 0;
  let credits = 0;
  for (const p of postings) {
    if (p.party !== party) continue;
    debits += p.debitCents;
    credits += p.creditCents;
  }
  return debits === credits;
}

/** Werpt als een partij niet sluit — gebruik vóór het wegschrijven van administratie. */
export function assertBalanced(postings: readonly Posting[], party: LedgerParty): void {
  if (!isBalanced(postings, party)) {
    throw new Error(`Administratie sluit niet voor ${party}: debet ≠ credit.`);
  }
}

/** BTW-positie: af te dragen minus voorbelasting per partij (basis voor het kwartaaloverzicht). */
export function vatPosition(postings: readonly Posting[]): Record<LedgerParty, number> {
  const summary = summarizeByParty(postings);
  const position = { FREELANCER: 0, CLIENT: 0, PLATFORM: 0 } as Record<LedgerParty, number>;
  for (const party of LEDGER_PARTIES) {
    const payable = summary[party].BTW_AF_TE_DRAGEN ?? 0; // credit-saldo → negatief
    const deductible = summary[party].BTW_VOORBELASTING ?? 0; // debet-saldo → positief
    // Af te dragen staat als credit (negatief saldo); maak het positief en trek voorbelasting af.
    const net = -payable - deductible;
    position[party] = net === 0 ? 0 : net; // normaliseer -0 naar 0
  }
  return position;
}
