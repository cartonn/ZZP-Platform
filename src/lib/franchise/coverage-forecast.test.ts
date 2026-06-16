import { describe, it, expect } from "vitest";
import {
  buildCoverageForecast,
  COVERAGE_HORIZON_WEEKS,
  type CoverageDienstInput,
} from "@/lib/franchise/coverage-forecast";

// Vaste referentie: woensdag 17 juni 2026 (ISO-week start maandag 15 juni). UTC, tijdzone-onafhankelijk.
const NOW = new Date("2026-06-17T10:00:00.000Z");
const THIS_WEEK_MONDAY = "2026-06-15T00:00:00.000Z";

function dienst(over: Partial<CoverageDienstInput> & { jobId: string }): CoverageDienstInput {
  return { startDate: null, filled: false, ...over };
}

describe("buildCoverageForecast", () => {
  it("geeft een lege prognose terug voor geen diensten", () => {
    const f = buildCoverageForecast([], NOW);
    expect(f.weeks).toEqual([]);
    expect(f.horizonWeeks).toBe(COVERAGE_HORIZON_WEEKS);
    expect(f.totalWithinHorizon).toBe(0);
    expect(f.openWithinHorizon).toBe(0);
    expect(f.firstGapWeekOffset).toBeNull();
    expect(f.laterTotal).toBe(0);
    expect(f.undatedOpen).toBe(0);
  });

  it("plaatst een dienst in de juiste weekbucket op weekoffset", () => {
    const f = buildCoverageForecast(
      [
        dienst({ jobId: "a", startDate: new Date("2026-06-16T09:00:00Z") }), // deze week → 0
        dienst({ jobId: "b", startDate: new Date("2026-06-23T09:00:00Z") }), // +1 week
        dienst({ jobId: "c", startDate: new Date("2026-07-01T09:00:00Z") }), // +2 weken
      ],
      NOW,
    );
    expect(f.weeks.map((w) => w.weekOffset)).toEqual([0, 1, 2]);
    expect(f.weeks[0]?.weekStart.toISOString()).toBe(THIS_WEEK_MONDAY);
    expect(f.totalWithinHorizon).toBe(3);
  });

  it("telt gevuld vs. open per week en berekent de vulgraad", () => {
    const f = buildCoverageForecast(
      [
        dienst({ jobId: "a", startDate: new Date("2026-06-16T09:00:00Z"), filled: true }),
        dienst({ jobId: "b", startDate: new Date("2026-06-16T09:00:00Z"), filled: false }),
        dienst({ jobId: "c", startDate: new Date("2026-06-16T09:00:00Z"), filled: false }),
      ],
      NOW,
    );
    expect(f.weeks).toHaveLength(1);
    expect(f.weeks[0]).toMatchObject({ total: 3, filled: 1, open: 2, fillRate: 33 });
    expect(f.openWithinHorizon).toBe(2);
  });

  it("signaleert de eerste week met een dekkingsgat", () => {
    const f = buildCoverageForecast(
      [
        dienst({ jobId: "a", startDate: new Date("2026-06-16T09:00:00Z"), filled: true }), // wk 0 vol
        dienst({ jobId: "b", startDate: new Date("2026-06-23T09:00:00Z"), filled: false }), // wk 1 gat
      ],
      NOW,
    );
    expect(f.firstGapWeekOffset).toBe(1);
  });

  it("geeft null voor firstGapWeekOffset als alles binnen de horizon gevuld is", () => {
    const f = buildCoverageForecast(
      [dienst({ jobId: "a", startDate: new Date("2026-06-16T09:00:00Z"), filled: true })],
      NOW,
    );
    expect(f.firstGapWeekOffset).toBeNull();
    expect(f.openWithinHorizon).toBe(0);
  });

  it("negeert diensten met een startdatum vóór de huidige week", () => {
    const f = buildCoverageForecast(
      [dienst({ jobId: "a", startDate: new Date("2026-06-08T09:00:00Z") })], // vorige week
      NOW,
    );
    expect(f.weeks).toEqual([]);
    expect(f.totalWithinHorizon).toBe(0);
    expect(f.laterTotal).toBe(0);
  });

  it("vat diensten ná de horizon samen in later (niet per week)", () => {
    const f = buildCoverageForecast(
      [
        dienst({ jobId: "a", startDate: new Date("2026-07-20T09:00:00Z"), filled: false }), // ver weg
        dienst({ jobId: "b", startDate: new Date("2026-07-27T09:00:00Z"), filled: true }),
      ],
      NOW,
      4,
    );
    expect(f.weeks).toEqual([]);
    expect(f.laterTotal).toBe(2);
    expect(f.laterOpen).toBe(1);
  });

  it("respecteert de grens van de horizon (laatste week erin, eerste erbuiten = later)", () => {
    // horizon 2 weken → offset 0 en 1 tellen, offset 2 valt in later.
    const f = buildCoverageForecast(
      [
        dienst({ jobId: "edge-in", startDate: new Date("2026-06-23T09:00:00Z") }), // offset 1
        dienst({ jobId: "edge-out", startDate: new Date("2026-06-29T09:00:00Z") }), // offset 2
      ],
      NOW,
      2,
    );
    expect(f.weeks.map((w) => w.weekOffset)).toEqual([1]);
    expect(f.laterTotal).toBe(1);
  });

  it("telt open diensten zonder startdatum apart als undatedOpen", () => {
    const f = buildCoverageForecast(
      [
        dienst({ jobId: "a", startDate: null, filled: false }),
        dienst({ jobId: "b", startDate: null, filled: true }), // gevuld → telt niet als gat
      ],
      NOW,
    );
    expect(f.undatedOpen).toBe(1);
    expect(f.totalWithinHorizon).toBe(0);
  });

  it("klemt de horizon op minimaal 1 week", () => {
    const f = buildCoverageForecast(
      [dienst({ jobId: "a", startDate: new Date("2026-06-23T09:00:00Z") })], // offset 1
      NOW,
      0,
    );
    expect(f.horizonWeeks).toBe(1);
    expect(f.weeks).toEqual([]);
    expect(f.laterTotal).toBe(1);
  });

  it("muteert de invoer niet", () => {
    const input = Object.freeze([
      dienst({ jobId: "a", startDate: new Date("2026-06-16T09:00:00Z") }),
    ]);
    expect(() => buildCoverageForecast(input, NOW)).not.toThrow();
  });
});
