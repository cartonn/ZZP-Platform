import { describe, expect, it } from "vitest";
import {
  isTheme,
  nextTheme,
  applyTheme,
  THEMES,
  PALETTES,
  isPalette,
  nextPalette,
  applyPalette,
} from "@/lib/theme";

describe("theme", () => {
  it("isTheme herkent geldige waarden", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it("nextTheme wisselt", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it("applyTheme zet/haalt de dark-class", () => {
    const calls: Array<[string, boolean]> = [];
    const root = {
      classList: {
        toggle: (t: string, f: boolean) => {
          calls.push([t, f]);
        },
      },
    };
    applyTheme("dark", root);
    applyTheme("light", root);
    expect(calls).toEqual([
      ["dark", true],
      ["dark", false],
    ]);
  });

  it("er zijn precies twee thema's (keuze, geen geforceerde dark-first)", () => {
    expect(THEMES).toEqual(["light", "dark"]);
  });
});

describe("palette", () => {
  it("isPalette herkent de drie geldige schema's", () => {
    expect(isPalette("standaard")).toBe(true);
    expect(isPalette("warm-clay")).toBe(true);
    expect(isPalette("indigo")).toBe(true);
    expect(isPalette("paars")).toBe(false);
    expect(isPalette(null)).toBe(false);
  });

  it("er zijn precies drie kleurschema's", () => {
    expect(PALETTES).toEqual(["standaard", "warm-clay", "indigo"]);
  });

  it("nextPalette doorloopt cyclisch", () => {
    expect(nextPalette("standaard")).toBe("warm-clay");
    expect(nextPalette("warm-clay")).toBe("indigo");
    expect(nextPalette("indigo")).toBe("standaard");
  });

  it("applyPalette zet data-theme; standaard verwijdert het attribuut", () => {
    const calls: Array<[string, string?]> = [];
    const root = {
      setAttribute: (n: string, v: string) => calls.push([n, v]),
      removeAttribute: (n: string) => calls.push([n]),
    };
    applyPalette("warm-clay", root);
    applyPalette("indigo", root);
    applyPalette("standaard", root);
    expect(calls).toEqual([["data-theme", "warm-clay"], ["data-theme", "indigo"], ["data-theme"]]);
  });
});
