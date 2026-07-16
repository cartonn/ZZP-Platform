import { describe, it, expect } from "vitest";
import {
  isStartAcute,
  summarizeAcuteOpenDiensten,
  type OpenDienstFillRow,
} from "@/lib/franchise/acute-open-diensten";

// Anker: woensdag 15 juli 2026 (12:00 UTC). De ISO-week begint maandag 13 juli; volgende week begint
// maandag 20 juli. Alles vóór 20 juli telt als acuut (deze week/verleden/geen datum).
const NOW = new Date("2026-07-15T12:00:00.000Z");

function row(over: Partial<OpenDienstFillRow>): OpenDienstFillRow {
  return { published: true, filled: false, startDate: null, readyMatches: 0, ...over };
}

describe("isStartAcute", () => {
  it("geen startdatum → acuut", () => {
    expect(isStartAcute(null, NOW)).toBe(true);
  });

  it("start deze week (vrijdag) → acuut", () => {
    expect(isStartAcute(new Date("2026-07-17T09:00:00.000Z"), NOW)).toBe(true);
  });

  it("start in het verleden → acuut", () => {
    expect(isStartAcute(new Date("2026-07-01T09:00:00.000Z"), NOW)).toBe(true);
  });

  it("start begin volgende week (maandag) → niet acuut", () => {
    expect(isStartAcute(new Date("2026-07-20T00:00:00.000Z"), NOW)).toBe(false);
  });

  it("start volgende maand → niet acuut", () => {
    expect(isStartAcute(new Date("2026-08-10T09:00:00.000Z"), NOW)).toBe(false);
  });
});

describe("summarizeAcuteOpenDiensten", () => {
  it("null wanneer er geen acute open dienst is", () => {
    expect(summarizeAcuteOpenDiensten([], NOW)).toBeNull();
    expect(
      summarizeAcuteOpenDiensten([row({ startDate: new Date("2026-09-01T00:00:00.000Z") })], NOW),
    ).toBeNull();
  });

  it("telt alleen gepubliceerde, ongevulde, acute diensten", () => {
    const summary = summarizeAcuteOpenDiensten(
      [
        row({ startDate: null, readyMatches: 2 }), // acuut, vulbaar
        row({ startDate: new Date("2026-07-16T09:00:00.000Z"), readyMatches: 0 }), // acuut, werving
        row({ filled: true, startDate: null, readyMatches: 5 }), // gevuld → uit
        row({ published: false, startDate: null }), // concept → uit
        row({ startDate: new Date("2026-08-30T00:00:00.000Z") }), // ver weg → uit
      ],
      NOW,
    );
    expect(summary).toEqual({ total: 2, fillableNow: 1, needsRecruiting: 1 });
  });

  it("alle acute diensten vulbaar uit het roster", () => {
    const summary = summarizeAcuteOpenDiensten(
      [row({ readyMatches: 1 }), row({ readyMatches: 3 })],
      NOW,
    );
    expect(summary).toEqual({ total: 2, fillableNow: 2, needsRecruiting: 0 });
  });
});
