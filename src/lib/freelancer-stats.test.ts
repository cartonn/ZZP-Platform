import { describe, expect, it } from "vitest";
import { ratePercent } from "@/lib/freelancer-stats";

describe("ratePercent", () => {
  it("berekent een afgerond percentage", () => {
    expect(ratePercent(1, 4)).toBe(25);
    expect(ratePercent(2, 3)).toBe(67);
  });

  it("is 0 bij geen of negatief totaal (geen deling door nul)", () => {
    expect(ratePercent(0, 0)).toBe(0);
    expect(ratePercent(5, 0)).toBe(0);
    expect(ratePercent(1, -3)).toBe(0);
  });

  it("is 100 als het deel gelijk is aan het totaal", () => {
    expect(ratePercent(7, 7)).toBe(100);
  });
});
