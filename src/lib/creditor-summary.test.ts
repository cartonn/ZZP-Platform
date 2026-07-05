import { describe, expect, it } from "vitest";
import { shouldShowCreditorSummary, summarizeCreditors } from "./creditor-summary";
import { type ObligationItem, type ObligationStage } from "./payment-obligations";

// Fixed "now": 15 June 2026, 12:00 UTC.
const NOW = new Date("2026-06-15T12:00:00.000Z");

function item(overrides: Partial<ObligationItem> & { invoiceId: string }): ObligationItem {
  return {
    stage: "APPROVED" as ObligationStage,
    netCents: 10000,
    vatCents: 2100,
    grossCents: 12100,
    dueDate: new Date("2026-06-20T00:00:00.000Z"),
    counterpartyId: "prof-sanne",
    counterpartyName: "Sanne de Vries",
    number: "2026-0001",
    jobTitle: "Nachtdienst VVT",
    ...overrides,
  };
}

describe("summarizeCreditors", () => {
  it("returns empty summary for no items", () => {
    const s = summarizeCreditors([], NOW);
    expect(s.creditors).toEqual([]);
    expect(s.totalOutstandingCents).toBe(0);
    expect(s.totalOverdueCents).toBe(0);
  });

  it("groups multiple invoices of one supplier into a single row", () => {
    const s = summarizeCreditors(
      [item({ invoiceId: "a", grossCents: 12100 }), item({ invoiceId: "b", grossCents: 5000 })],
      NOW,
    );
    expect(s.creditors).toHaveLength(1);
    expect(s.creditors[0]!.supplierId).toBe("prof-sanne");
    expect(s.creditors[0]!.invoiceCount).toBe(2);
    expect(s.creditors[0]!.outstandingCents).toBe(17100);
    expect(s.totalOutstandingCents).toBe(17100);
  });

  it("skips items without a supplier id (a creditor is by definition a supplier)", () => {
    const s = summarizeCreditors(
      [item({ invoiceId: "a", counterpartyId: null, grossCents: 9999 })],
      NOW,
    );
    expect(s.creditors).toEqual([]);
    expect(s.totalOutstandingCents).toBe(0);
  });

  it("counts overdue amount from stage OVERDUE and from a passed due date", () => {
    const s = summarizeCreditors(
      [
        item({ invoiceId: "a", stage: "OVERDUE", dueDate: null, grossCents: 4000 }),
        item({
          invoiceId: "b",
          stage: "APPROVED",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
          grossCents: 3000,
        }),
        item({
          invoiceId: "c",
          stage: "APPROVED",
          dueDate: new Date("2026-06-25T00:00:00.000Z"),
          grossCents: 2000,
        }),
      ],
      NOW,
    );
    const row = s.creditors[0]!;
    expect(row.overdueCents).toBe(7000);
    expect(row.overdueCount).toBe(2);
    expect(row.outstandingCents).toBe(9000);
    expect(s.totalOverdueCents).toBe(7000);
  });

  it("tracks amount still awaiting approval (SUBMITTED, no due date)", () => {
    const s = summarizeCreditors(
      [
        item({ invoiceId: "a", stage: "SUBMITTED", dueDate: null, grossCents: 6000 }),
        item({ invoiceId: "b", stage: "APPROVED", grossCents: 4000 }),
      ],
      NOW,
    );
    expect(s.creditors[0]!.awaitingApprovalCents).toBe(6000);
  });

  it("reports the earliest non-overdue due date and days until it", () => {
    const s = summarizeCreditors(
      [
        item({ invoiceId: "a", dueDate: new Date("2026-06-25T00:00:00.000Z") }),
        item({ invoiceId: "b", dueDate: new Date("2026-06-18T00:00:00.000Z") }),
        // An overdue one must not become the "earliest upcoming" due date.
        item({ invoiceId: "c", stage: "OVERDUE", dueDate: new Date("2026-06-01T00:00:00.000Z") }),
      ],
      NOW,
    );
    const row = s.creditors[0]!;
    expect(row.earliestDueDate).toEqual(new Date("2026-06-18T00:00:00.000Z"));
    // 15 June 12:00 → 18 June 00:00 = 2 whole days (floor).
    expect(row.daysUntilEarliestDue).toBe(2);
  });

  it("sorts suppliers by overdue, then outstanding, then name", () => {
    const s = summarizeCreditors(
      [
        // Supplier A: high outstanding, no overdue.
        item({ invoiceId: "a1", counterpartyId: "A", counterpartyName: "Anna", grossCents: 50000 }),
        // Supplier B: some overdue → must rank first.
        item({
          invoiceId: "b1",
          counterpartyId: "B",
          counterpartyName: "Bram",
          stage: "OVERDUE",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
          grossCents: 1000,
        }),
      ],
      NOW,
    );
    expect(s.creditors.map((c) => c.supplierId)).toEqual(["B", "A"]);
  });

  it("breaks ties on outstanding amount, then alphabetically by name", () => {
    const s = summarizeCreditors(
      [
        item({ invoiceId: "z", counterpartyId: "Z", counterpartyName: "Zoë", grossCents: 1000 }),
        item({ invoiceId: "a", counterpartyId: "A", counterpartyName: "Aad", grossCents: 1000 }),
      ],
      NOW,
    );
    expect(s.creditors.map((c) => c.supplierName)).toEqual(["Aad", "Zoë"]);
  });
});

describe("shouldShowCreditorSummary", () => {
  it("shows when there are two or more suppliers", () => {
    const s = summarizeCreditors(
      [
        item({ invoiceId: "a", counterpartyId: "A", counterpartyName: "Anna" }),
        item({ invoiceId: "b", counterpartyId: "B", counterpartyName: "Bram" }),
      ],
      NOW,
    );
    expect(shouldShowCreditorSummary(s)).toBe(true);
  });

  it("shows for a single supplier when something is overdue", () => {
    const s = summarizeCreditors(
      [
        item({
          invoiceId: "a",
          stage: "OVERDUE",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    expect(shouldShowCreditorSummary(s)).toBe(true);
  });

  it("hides for a single supplier with nothing overdue (adds nothing over the total card)", () => {
    const s = summarizeCreditors([item({ invoiceId: "a" })], NOW);
    expect(shouldShowCreditorSummary(s)).toBe(false);
  });
});
