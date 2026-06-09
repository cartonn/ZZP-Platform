import { describe, expect, it } from "vitest";
import { isInvoiceOutstanding } from "./outstanding";

describe("isInvoiceOutstanding", () => {
  it("telt cascade-facturen op lifecycleStatus, niet op de live status (die DRAFT blijft)", () => {
    expect(isInvoiceOutstanding({ lifecycleStatus: "SUBMITTED", status: "DRAFT" })).toBe(true);
    expect(isInvoiceOutstanding({ lifecycleStatus: "APPROVED", status: "DRAFT" })).toBe(true);
    expect(isInvoiceOutstanding({ lifecycleStatus: "OVERDUE", status: "OVERDUE" })).toBe(true);
  });

  it("rekent een betaalde of concept cascade-factuur niet als openstaand", () => {
    expect(isInvoiceOutstanding({ lifecycleStatus: "PAID", status: "PAID" })).toBe(false);
    expect(isInvoiceOutstanding({ lifecycleStatus: "DRAFT", status: "DRAFT" })).toBe(false);
    expect(isInvoiceOutstanding({ lifecycleStatus: "CANCELLED", status: "CANCELLED" })).toBe(false);
  });

  it("valt voor legacy-facturen (geen lifecycleStatus) terug op de live status", () => {
    expect(isInvoiceOutstanding({ lifecycleStatus: null, status: "SENT" })).toBe(true);
    expect(isInvoiceOutstanding({ lifecycleStatus: null, status: "OVERDUE" })).toBe(true);
    expect(isInvoiceOutstanding({ lifecycleStatus: null, status: "DRAFT" })).toBe(false);
    expect(isInvoiceOutstanding({ lifecycleStatus: null, status: "PAID" })).toBe(false);
  });
});
