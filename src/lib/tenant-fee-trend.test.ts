import { describe, expect, it } from "vitest";
import { buildTenantFeeTrend } from "./tenant-fee-trend";
import { type RevenueTrend } from "./revenue-trend";

function trendFrom(cents: number[]): RevenueTrend {
  const series = cents.map((c, i) => ({ key: `2026-0${i + 1}`, label: `m${i + 1}`, cents: c }));
  return {
    series,
    deltaPct: null,
    currentCents: series.at(-1)?.cents ?? 0,
    totalCents: series.reduce((s, m) => s + m.cents, 0),
    hasData: series.some((m) => m.cents > 0),
  };
}

describe("buildTenantFeeTrend", () => {
  it("computes fee per month from volume × feePercent", () => {
    const result = buildTenantFeeTrend(trendFrom([100_000, 200_000]), 10);
    expect(result.series.map((m) => m.feeCents)).toEqual([10_000, 20_000]);
    expect(result.series.map((m) => m.volumeCents)).toEqual([100_000, 200_000]);
    expect(result.totalFeeCents).toBe(30_000);
    expect(result.totalVolumeCents).toBe(300_000);
    expect(result.months).toBe(2);
    expect(result.hasData).toBe(true);
  });

  it("preserves key + label from the revenue trend", () => {
    const result = buildTenantFeeTrend(trendFrom([50_000]), 12.5);
    expect(result.series[0]).toMatchObject({ key: "2026-01", label: "m1" });
  });

  it("rounds each month independently (total = sum of rounded months)", () => {
    // 12.5% of 1001 = 125.125 → 125; of 3003 = 375.375 → 375
    const result = buildTenantFeeTrend(trendFrom([1001, 3003]), 12.5);
    expect(result.series.map((m) => m.feeCents)).toEqual([125, 375]);
    expect(result.totalFeeCents).toBe(500);
  });

  it("yields zero fee and no data when feePercent is 0", () => {
    const result = buildTenantFeeTrend(trendFrom([100_000, 200_000]), 0);
    expect(result.series.every((m) => m.feeCents === 0)).toBe(true);
    expect(result.totalFeeCents).toBe(0);
    expect(result.hasData).toBe(false);
    expect(result.deltaPct).toBeNull();
  });

  it("has no data when every month has zero volume", () => {
    const result = buildTenantFeeTrend(trendFrom([0, 0, 0]), 10);
    expect(result.hasData).toBe(false);
    expect(result.totalFeeCents).toBe(0);
  });

  it("computes deltaPct from the last two months' fee", () => {
    const result = buildTenantFeeTrend(trendFrom([100_000, 150_000]), 10);
    // fee 10_000 → 15_000 = +50%
    expect(result.deltaPct).toBe(50);
  });

  it("returns null deltaPct when the previous month had no fee", () => {
    const result = buildTenantFeeTrend(trendFrom([0, 100_000]), 10);
    expect(result.deltaPct).toBeNull();
  });

  it("returns null deltaPct for a single-month window", () => {
    const result = buildTenantFeeTrend(trendFrom([100_000]), 10);
    expect(result.deltaPct).toBeNull();
  });

  it("handles an empty series", () => {
    const result = buildTenantFeeTrend(trendFrom([]), 10);
    expect(result.series).toEqual([]);
    expect(result.totalFeeCents).toBe(0);
    expect(result.months).toBe(0);
    expect(result.hasData).toBe(false);
    expect(result.deltaPct).toBeNull();
  });
});
