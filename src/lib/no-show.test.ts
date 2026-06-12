import { describe, expect, it } from "vitest";
import { NO_SHOW_LIMIT, noShowStanding } from "@/lib/no-show";

describe("noShowStanding", () => {
  it("zonder ongegronde no-shows is er niets aan de hand", () => {
    expect(noShowStanding(0)).toEqual({ unjustified: 0, remaining: NO_SHOW_LIMIT, atLimit: false });
  });

  it("telt af richting de grens", () => {
    expect(noShowStanding(1)).toEqual({ unjustified: 1, remaining: 2, atLimit: false });
    expect(noShowStanding(2)).toEqual({ unjustified: 2, remaining: 1, atLimit: false });
  });

  it("op de grens (3) is de uitschrijf-taak aan de orde", () => {
    expect(noShowStanding(NO_SHOW_LIMIT)).toEqual({
      unjustified: 3,
      remaining: 0,
      atLimit: true,
    });
  });

  it("boven de grens blijft atLimit waar en remaining 0", () => {
    expect(noShowStanding(5)).toEqual({ unjustified: 5, remaining: 0, atLimit: true });
  });

  it("negatieve invoer wordt op 0 geklemd", () => {
    expect(noShowStanding(-2)).toEqual({ unjustified: 0, remaining: 3, atLimit: false });
  });

  it("eigen grens overschrijft de default", () => {
    expect(noShowStanding(2, 2)).toEqual({ unjustified: 2, remaining: 0, atLimit: true });
  });
});
