import { describe, expect, it } from "vitest";
import {
  summarizeObligationOverdueCharges,
  chargesByInvoiceId,
} from "@/lib/payment-obligation-charges";
import {
  calculateCollectionCostsCents,
  calculateStatutoryInterestCents,
} from "@/lib/collection-costs";
import type { ObligationItem } from "@/lib/payment-obligations";

const NOW = new Date("2026-08-24T12:00:00.000Z");
const DAY = 86_400_000;

function item(overrides: Partial<ObligationItem> = {}): ObligationItem {
  return {
    invoiceId: "inv-1",
    stage: "OVERDUE",
    netCents: 100000,
    vatCents: 21000,
    grossCents: 121000,
    dueDate: new Date(NOW.getTime() - 30 * DAY),
    counterpartyId: "cp-1",
    counterpartyName: "Sanne",
    number: "2026-001",
    jobTitle: "Nachtdienst VVT",
    ...overrides,
  };
}

describe("summarizeObligationOverdueCharges", () => {
  it("returns an empty exposure when there are no items", () => {
    const exposure = summarizeObligationOverdueCharges([], NOW);
    expect(exposure.hasCharges).toBe(false);
    expect(exposure.count).toBe(0);
    expect(exposure.totalExtraCents).toBe(0);
    expect(exposure.items).toEqual([]);
  });

  it("ignores SUBMITTED items (no due date, no charges)", () => {
    const exposure = summarizeObligationOverdueCharges(
      [item({ stage: "SUBMITTED", dueDate: null })],
      NOW,
    );
    expect(exposure.hasCharges).toBe(false);
    expect(exposure.count).toBe(0);
  });

  it("ignores an APPROVED invoice that is not yet past due", () => {
    const exposure = summarizeObligationOverdueCharges(
      [item({ stage: "APPROVED", dueDate: new Date(NOW.getTime() + 5 * DAY) })],
      NOW,
    );
    expect(exposure.hasCharges).toBe(false);
    expect(exposure.count).toBe(0);
  });

  it("includes an invoice due exactly today with no charges yet (0 days overdue)", () => {
    const exposure = summarizeObligationOverdueCharges([item({ dueDate: NOW })], NOW);
    // No full day past due → no interest and no collection costs yet.
    expect(exposure.hasCharges).toBe(false);
  });

  it("computes interest + collection costs for a past-due invoice, matching the engine", () => {
    const overdue = item({ invoiceId: "inv-late", grossCents: 121000 });
    const exposure = summarizeObligationOverdueCharges([overdue], NOW);

    const expectedInterest = calculateStatutoryInterestCents({
      principalCents: 121000,
      dueAt: overdue.dueDate,
      now: NOW,
    });
    const expectedCollection = calculateCollectionCostsCents(121000);

    expect(exposure.hasCharges).toBe(true);
    expect(exposure.count).toBe(1);
    expect(exposure.totalInterestCents).toBe(expectedInterest);
    expect(exposure.totalCollectionCostsCents).toBe(expectedCollection);
    expect(exposure.totalExtraCents).toBe(expectedInterest + expectedCollection);
    expect(exposure.interestRateBps).toBeGreaterThan(0);
    const [first] = exposure.items;
    expect(first?.invoiceId).toBe("inv-late");
    expect(first?.charges.daysOverdue).toBe(30);
  });

  it("aggregates across multiple past-due invoices and skips non-charging ones", () => {
    const invoiceA = item({
      invoiceId: "a",
      grossCents: 121000,
      dueDate: new Date(NOW.getTime() - 30 * DAY),
    });
    const invoiceB = item({
      invoiceId: "b",
      grossCents: 60500,
      dueDate: new Date(NOW.getTime() - 10 * DAY),
    });
    // Not yet due → contributes nothing.
    const invoiceC = item({
      invoiceId: "c",
      stage: "APPROVED",
      grossCents: 50000,
      dueDate: new Date(NOW.getTime() + 3 * DAY),
    });
    const exposure = summarizeObligationOverdueCharges([invoiceA, invoiceB, invoiceC], NOW);

    const sumInterest =
      calculateStatutoryInterestCents({
        principalCents: 121000,
        dueAt: invoiceA.dueDate,
        now: NOW,
      }) +
      calculateStatutoryInterestCents({ principalCents: 60500, dueAt: invoiceB.dueDate, now: NOW });
    const sumCollection =
      calculateCollectionCostsCents(121000) + calculateCollectionCostsCents(60500);

    expect(exposure.count).toBe(2);
    expect(exposure.items.map((entry) => entry.invoiceId)).toEqual(["a", "b"]);
    expect(exposure.totalInterestCents).toBe(sumInterest);
    expect(exposure.totalCollectionCostsCents).toBe(sumCollection);
    expect(exposure.totalExtraCents).toBe(sumInterest + sumCollection);
  });

  it("honours a custom annual interest rate", () => {
    const overdue = item({ grossCents: 121000, dueDate: new Date(NOW.getTime() - 100 * DAY) });
    const low = summarizeObligationOverdueCharges([overdue], NOW, 400);
    const high = summarizeObligationOverdueCharges([overdue], NOW, 1600);
    expect(high.totalInterestCents).toBeGreaterThan(low.totalInterestCents);
    expect(low.interestRateBps).toBe(400);
    expect(high.interestRateBps).toBe(1600);
  });
});

describe("chargesByInvoiceId", () => {
  it("maps invoiceId → charges for every charged item", () => {
    const items: ObligationItem[] = [
      item({ invoiceId: "a", dueDate: new Date(NOW.getTime() - 20 * DAY) }),
      item({ invoiceId: "b", dueDate: new Date(NOW.getTime() - 5 * DAY) }),
    ];
    const exposure = summarizeObligationOverdueCharges(items, NOW);
    const map = chargesByInvoiceId(exposure);
    expect(map.size).toBe(2);
    expect(map.get("a")?.daysOverdue).toBe(20);
    expect(map.get("b")?.daysOverdue).toBe(5);
    expect(map.has("c")).toBe(false);
  });

  it("returns an empty map for an empty exposure", () => {
    const map = chargesByInvoiceId(summarizeObligationOverdueCharges([], NOW));
    expect(map.size).toBe(0);
  });
});
