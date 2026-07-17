import { describe, it, expect } from "vitest";
import {
  boundText,
  boundReason,
  MAX_REASON_LEN,
  MAX_TITLE_LEN,
  MAX_DESCRIPTION_LEN,
} from "./text-bounds";

describe("boundText", () => {
  it("trimt omringende witruimte", () => {
    expect(boundText("  hallo  ", 100)).toBe("hallo");
  });

  it("laat tekst binnen de grens ongewijzigd (na trim)", () => {
    expect(boundText("kort", 100)).toBe("kort");
  });

  it("kapt tekst boven de grens", () => {
    expect(boundText("abcdefghij", 4)).toBe("abcd");
  });

  it("trimt nogmaals na het kappen zodat er geen witruimte aan het eind blijft", () => {
    // Grens valt precies op een spatie → de afgekapte string mag niet met witruimte eindigen.
    expect(boundText("abc def ghi", 4)).toBe("abc");
  });

  it("geeft een lege string voor niet-strings", () => {
    expect(boundText(null, 100)).toBe("");
    expect(boundText(undefined, 100)).toBe("");
    expect(boundText(42, 100)).toBe("");
    expect(boundText({}, 100)).toBe("");
  });

  it("houdt een lege/whitespace-only invoer leeg (behoudt de 'verplicht'-check)", () => {
    expect(boundText("", 100)).toBe("");
    expect(boundText("   ", 100)).toBe("");
  });

  it("respecteert de grens exact op de lengte", () => {
    expect(boundText("abcd", 4)).toBe("abcd");
  });
});

describe("boundReason", () => {
  it("kapt op MAX_REASON_LEN", () => {
    const long = "x".repeat(MAX_REASON_LEN + 500);
    expect(boundReason(long)).toHaveLength(MAX_REASON_LEN);
  });

  it("trimt en behoudt korte redenen", () => {
    expect(boundReason("  te laat geleverd ")).toBe("te laat geleverd");
  });

  it("geeft leeg terug voor niet-strings (blijft door de verplicht-check tegengehouden)", () => {
    expect(boundReason(null)).toBe("");
  });
});

describe("grenswaarden", () => {
  it("zijn positieve, oplopende constanten", () => {
    expect(MAX_TITLE_LEN).toBeGreaterThan(0);
    expect(MAX_DESCRIPTION_LEN).toBeGreaterThan(MAX_TITLE_LEN);
    expect(MAX_REASON_LEN).toBeGreaterThan(MAX_DESCRIPTION_LEN);
  });
});
