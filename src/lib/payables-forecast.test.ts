import { describe, expect, it } from "vitest";
import {
  summarizePayablesForecast,
  PAYABLES_HORIZON_DAYS,
  type PayableInvoiceInput,
} from "./payables-forecast";

const MS_PER_DAY = 86_400_000;
const NOW = new Date("2026-07-18T12:00:00.000Z").getTime();

function inv(totalCents: number, dueAt: Date | null, outstanding: boolean): PayableInvoiceInput {
  return { totalCents, dueAt, outstanding };
}

describe("summarizePayablesForecast", () => {
  it("counts an outstanding invoice due within the horizon as next30", () => {
    const soon = new Date(NOW + 10 * MS_PER_DAY);
    const result = summarizePayablesForecast([inv(50_000, soon, true)], NOW);
    expect(result.next30Cents).toBe(50_000);
    expect(result.next30Count).toBe(1);
    expect(result.laterCents).toBe(0);
    expect(result.laterCount).toBe(0);
  });

  it("counts an invoice due beyond the horizon as later", () => {
    const far = new Date(NOW + (PAYABLES_HORIZON_DAYS + 5) * MS_PER_DAY);
    const result = summarizePayablesForecast([inv(80_000, far, true)], NOW);
    expect(result.next30Cents).toBe(0);
    expect(result.laterCents).toBe(80_000);
    expect(result.laterCount).toBe(1);
  });

  it("counts an already-overdue invoice as next30 (due now)", () => {
    const past = new Date(NOW - 20 * MS_PER_DAY);
    const result = summarizePayablesForecast([inv(30_000, past, true)], NOW);
    expect(result.next30Cents).toBe(30_000);
    expect(result.next30Count).toBe(1);
  });

  it("treats the horizon boundary as inclusive (next30)", () => {
    const boundary = new Date(NOW + PAYABLES_HORIZON_DAYS * MS_PER_DAY);
    const result = summarizePayablesForecast([inv(12_345, boundary, true)], NOW);
    expect(result.next30Cents).toBe(12_345);
    expect(result.laterCents).toBe(0);
  });

  it("ignores paid/settled invoices (not outstanding)", () => {
    const soon = new Date(NOW + 5 * MS_PER_DAY);
    const result = summarizePayablesForecast([inv(99_000, soon, false)], NOW);
    expect(result.next30Cents).toBe(0);
    expect(result.next30Count).toBe(0);
  });

  it("ignores outstanding invoices without a due date", () => {
    const result = summarizePayablesForecast([inv(40_000, null, true)], NOW);
    expect(result.next30Cents).toBe(0);
    expect(result.laterCents).toBe(0);
  });

  it("aggregates a mixed set correctly", () => {
    const soon = new Date(NOW + 3 * MS_PER_DAY);
    const overdue = new Date(NOW - 2 * MS_PER_DAY); // overdue → next30
    const far = new Date(NOW + 60 * MS_PER_DAY);
    const result = summarizePayablesForecast(
      [
        inv(10_000, soon, true),
        inv(20_000, overdue, true),
        inv(70_000, far, true),
        inv(15_000, soon, false), // paid → ignored
        inv(5_000, null, true), // no due date → ignored
      ],
      NOW,
    );
    expect(result.next30Cents).toBe(30_000);
    expect(result.next30Count).toBe(2);
    expect(result.laterCents).toBe(70_000);
    expect(result.laterCount).toBe(1);
  });

  it("returns all-zero for an empty list", () => {
    const result = summarizePayablesForecast([], NOW);
    expect(result).toEqual({ next30Cents: 0, next30Count: 0, laterCents: 0, laterCount: 0 });
  });
});
