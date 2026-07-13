import { describe, expect, it } from "vitest";
import { formatDeltaPct, earningsDeltaTone } from "./revenue-delta";

describe("formatDeltaPct", () => {
  it("geeft undefined zonder vorige-maand-basis (null)", () => {
    expect(formatDeltaPct(null)).toBeUndefined();
  });

  it("zet een expliciet plusteken bij groei", () => {
    expect(formatDeltaPct(12)).toBe("+12%");
  });

  it("toont het minteken uit het getal bij daling", () => {
    expect(formatDeltaPct(-8)).toBe("-8%");
  });

  it("toont een vlakke maand als 0%", () => {
    expect(formatDeltaPct(0)).toBe("0%");
  });
});

describe("earningsDeltaTone", () => {
  it("groei is positief (success)", () => {
    expect(earningsDeltaTone(30)).toBe("success");
  });

  it("daling is een aandachtspunt (warning)", () => {
    expect(earningsDeltaTone(-15)).toBe("warning");
  });

  it("geen basis of vlak is neutraal (primary)", () => {
    expect(earningsDeltaTone(null)).toBe("primary");
    expect(earningsDeltaTone(0)).toBe("primary");
  });
});
