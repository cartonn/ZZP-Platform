import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  // De weekgrens moet rond een zomer-/wintertijdovergang kloppen; een expliciete zone houdt de
  // regressie actief ook als CI in UTC draait. Dates binnen de test construeren, ná het zetten van TZ.
  describe("DST-weekgrens (Europe/Amsterdam)", () => {
    beforeEach(() => vi.stubEnv("TZ", "Europe/Amsterdam"));
    afterEach(() => vi.unstubAllEnvs());

    it("voorjaar (167u-week): dienst begin volgende week (maandagnacht) is niet acuut", () => {
      // Overgang zo 29-03-2026 02:00→03:00; week ma 23-03 .. zo 29-03 duurt 167 uur.
      const now = new Date(2026, 2, 25, 12, 0, 0); // wo 25 maart
      const nextMonday = new Date(2026, 2, 30, 0, 30, 0); // ma 30 maart 00:30 = volgende week
      expect(isStartAcute(nextMonday, now)).toBe(false);
    });

    it("voorjaar: dienst zondagnacht deze week blijft acuut", () => {
      const now = new Date(2026, 2, 25, 12, 0, 0);
      const sundayNight = new Date(2026, 2, 29, 23, 30, 0); // zo 29 maart 23:30 = nog deze week
      expect(isStartAcute(sundayNight, now)).toBe(true);
    });

    it("najaar (169u-week): dienst begin volgende week is niet acuut", () => {
      // Overgang zo 25-10-2026 03:00→02:00; week ma 19-10 .. zo 25-10 duurt 169 uur.
      const now = new Date(2026, 9, 21, 12, 0, 0); // wo 21 oktober
      const nextMonday = new Date(2026, 9, 26, 0, 30, 0); // ma 26 oktober 00:30 = volgende week
      expect(isStartAcute(nextMonday, now)).toBe(false);
    });
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
