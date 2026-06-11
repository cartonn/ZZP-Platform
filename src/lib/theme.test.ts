import { describe, expect, it } from "vitest";
import { isTheme, nextTheme, applyTheme, THEMES } from "@/lib/theme";

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
