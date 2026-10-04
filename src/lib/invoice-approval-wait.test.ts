import { describe, expect, it } from "vitest";
import {
  INVOICE_APPROVAL_WAIT_ATTENTION_DAYS,
  summarizeInvoiceApprovalWait,
} from "@/lib/invoice-approval-wait";

const NOW = new Date("2026-10-04T12:00:00.000Z");

/** Een Date `days` dagen vóór NOW. */
function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

describe("summarizeInvoiceApprovalWait", () => {
  it("geeft null voor een concept (DRAFT) — nog aan de ZZP'er zelf", () => {
    expect(
      summarizeInvoiceApprovalWait({ lifecycleStatus: "DRAFT", issuedAt: null }, NOW),
    ).toBeNull();
  });

  it("geeft null voor een goedgekeurde factuur — wacht niet meer", () => {
    expect(
      summarizeInvoiceApprovalWait({ lifecycleStatus: "APPROVED", issuedAt: daysAgo(3) }, NOW),
    ).toBeNull();
  });

  it("geeft null voor een betaalde/verwerkte factuur — besloten", () => {
    expect(
      summarizeInvoiceApprovalWait({ lifecycleStatus: "PAID", issuedAt: daysAgo(10) }, NOW),
    ).toBeNull();
    expect(
      summarizeInvoiceApprovalWait({ lifecycleStatus: "PROCESSED", issuedAt: daysAgo(30) }, NOW),
    ).toBeNull();
  });

  it("geeft null voor een onbekende/onverwachte status (defensief)", () => {
    expect(
      summarizeInvoiceApprovalWait({ lifecycleStatus: "ONBEKEND", issuedAt: daysAgo(3) }, NOW),
    ).toBeNull();
  });

  it("geeft null voor SUBMITTED zonder issuedAt (data-ruis, geen leeftijd afleidbaar)", () => {
    expect(
      summarizeInvoiceApprovalWait({ lifecycleStatus: "SUBMITTED", issuedAt: null }, NOW),
    ).toBeNull();
  });

  it("telt hele wachtdagen voor een ingediende factuur", () => {
    const wait = summarizeInvoiceApprovalWait(
      { lifecycleStatus: "SUBMITTED", issuedAt: daysAgo(4) },
      NOW,
    );
    expect(wait).toEqual({ daysWaiting: 4, attention: false });
  });

  it("markeert aandacht zodra de drempel (dag 7) is bereikt", () => {
    const wait = summarizeInvoiceApprovalWait(
      { lifecycleStatus: "SUBMITTED", issuedAt: daysAgo(INVOICE_APPROVAL_WAIT_ATTENTION_DAYS) },
      NOW,
    );
    expect(wait?.attention).toBe(true);
  });

  it("markeert geen aandacht één dag onder de drempel", () => {
    const wait = summarizeInvoiceApprovalWait(
      { lifecycleStatus: "SUBMITTED", issuedAt: daysAgo(INVOICE_APPROVAL_WAIT_ATTENTION_DAYS - 1) },
      NOW,
    );
    expect(wait?.attention).toBe(false);
  });

  it("klemt een issuedAt in de toekomst op 0 dagen (nooit negatief)", () => {
    const future = new Date(NOW.getTime() + 3 * 86_400_000);
    const wait = summarizeInvoiceApprovalWait(
      { lifecycleStatus: "SUBMITTED", issuedAt: future },
      NOW,
    );
    expect(wait).toEqual({ daysWaiting: 0, attention: false });
  });

  it("leidt de drempel af uit de herinneringscadans (geen drift met de dag-3/7-nudge)", () => {
    expect(INVOICE_APPROVAL_WAIT_ATTENTION_DAYS).toBe(7);
  });
});
