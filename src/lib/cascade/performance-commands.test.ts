import { describe, expect, it } from "vitest";
import { CascadeError } from "@/lib/cascade/commands-shared";
import { MAX_PERFORMANCE_HOURS, MAX_MILESTONE_CENTS } from "@/lib/validation";
import { assertPerformanceWithinLimits } from "@/lib/cascade/performance-commands";

// Server-side ondergrens (regel 1): assertPerformanceWithinLimits is de bron van waarheid voor élk
// pad naar createPerformance/updatePerformance en moet negatieve/nul uren én bedragen weigeren,
// onafhankelijk van de Zod-formuliercheck. Zonder deze check zou een negatieve prestatie een
// negatieve factuur (performanceSubtotalCents) kunnen opleveren.
describe("assertPerformanceWithinLimits — ondergrens uren", () => {
  it("weigert negatieve uren", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: -1 })).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: -1 })).toThrow(
      "Het aantal uren moet groter dan 0 zijn.",
    );
  });

  it("weigert nul uren", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 0 })).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 0 })).toThrow(
      "Het aantal uren moet groter dan 0 zijn.",
    );
  });

  it("staat een normale positieve waarde toe", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 8 })).not.toThrow();
  });

  it("behoudt het null-pad (concept zonder uren) — gooit niet", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: null })).not.toThrow();
    expect(() => assertPerformanceWithinLimits({ type: "HOURS" })).not.toThrow();
  });

  it("blijft de bovengrens en niet-eindige waarden weigeren", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: MAX_PERFORMANCE_HOURS + 1 }),
    ).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: NaN })).toThrow(
      CascadeError,
    );
  });
});

describe("assertPerformanceWithinLimits — ondergrens bedrag (MILESTONE)", () => {
  it("weigert een negatief bedrag", () => {
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: -100 })).toThrow(
      CascadeError,
    );
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: -100 })).toThrow(
      "Het bedrag moet groter dan 0 zijn.",
    );
  });

  it("weigert een nul bedrag", () => {
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 0 })).toThrow(
      CascadeError,
    );
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 0 })).toThrow(
      "Het bedrag moet groter dan 0 zijn.",
    );
  });

  it("staat een normaal positief bedrag toe", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 50_000 }),
    ).not.toThrow();
  });

  it("behoudt het null-pad (concept zonder bedrag) — gooit niet", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: null }),
    ).not.toThrow();
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE" })).not.toThrow();
  });

  it("blijft de bovengrens en niet-eindige waarden weigeren", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: MAX_MILESTONE_CENTS + 1 }),
    ).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: NaN })).toThrow(
      CascadeError,
    );
  });
});
