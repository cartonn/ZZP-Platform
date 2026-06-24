import { describe, expect, it } from "vitest";
import {
  RATE_FIT_LABEL,
  RATE_FIT_VARIANT,
  classifyProposedRateFit,
  type RateBudgetFit,
} from "@/lib/rate-fit";

describe("classifyProposedRateFit", () => {
  it("geeft 'unknown' zonder voorstel", () => {
    expect(classifyProposedRateFit(null, 40, 60)).toBe("unknown");
    expect(classifyProposedRateFit(undefined, 40, 60)).toBe("unknown");
  });

  it("geeft 'unknown' als de opdracht geen budgetgrenzen heeft", () => {
    expect(classifyProposedRateFit(50, null, null)).toBe("unknown");
    expect(classifyProposedRateFit(50, undefined, undefined)).toBe("unknown");
  });

  it("classificeert binnen het budget (grenzen inclusief)", () => {
    expect(classifyProposedRateFit(50, 40, 60)).toBe("within");
    expect(classifyProposedRateFit(40, 40, 60)).toBe("within"); // op de bodem
    expect(classifyProposedRateFit(60, 40, 60)).toBe("within"); // op het plafond
  });

  it("classificeert boven het plafond", () => {
    expect(classifyProposedRateFit(61, 40, 60)).toBe("above");
    expect(classifyProposedRateFit(80, 40, 60)).toBe("above");
  });

  it("classificeert onder de bodem", () => {
    expect(classifyProposedRateFit(39, 40, 60)).toBe("below");
    expect(classifyProposedRateFit(10, 40, 60)).toBe("below");
  });

  it("werkt met alleen een plafond (rateMax)", () => {
    expect(classifyProposedRateFit(50, null, 60)).toBe("within");
    expect(classifyProposedRateFit(70, null, 60)).toBe("above");
    expect(classifyProposedRateFit(0, null, 60)).toBe("within"); // geen bodem → niet 'below'
  });

  it("werkt met alleen een bodem (rateMin)", () => {
    expect(classifyProposedRateFit(50, 40, null)).toBe("within");
    expect(classifyProposedRateFit(30, 40, null)).toBe("below");
    expect(classifyProposedRateFit(9999, 40, null)).toBe("within"); // geen plafond → niet 'above'
  });

  it("laat het plafond vóór de bodem gaan bij een omgekeerd budget", () => {
    // Defensief: als rateMin > rateMax (foute invoer), telt het plafond eerst.
    expect(classifyProposedRateFit(70, 80, 60)).toBe("above");
  });

  it("dekt elke niet-'unknown' uitkomst met label én variant", () => {
    const fits: Exclude<RateBudgetFit, "unknown">[] = ["within", "below", "above"];
    for (const fit of fits) {
      expect(RATE_FIT_LABEL[fit]).toBeTruthy();
      expect(RATE_FIT_VARIANT[fit]).toBeTruthy();
    }
  });
});
