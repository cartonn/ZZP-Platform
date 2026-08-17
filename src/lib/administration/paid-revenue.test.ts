import { describe, expect, it } from "vitest";
import { isInvoicePaidRevenue, paidRevenueInvoiceWhere } from "./paid-revenue";

describe("isInvoicePaidRevenue", () => {
  it("telt cascade-facturen op lifecycleStatus, niet op de live status (die DRAFT blijft)", () => {
    // De primaire flow: legacy `status` blijft DRAFT terwijl de factuur betaald/verwerkt is.
    expect(isInvoicePaidRevenue({ lifecycleStatus: "PAID", status: "DRAFT" })).toBe(true);
    expect(isInvoicePaidRevenue({ lifecycleStatus: "PROCESSED", status: "DRAFT" })).toBe(true);
  });

  it("rekent onbetaalde en teruggedraaide cascade-facturen niet als betaalde omzet", () => {
    expect(isInvoicePaidRevenue({ lifecycleStatus: "DRAFT", status: "DRAFT" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: "SUBMITTED", status: "DRAFT" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: "APPROVED", status: "DRAFT" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: "OVERDUE", status: "OVERDUE" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: "REJECTED", status: "DRAFT" })).toBe(false);
    // Teruggedraaid: cascade CREDITED telt niet als binnengekomen geld.
    expect(isInvoicePaidRevenue({ lifecycleStatus: "CREDITED", status: "CANCELLED" })).toBe(false);
  });

  it("valt voor legacy-facturen (geen lifecycleStatus) terug op de live status", () => {
    expect(isInvoicePaidRevenue({ lifecycleStatus: null, status: "PAID" })).toBe(true);
    expect(isInvoicePaidRevenue({ lifecycleStatus: null, status: "SENT" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: null, status: "OVERDUE" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: null, status: "DRAFT" })).toBe(false);
    expect(isInvoicePaidRevenue({ lifecycleStatus: null, status: "CANCELLED" })).toBe(false);
  });

  it("de where-fragment dekt beide paden (cascade op lifecycleStatus, legacy op status)", () => {
    expect(paidRevenueInvoiceWhere).toEqual({
      OR: [
        { lifecycleStatus: { in: ["PAID", "PROCESSED"] } },
        { lifecycleStatus: null, status: { in: ["PAID"] } },
      ],
    });
  });
});
