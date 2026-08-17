import { describe, expect, it } from "vitest";
import { isInvoiceRealizedRevenue, realizedRevenueInvoiceWhere } from "./realized-revenue";

describe("isInvoiceRealizedRevenue", () => {
  it("telt cascade-facturen op lifecycleStatus, niet op de live status (die DRAFT blijft)", () => {
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "SUBMITTED", status: "DRAFT" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "APPROVED", status: "DRAFT" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "OVERDUE", status: "OVERDUE" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "PAID", status: "PAID" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "PROCESSED", status: "PAID" })).toBe(true);
  });

  it("rekent concept-, afgekeurd- en teruggedraaide cascade-facturen niet als omzet", () => {
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "DRAFT", status: "DRAFT" })).toBe(false);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "REJECTED", status: "DRAFT" })).toBe(false);
    // Teruggedraaid: cascade CREDITED (live status wordt CANCELLED gezet) telt niet mee.
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: "CREDITED", status: "CANCELLED" })).toBe(
      false,
    );
  });

  it("valt voor legacy-facturen (geen lifecycleStatus) terug op de live status", () => {
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: null, status: "SENT" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: null, status: "OVERDUE" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: null, status: "PAID" })).toBe(true);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: null, status: "DRAFT" })).toBe(false);
    expect(isInvoiceRealizedRevenue({ lifecycleStatus: null, status: "CANCELLED" })).toBe(false);
  });

  it("de where-fragment dekt beide paden (cascade op lifecycleStatus, legacy op status)", () => {
    expect(realizedRevenueInvoiceWhere).toEqual({
      OR: [
        { lifecycleStatus: { in: ["SUBMITTED", "APPROVED", "OVERDUE", "PAID", "PROCESSED"] } },
        { lifecycleStatus: null, status: { in: ["SENT", "OVERDUE", "PAID"] } },
      ],
    });
  });
});
