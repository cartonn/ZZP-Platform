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

  // Regressie: de betaalde-omzet-som (facturen-panel `paidCents`, tenant-stats `revenuePaidCents`,
  // de per-opdrachtgever-breakdown) telde `status === "PAID"` en miste daardoor ELKE cascade-factuur
  // (die op status='DRAFT' blijft). Onder die oude regel zou dit totaal 500_00 zijn i.p.v. 1500_00.
  it("een betaalde-omzet-som via het filter telt cascade-PAID facturen mee (status blijft DRAFT)", () => {
    const invoices = [
      { lifecycleStatus: "PAID", status: "DRAFT", totalCents: 1000_00 }, // cascade, betaald
      { lifecycleStatus: null, status: "PAID", totalCents: 500_00 }, // legacy, betaald
      { lifecycleStatus: "SUBMITTED", status: "DRAFT", totalCents: 900_00 }, // cascade, open
      { lifecycleStatus: "CREDITED", status: "CANCELLED", totalCents: 700_00 }, // teruggedraaid
    ];
    const paidCents = invoices.reduce(
      (sum, inv) => (isInvoicePaidRevenue(inv) ? sum + inv.totalCents : sum),
      0,
    );
    expect(paidCents).toBe(1500_00);
  });
});
