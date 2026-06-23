import { describe, expect, it } from "vitest";
import { relativeTime } from "./relative-time";

const id = (s: string) => s; // identiteits-translator (NL-bronteksten)
const now = new Date("2026-07-01T12:00:00Z").getTime();
const ago = (ms: number) => new Date(now - ms);

const MIN = 60_000;
const HOUR = 60 * MIN;

describe("relativeTime", () => {
  it("toont 'zojuist' onder een minuut", () => {
    expect(relativeTime(ago(30_000), id, now)).toBe("zojuist");
    expect(relativeTime(ago(0), id, now)).toBe("zojuist");
  });

  it("toont 'N min geleden' onder een uur", () => {
    expect(relativeTime(ago(5 * MIN), id, now)).toBe("5 min geleden");
    expect(relativeTime(ago(59 * MIN), id, now)).toBe("59 min geleden");
  });

  it("toont 'N uur geleden' onder een dag", () => {
    expect(relativeTime(ago(3 * HOUR), id, now)).toBe("3 uur geleden");
    expect(relativeTime(ago(23 * HOUR), id, now)).toBe("23 uur geleden");
  });

  it("toont vanaf 24 uur de korte datum (geen 'X uur geleden')", () => {
    const out = relativeTime(ago(48 * HOUR), id, now);
    expect(out).not.toMatch(/geleden/);
    expect(out.length).toBeGreaterThan(0);
  });

  it("vertaalt via de translator", () => {
    const en = (s: string) => (s === "zojuist" ? "just now" : s);
    expect(relativeTime(ago(10_000), en, now)).toBe("just now");
  });
});
