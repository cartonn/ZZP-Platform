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
    expect(isPalette("bloei")).toBe(true);
    expect(isPalette("elektrisch-blauw")).toBe(true);
    expect(isPalette("paars")).toBe(false);
    expect(isPalette(null)).toBe(false);
  });

  it("er zijn precies drie kleurschema's", () => {
    expect(PALETTES).toEqual(["standaard", "bloei", "elektrisch-blauw"]);
  });

  it("nextPalette doorloopt cyclisch", () => {
    expect(nextPalette("standaard")).toBe("bloei");
    expect(nextPalette("bloei")).toBe("elektrisch-blauw");
    expect(nextPalette("elektrisch-blauw")).toBe("standaard");
  });

  it("applyPalette zet data-theme; standaard verwijdert het attribuut", () => {
    const calls: Array<[string, string?]> = [];
    const root = {
      setAttribute: (n: string, v: string) => calls.push([n, v]),
      removeAttribute: (n: string) => calls.push([n]),
    };
    applyPalette("bloei", root);
    applyPalette("elektrisch-blauw", root);
    applyPalette("standaard", root);
    expect(calls).toEqual([
      ["data-theme", "bloei"],
      ["data-theme", "elektrisch-blauw"],
      ["data-theme"],
    ]);
  });
});
