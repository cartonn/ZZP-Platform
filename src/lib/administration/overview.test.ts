import { describe, expect, it } from "vitest";
import { computeVat } from "@/lib/administration/vat";
import { planInvoiceSubmitted, planInvoiceApproved, planPaymentConfirmed, type InvoiceFinancials } from "@/lib/administration/ledger";
import {
  quarterOf,
  vatReturn,
  vatYear,
  openReceivablesCents,
  openPayablesCents,
  revenueCents,
  type LedgerEntry,
} from "@/lib/administration/overview";

const vat = computeVat(600_00, "STANDARD_HIGH");
const fin: InvoiceFinancials = { issuer: "FREELANCER", counterparty: "CLIENT", subtotalCents: vat.subtotalCents, vatCents: vat.vatCents, totalCents: vat.totalCents };

function entriesFrom(postings: { party: string; account: string; debitCents: number; creditCents: number }[], occurredAt: Date): LedgerEntry[] {
  return postings.map((p) => ({ party: p.party as LedgerEntry["party"], account: p.account as LedgerEntry["account"], debitCents: p.debitCents, creditCents: p.creditCents, occurredAt }));
}

describe("quarterOf", () => {
  it("mapt maanden naar kwartalen", () => {
    expect(quarterOf(new Date("2026-01-15"))).toBe(1);
    expect(quarterOf(new Date("2026-04-01"))).toBe(2);
    expect(quarterOf(new Date("2026-09-30"))).toBe(3);
    expect(quarterOf(new Date("2026-12-31"))).toBe(4);
  });
});

describe("debiteuren/crediteuren", () => {
  it("openstaand vóór betaling, nul erna", () => {
    const submitted = entriesFrom(planInvoiceSubmitted(fin), new Date("2026-02-01"));
    const approved = entriesFrom(planInvoiceApproved(fin), new Date("2026-02-02"));
    const beforePay = [...submitted, ...approved];
    expect(openReceivablesCents(beforePay, "FREELANCER")).toBe(726_00);
    expect(openPayablesCents(beforePay, "CLIENT")).toBe(726_00);

    const paid = entriesFrom(planPaymentConfirmed(fin), new Date("2026-02-10"));
    const afterPay = [...beforePay, ...paid];
    expect(openReceivablesCents(afterPay, "FREELANCER")).toBe(0);
    expect(openPayablesCents(afterPay, "CLIENT")).toBe(0);
  });
});

describe("vatReturn / vatYear", () => {
  it("verdeelt af te dragen en voorbelasting over het juiste kwartaal", () => {
    const entries = [
      ...entriesFrom(planInvoiceSubmitted(fin), new Date("2026-02-01")), // Q1: ZZP'er af te dragen
      ...entriesFrom(planInvoiceApproved(fin), new Date("2026-02-01")), //  Q1: OG voorbelasting
    ];
    const zzpQ1 = vatReturn(entries, "FREELANCER", 2026, 1);
    expect(zzpQ1.payableCents).toBe(126_00);
    expect(zzpQ1.deductibleCents).toBe(0);
    expect(zzpQ1.balanceCents).toBe(126_00);

    const ogQ1 = vatReturn(entries, "CLIENT", 2026, 1);
    expect(ogQ1.deductibleCents).toBe(126_00);
    expect(ogQ1.balanceCents).toBe(-126_00);

    // Q2 is leeg.
    expect(vatReturn(entries, "FREELANCER", 2026, 2).payableCents).toBe(0);
    expect(vatYear(entries, "FREELANCER", 2026)).toHaveLength(4);
  });
});

describe("revenueCents", () => {
  it("telt gerealiseerde omzet in het jaar", () => {
    const entries = entriesFrom(planInvoiceSubmitted(fin), new Date("2026-03-01"));
    expect(revenueCents(entries, "FREELANCER", 2026)).toBe(600_00);
    expect(revenueCents(entries, "FREELANCER", 2025)).toBe(0);
  });
});
