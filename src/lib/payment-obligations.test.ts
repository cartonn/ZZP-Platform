import { describe, expect, it } from "vitest";
import {
  buildPaymentObligations,
  exportObligationsCsv,
  type ObligationItem,
  type ObligationStage,
} from "./payment-obligations";

// Fixed "now": 15 June 2026, 12:00 UTC.
const NOW = new Date("2026-06-15T12:00:00.000Z");

function item(overrides: Partial<ObligationItem> & { invoiceId: string }): ObligationItem {
  return {
    stage: "APPROVED" as ObligationStage,
    netCents: 10000,
    vatCents: 2100,
    grossCents: 12100,
    dueDate: new Date("2026-06-20T00:00:00.000Z"),
    counterpartyName: "Sanne de Vries",
    number: "2026-0001",
    jobTitle: "Nachtdienst VVT",
    ...overrides,
  };
}

describe("buildPaymentObligations", () => {
  it("returns empty result for no items", () => {
    const result = buildPaymentObligations([], NOW);
    expect(result.buckets).toEqual([]);
    expect(result.totalGrossCents).toBe(0);
    expect(result.totalNetCents).toBe(0);
    expect(result.totalVatCents).toBe(0);
    expect(result.awaitingApprovalGrossCents).toBe(0);
    expect(result.scheduledGrossCents).toBe(0);
    expect(result.overdueGrossCents).toBe(0);
  });

  it("buckets an APPROVED invoice due this month under THIS_MONTH", () => {
    const result = buildPaymentObligations(
      [item({ invoiceId: "a", dueDate: new Date("2026-06-25T00:00:00.000Z") })],
      NOW,
    );
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]!.key).toBe("THIS_MONTH");
    expect(result.buckets[0]!.label).toBe("Deze maand");
    expect(result.scheduledGrossCents).toBe(12100);
  });

  it("buckets next month and later correctly", () => {
    const result = buildPaymentObligations(
      [
        item({ invoiceId: "next", dueDate: new Date("2026-07-10T00:00:00.000Z") }),
        item({ invoiceId: "later", dueDate: new Date("2026-09-10T00:00:00.000Z") }),
      ],
      NOW,
    );
    const keys = result.buckets.map((b) => b.key);
    expect(keys).toEqual(["NEXT_MONTH", "LATER"]);
  });

  it("wraps December → January for next month", () => {
    const dec = new Date("2026-12-15T12:00:00.000Z");
    const result = buildPaymentObligations(
      [item({ invoiceId: "jan", dueDate: new Date("2027-01-05T00:00:00.000Z") })],
      dec,
    );
    expect(result.buckets[0]!.key).toBe("NEXT_MONTH");
  });

  it("treats OVERDUE stage as overdue regardless of dueDate", () => {
    const result = buildPaymentObligations(
      [
        item({
          invoiceId: "od",
          stage: "OVERDUE",
          dueDate: new Date("2026-12-31T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    expect(result.buckets[0]!.key).toBe("OVERDUE");
    expect(result.overdueGrossCents).toBe(12100);
    expect(result.scheduledGrossCents).toBe(0);
  });

  it("treats an APPROVED invoice with a past dueDate as overdue", () => {
    const result = buildPaymentObligations(
      [
        item({
          invoiceId: "past",
          stage: "APPROVED",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    expect(result.buckets[0]!.key).toBe("OVERDUE");
    expect(result.overdueGrossCents).toBe(12100);
    expect(result.scheduledGrossCents).toBe(0);
  });

  it("counts a dueDate exactly at start of today as not overdue", () => {
    // start of today = 2026-06-15T00:00:00Z; dueDate equal to it is not < start.
    const result = buildPaymentObligations(
      [item({ invoiceId: "today", dueDate: new Date("2026-06-15T00:00:00.000Z") })],
      NOW,
    );
    expect(result.buckets[0]!.key).toBe("THIS_MONTH");
    expect(result.overdueGrossCents).toBe(0);
    expect(result.scheduledGrossCents).toBe(12100);
  });

  it("puts SUBMITTED (awaiting approval) invoices in UNSCHEDULED", () => {
    const result = buildPaymentObligations(
      [item({ invoiceId: "sub", stage: "SUBMITTED", dueDate: null })],
      NOW,
    );
    expect(result.buckets[0]!.key).toBe("UNSCHEDULED");
    expect(result.buckets[0]!.label).toBe("Nog goed te keuren");
    expect(result.awaitingApprovalGrossCents).toBe(12100);
    expect(result.scheduledGrossCents).toBe(0);
    expect(result.overdueGrossCents).toBe(0);
  });

  it("orders buckets OVERDUE → THIS_MONTH → NEXT_MONTH → LATER → UNSCHEDULED", () => {
    const result = buildPaymentObligations(
      [
        item({ invoiceId: "u", stage: "SUBMITTED", dueDate: null }),
        item({ invoiceId: "l", dueDate: new Date("2026-09-01T00:00:00.000Z") }),
        item({ invoiceId: "o", stage: "OVERDUE" }),
        item({ invoiceId: "n", dueDate: new Date("2026-07-01T00:00:00.000Z") }),
        item({ invoiceId: "t", dueDate: new Date("2026-06-30T00:00:00.000Z") }),
      ],
      NOW,
    );
    expect(result.buckets.map((b) => b.key)).toEqual([
      "OVERDUE",
      "THIS_MONTH",
      "NEXT_MONTH",
      "LATER",
      "UNSCHEDULED",
    ]);
  });

  it("sorts dated items by dueDate asc, then gross desc, then invoiceId asc", () => {
    const result = buildPaymentObligations(
      [
        item({
          invoiceId: "b",
          dueDate: new Date("2026-06-20T00:00:00.000Z"),
          grossCents: 5000,
        }),
        item({
          invoiceId: "a",
          dueDate: new Date("2026-06-20T00:00:00.000Z"),
          grossCents: 9000,
        }),
        item({
          invoiceId: "c",
          dueDate: new Date("2026-06-18T00:00:00.000Z"),
          grossCents: 100,
        }),
      ],
      NOW,
    );
    const thisMonth = result.buckets.find((b) => b.key === "THIS_MONTH")!;
    expect(thisMonth.items.map((i) => i.invoiceId)).toEqual(["c", "a", "b"]);
  });

  it("aggregates net/vat/gross per bucket and overall", () => {
    const result = buildPaymentObligations(
      [
        item({
          invoiceId: "a",
          netCents: 10000,
          vatCents: 2100,
          grossCents: 12100,
          dueDate: new Date("2026-06-20T00:00:00.000Z"),
        }),
        item({
          invoiceId: "b",
          netCents: 5000,
          vatCents: 1050,
          grossCents: 6050,
          dueDate: new Date("2026-06-22T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    const bucket = result.buckets[0]!;
    expect(bucket.netCents).toBe(15000);
    expect(bucket.vatCents).toBe(3150);
    expect(bucket.grossCents).toBe(18150);
    expect(result.totalNetCents).toBe(15000);
    expect(result.totalVatCents).toBe(3150);
    expect(result.totalGrossCents).toBe(18150);
  });

  it("does not mutate the input array", () => {
    const items = Object.freeze([
      item({ invoiceId: "a", dueDate: new Date("2026-09-01T00:00:00.000Z") }),
      item({ invoiceId: "b", dueDate: new Date("2026-06-20T00:00:00.000Z") }),
    ]) as ObligationItem[];
    expect(() => buildPaymentObligations(items, NOW)).not.toThrow();
    expect(items[0]!.invoiceId).toBe("a");
    expect(items[1]!.invoiceId).toBe("b");
  });
});

describe("exportObligationsCsv", () => {
  const HEADER =
    "Categorie;Status;Tegenpartij;Opdracht;Factuurnummer;Vervaldatum;Netto (EUR);BTW (EUR);Bruto (EUR)";

  it("emits the header row", () => {
    const csv = exportObligationsCsv(
      [item({ invoiceId: "a", dueDate: new Date("2026-06-20T00:00:00.000Z") })],
      NOW,
    );
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(HEADER);
  });

  it("emits one data row per item (plus the header)", () => {
    const csv = exportObligationsCsv(
      [
        item({ invoiceId: "a", dueDate: new Date("2026-06-20T00:00:00.000Z") }),
        item({ invoiceId: "b", dueDate: new Date("2026-07-10T00:00:00.000Z") }),
      ],
      NOW,
    );
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
  });

  it("uses the bucket label as Categorie", () => {
    const csv = exportObligationsCsv(
      [item({ invoiceId: "a", dueDate: new Date("2026-06-25T00:00:00.000Z") })],
      NOW,
    );
    const dataRow = csv.split("\r\n")[1]!;
    expect(dataRow.startsWith("Deze maand;")).toBe(true);
  });

  it("formats euro amounts with comma decimals", () => {
    const csv = exportObligationsCsv(
      [
        item({
          invoiceId: "a",
          netCents: 10000,
          vatCents: 2100,
          grossCents: 12100,
          dueDate: new Date("2026-06-20T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    const dataRow = csv.split("\r\n")[1]!;
    expect(dataRow).toContain(";100,00;21,00;121,00");
  });

  it("emits the Dutch stage label and ISO due date", () => {
    const csv = exportObligationsCsv(
      [
        item({
          invoiceId: "a",
          stage: "OVERDUE",
          dueDate: new Date("2026-06-01T00:00:00.000Z"),
        }),
      ],
      NOW,
    );
    const dataRow = csv.split("\r\n")[1]!;
    expect(dataRow).toContain(";Te laat;");
    expect(dataRow).toContain(";2026-06-01;");
  });

  it("returns only the header for an empty list (one line)", () => {
    const csv = exportObligationsCsv([], NOW);
    expect(csv).toBe(HEADER);
    expect(csv.split("\r\n")).toHaveLength(1);
  });
});
