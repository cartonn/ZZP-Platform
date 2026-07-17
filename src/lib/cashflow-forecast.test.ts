import { describe, expect, it } from "vitest";
import {
  summarizeCashflowForecast,
  CASHFLOW_HORIZON_DAYS,
  type CashflowInvoiceInput,
} from "./cashflow-forecast";
import { type PayoutForecast } from "./invoice-payment-forecast";

const MS_PER_DAY = 86_400_000;
const NOW = new Date("2026-07-17T12:00:00.000Z").getTime();

function confident(expectedAt: Date): PayoutForecast {
  return { expectedAt, basis: "history", confident: true, daysAfterDue: 0 };
}
function dueBased(expectedAt: Date): PayoutForecast {
  return { expectedAt, basis: "due", confident: false, daysAfterDue: 0 };
}
function inv(totalCents: number, forecast: PayoutForecast | null): CashflowInvoiceInput {
  return { totalCents, forecast };
}

describe("summarizeCashflowForecast", () => {
  it("counts a confident forecast within the horizon as next30", () => {
    const soon = new Date(NOW + 10 * MS_PER_DAY);
    const result = summarizeCashflowForecast([inv(50_000, confident(soon))], NOW);
    expect(result.next30Cents).toBe(50_000);
    expect(result.next30Count).toBe(1);
    expect(result.laterCents).toBe(0);
    expect(result.laterCount).toBe(0);
  });

  it("counts a forecast beyond the horizon as later", () => {
    const far = new Date(NOW + (CASHFLOW_HORIZON_DAYS + 5) * MS_PER_DAY);
    const result = summarizeCashflowForecast([inv(80_000, confident(far))], NOW);
    expect(result.next30Cents).toBe(0);
    expect(result.next30Count).toBe(0);
    expect(result.laterCents).toBe(80_000);
    expect(result.laterCount).toBe(1);
  });

  it("counts an already-overdue confident forecast as next30 (expected now)", () => {
    const past = new Date(NOW - 20 * MS_PER_DAY);
    const result = summarizeCashflowForecast([inv(30_000, confident(past))], NOW);
    expect(result.next30Cents).toBe(30_000);
    expect(result.next30Count).toBe(1);
  });

  it("treats the horizon boundary as inclusive (next30)", () => {
    const boundary = new Date(NOW + CASHFLOW_HORIZON_DAYS * MS_PER_DAY);
    const result = summarizeCashflowForecast([inv(12_345, confident(boundary))], NOW);
    expect(result.next30Cents).toBe(12_345);
    expect(result.laterCents).toBe(0);
  });

  it("ignores non-confident (due-based) forecasts", () => {
    const soon = new Date(NOW + 5 * MS_PER_DAY);
    const result = summarizeCashflowForecast([inv(99_000, dueBased(soon))], NOW);
    expect(result.next30Cents).toBe(0);
    expect(result.next30Count).toBe(0);
    expect(result.laterCents).toBe(0);
  });

  it("ignores invoices without a forecast (paid/settled)", () => {
    const result = summarizeCashflowForecast([inv(40_000, null)], NOW);
    expect(result.next30Cents).toBe(0);
    expect(result.next30Count).toBe(0);
  });

  it("aggregates a mixed set correctly", () => {
    const soonA = new Date(NOW + 3 * MS_PER_DAY);
    const soonB = new Date(NOW - 2 * MS_PER_DAY); // overdue → next30
    const far = new Date(NOW + 60 * MS_PER_DAY);
    const result = summarizeCashflowForecast(
      [
        inv(10_000, confident(soonA)),
        inv(20_000, confident(soonB)),
        inv(70_000, confident(far)),
        inv(15_000, dueBased(soonA)), // ignored
        inv(5_000, null), // ignored
      ],
      NOW,
    );
    expect(result.next30Cents).toBe(30_000);
    expect(result.next30Count).toBe(2);
    expect(result.laterCents).toBe(70_000);
    expect(result.laterCount).toBe(1);
  });

  it("returns all-zero for an empty list", () => {
    const result = summarizeCashflowForecast([], NOW);
    expect(result).toEqual({ next30Cents: 0, next30Count: 0, laterCents: 0, laterCount: 0 });
  });
});
