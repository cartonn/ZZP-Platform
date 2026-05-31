import { describe, expect, it } from "vitest";
import { computeVat } from "@/lib/administration/vat";
import {
  planInvoiceSubmitted,
  planInvoiceApproved,
  planPaymentConfirmed,
  planInvoiceCredited,
  summarizeByParty,
  isBalanced,
  assertBalanced,
  vatPosition,
  type InvoiceFinancials,
} from "@/lib/administration/ledger";

// Proeftransactie: ZZP'er factureert 8u × €75 = €600 + 21% BTW = €726.
const vat = computeVat(600_00, "STANDARD_HIGH");
const fin: InvoiceFinancials = {
  issuer: "FREELANCER",
  counterparty: "CLIENT",
  subtotalCents: vat.subtotalCents,
  vatCents: vat.vatCents,
  totalCents: vat.totalCents,
};

describe("boekingen per event sluiten per partij", () => {
  it("Event C (indienen) sluit bij de ZZP'er", () => {
    const postings = planInvoiceSubmitted(fin);
    expect(isBalanced(postings, "FREELANCER")).toBe(true);
    const s = summarizeByParty(postings).FREELANCER;
    expect(s.DEBITEUREN).toBe(726_00);
    expect(s.OMZET).toBe(-600_00); // credit-saldo = omzet
    expect(s.BTW_AF_TE_DRAGEN).toBe(-126_00);
  });

  it("Event D (goedkeuren) sluit bij de opdrachtgever", () => {
    const postings = planInvoiceApproved(fin);
    expect(isBalanced(postings, "CLIENT")).toBe(true);
    const s = summarizeByParty(postings).CLIENT;
    expect(s.KOSTEN).toBe(600_00);
    expect(s.BTW_VOORBELASTING).toBe(126_00);
    expect(s.CREDITEUREN).toBe(-726_00);
  });
});

describe("volledige proeftransactie A-E", () => {
  const all = [
    ...planInvoiceSubmitted(fin), // C
    ...planInvoiceApproved(fin), //  D
    ...planPaymentConfirmed(fin), // E
  ];

  it("debiteuren en crediteuren zijn na betaling afgeboekt", () => {
    const summary = summarizeByParty(all);
    expect(summary.FREELANCER.DEBITEUREN).toBe(0); // vordering volledig ontvangen
    expect(summary.CLIENT.CREDITEUREN).toBe(0); //   schuld volledig voldaan
  });

  it("omzet gerealiseerd bij ZZP'er, kosten bij opdrachtgever", () => {
    const summary = summarizeByParty(all);
    expect(summary.FREELANCER.OMZET).toBe(-600_00);
    expect(summary.FREELANCER.ONTVANGEN).toBe(726_00);
    expect(summary.CLIENT.KOSTEN).toBe(600_00);
    expect(summary.CLIENT.BETAALD).toBe(-726_00);
  });

  it("BTW klopt: ZZP'er draagt 126 af, opdrachtgever vordert 126 terug", () => {
    const pos = vatPosition(all);
    expect(pos.FREELANCER).toBe(126_00);
    expect(pos.CLIENT).toBe(-126_00);
  });

  it("GEEN geld via het platform: platform heeft geen enkele boeking (Besluit 1)", () => {
    const summary = summarizeByParty(all);
    expect(Object.keys(summary.PLATFORM)).toHaveLength(0);
    expect(vatPosition(all).PLATFORM).toBe(0);
  });

  it("elke partij sluit over de hele transactie", () => {
    expect(() => assertBalanced(all, "FREELANCER")).not.toThrow();
    expect(() => assertBalanced(all, "CLIENT")).not.toThrow();
  });
});

describe("zijpad creditfactuur", () => {
  it("tegenboeking maakt omzet en BTW weer nul", () => {
    const cycle = [
      ...planInvoiceSubmitted(fin),
      ...planInvoiceApproved(fin),
      ...planInvoiceCredited(fin),
    ];
    const summary = summarizeByParty(cycle);
    expect(summary.FREELANCER.OMZET).toBe(0);
    expect(summary.FREELANCER.BTW_AF_TE_DRAGEN).toBe(0);
    expect(summary.CLIENT.KOSTEN).toBe(0);
    expect(summary.CLIENT.BTW_VOORBELASTING).toBe(0);
    expect(vatPosition(cycle).FREELANCER).toBe(0);
  });
});

describe("assertBalanced", () => {
  it("werpt bij een niet-sluitende boeking", () => {
    const broken = [
      {
        party: "FREELANCER" as const,
        account: "DEBITEUREN" as const,
        debitCents: 100,
        creditCents: 0,
      },
    ];
    expect(() => assertBalanced(broken, "FREELANCER")).toThrow(/sluit niet/);
  });
});
