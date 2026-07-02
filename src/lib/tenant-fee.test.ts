import { describe, expect, it } from "vitest";
import { computeTenantFee, TENANT_FEE_PERCENT_MAX } from "@/lib/tenant-fee";

describe("computeTenantFee", () => {
  it("0% levert altijd 0 fee", () => {
    expect(computeTenantFee(100_000, 0)).toBe(0);
  });

  it("berekent een gewone fee (10% over € 1.000,00)", () => {
    expect(computeTenantFee(100_000, 10)).toBe(10_000);
  });

  it("bovengrens 50% levert de helft van het volume", () => {
    expect(computeTenantFee(100_000, TENANT_FEE_PERCENT_MAX)).toBe(50_000);
  });

  it("rondt rekenkundig af op hele centen (12,5% over € 100,01)", () => {
    // 10001 * 12.5 / 100 = 1250.125 → 1250
    expect(computeTenantFee(10_001, 12.5)).toBe(1_250);
  });

  it("rondt naar boven wanneer de halve cent dat vereist", () => {
    // 12 * 12.5 / 100 = 1.5 → 2
    expect(computeTenantFee(12, 12.5)).toBe(2);
  });

  it("nul of negatief volume levert 0", () => {
    expect(computeTenantFee(0, 20)).toBe(0);
    expect(computeTenantFee(-5000, 20)).toBe(0);
  });

  it("niet-eindige invoer levert 0 (defensief)", () => {
    expect(computeTenantFee(Number.NaN, 10)).toBe(0);
    expect(computeTenantFee(100_000, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
