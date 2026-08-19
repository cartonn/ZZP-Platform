import { describe, expect, it } from "vitest";
import { isInvoicePaymentPending } from "@/lib/invoice-payment-status";

describe("isInvoicePaymentPending", () => {
  it("cascade: wacht op betaling vanaf indiening t/m te laat (SUBMITTED/APPROVED/OVERDUE)", () => {
    expect(isInvoicePaymentPending("DRAFT", "SUBMITTED")).toBe(true);
    expect(isInvoicePaymentPending("DRAFT", "APPROVED")).toBe(true);
    expect(isInvoicePaymentPending("DRAFT", "OVERDUE")).toBe(true);
  });

  it("cascade: betaald/geannuleerd/gecrediteerd/concept → niet meer pending", () => {
    expect(isInvoicePaymentPending("DRAFT", "PAID")).toBe(false);
    expect(isInvoicePaymentPending("DRAFT", "PROCESSED")).toBe(false);
    expect(isInvoicePaymentPending("DRAFT", "CREDITED")).toBe(false);
    expect(isInvoicePaymentPending("DRAFT", "REJECTED")).toBe(false);
    expect(isInvoicePaymentPending("DRAFT", "DRAFT")).toBe(false);
  });

  it("los (geen lifecycle): pending bij SENT/OVERDUE, anders niet", () => {
    expect(isInvoicePaymentPending("SENT", null)).toBe(true);
    expect(isInvoicePaymentPending("OVERDUE", null)).toBe(true);
    expect(isInvoicePaymentPending("DRAFT", null)).toBe(false);
    expect(isInvoicePaymentPending("PAID", null)).toBe(false);
    expect(isInvoicePaymentPending("CANCELLED", null)).toBe(false);
  });
});
