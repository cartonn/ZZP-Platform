import { describe, expect, it } from "vitest";
import {
  EXCLUDED_REVENUE_LEGACY_STATUS,
  EXCLUDED_REVENUE_LIFECYCLE,
  isInvoiceRevenueCounted,
  revenueCountedInvoiceWhere,
} from "./revenue-recognition";

describe("isInvoiceRevenueCounted", () => {
  it("telt een cascade-factuur mee zolang ze niet gecrediteerd is", () => {
    for (const lifecycleStatus of [
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "PAID",
      "PROCESSED",
      "OVERDUE",
    ]) {
      expect(isInvoiceRevenueCounted({ lifecycleStatus, status: "DRAFT" })).toBe(true);
    }
  });

  it("telt een gecrediteerde cascade-factuur NIET mee (reversal-eindtoestand), ondanks legacy DRAFT", () => {
    // Kern van de fix: legacy `status` blijft DRAFT, maar de cascade is teruggedraaid.
    expect(isInvoiceRevenueCounted({ lifecycleStatus: "CREDITED", status: "DRAFT" })).toBe(false);
  });

  it("telt een legacy-factuur mee tenzij ze geannuleerd is", () => {
    expect(isInvoiceRevenueCounted({ lifecycleStatus: null, status: "SENT" })).toBe(true);
    expect(isInvoiceRevenueCounted({ lifecycleStatus: null, status: "PAID" })).toBe(true);
    expect(isInvoiceRevenueCounted({ lifecycleStatus: null, status: "CANCELLED" })).toBe(false);
  });

  it("laat een cascade-factuur door de lifecycle beslissen, niet door de legacy-kolom", () => {
    // Een geannuleerde legacy-status op een cascade-factuur mag de telling niet sturen.
    expect(isInvoiceRevenueCounted({ lifecycleStatus: "APPROVED", status: "CANCELLED" })).toBe(
      true,
    );
  });
});

describe("revenueCountedInvoiceWhere", () => {
  it("sluit precies de gecrediteerde-cascade en geannuleerde-legacy takken uit", () => {
    expect(revenueCountedInvoiceWhere).toEqual({
      OR: [
        { lifecycleStatus: { notIn: ["CREDITED"] } },
        { lifecycleStatus: null, status: { notIn: ["CANCELLED"] } },
      ],
    });
  });

  it("de constanten zijn de canonieke reversal-/annulering-eindtoestanden", () => {
    expect(EXCLUDED_REVENUE_LIFECYCLE).toEqual(["CREDITED"]);
    expect(EXCLUDED_REVENUE_LEGACY_STATUS).toEqual(["CANCELLED"]);
  });
});
