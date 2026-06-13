import { describe, expect, it } from "vitest";
import { buildRevenueTrend } from "./revenue-trend";

const now = new Date("2026-06-09T10:00:00Z");

describe("buildRevenueTrend", () => {
  it("groepeert bedragen oud naar nieuw met juiste currentCents en totalCents", () => {
    const trend = buildRevenueTrend(
      [
        { occurredAt: new Date("2026-06-01T08:00:00Z"), totalCents: 100_00 },
        { occurredAt: new Date("2026-06-20T08:00:00Z"), totalCents: 50_00 },
        { occurredAt: new Date("2026-05-15T08:00:00Z"), totalCents: 200_00 },
      ],
      now,
      3,
    );
    expect(trend.series.map((m) => m.key)).toEqual(["2026-04", "2026-05", "2026-06"]);
    expect(trend.series.map((m) => m.cents)).toEqual([0, 200_00, 150_00]);
    expect(trend.currentCents).toBe(150_00);
    expect(trend.totalCents).toBe(350_00);
  });

  it("hasData is true als minstens één maand omzet heeft", () => {
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 1_00 }],
      now,
      6,
    );
    expect(trend.hasData).toBe(true);
  });

  it("hasData is false bij lege rows", () => {
    const trend = buildRevenueTrend([], now, 6);
    expect(trend.hasData).toBe(false);
    expect(trend.currentCents).toBe(0);
    expect(trend.totalCents).toBe(0);
    expect(trend.deltaPct).toBeNull();
  });

  it("deltaPct berekent de procentuele verandering t.o.v. de vorige maand", () => {
    const trend = buildRevenueTrend(
      [
        { occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 100_00 },
        { occurredAt: new Date("2026-06-05T08:00:00Z"), totalCents: 112_00 },
      ],
      now,
      6,
    );
    expect(trend.deltaPct).toBe(12);
  });

  it("deltaPct is null als de vorige maand nul cent heeft (geen vergelijkbare basis)", () => {
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2026-06-01T08:00:00Z"), totalCents: 50_00 }],
      now,
      6,
    );
    // Alle maanden vóór juni zijn 0, dus deltaPct is null.
    expect(trend.deltaPct).toBeNull();
  });

  it("deltaPct is null bij volledig lege reeks", () => {
    const trend = buildRevenueTrend([], now, 2);
    expect(trend.deltaPct).toBeNull();
  });

  it("overbrugt een jaargrens correct", () => {
    const nowFeb = new Date("2026-02-10T10:00:00Z");
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2025-12-31T20:00:00Z"), totalCents: 75_00 }],
      nowFeb,
      4,
    );
    expect(trend.series.map((m) => m.key)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    // 31 dec 20:00Z = 31 dec 21:00 Amsterdam — telt in december.
    expect(trend.series[1]?.cents).toBe(75_00);
    expect(trend.totalCents).toBe(75_00);
    expect(trend.currentCents).toBe(0);
    expect(trend.hasData).toBe(true);
  });

  it("series heeft de gevraagde lengte in months", () => {
    const trend = buildRevenueTrend([], now, 12);
    expect(trend.series).toHaveLength(12);
  });
});
