import { describe, expect, it } from "vitest";
import { buildPlacementsTrend, type PlacementSource } from "./placements-trend";

// Anker midden in de maand → geen maandgrens-/zomertijdrandjes (zoals de omzettrend-tests).
const now = new Date("2026-08-15T12:00:00Z");

function d(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

function rows(...isos: string[]): PlacementSource[] {
  return isos.map((iso) => ({ occurredAt: d(iso) }));
}

describe("buildPlacementsTrend", () => {
  it("geeft een leeg venster (geen data) terug zonder plaatsingen", () => {
    const trend = buildPlacementsTrend([], now, 6);
    expect(trend.hasData).toBe(false);
    expect(trend.totalCount).toBe(0);
    expect(trend.currentCount).toBe(0);
    expect(trend.deltaPct).toBeNull();
    expect(trend.series).toHaveLength(6);
    expect(trend.series.every((m) => m.count === 0)).toBe(true);
  });

  it("telt plaatsingen per kalendermaand", () => {
    const trend = buildPlacementsTrend(rows("2026-08-02", "2026-08-20", "2026-07-05"), now, 6);
    const aug = trend.series.find((m) => m.key === "2026-08");
    const jul = trend.series.find((m) => m.key === "2026-07");
    expect(aug?.count).toBe(2);
    expect(jul?.count).toBe(1);
    expect(trend.totalCount).toBe(3);
    expect(trend.currentCount).toBe(2); // laatste maand = augustus
    expect(trend.hasData).toBe(true);
  });

  it("toont exact `months` maanden, van oud naar nieuw, eindigend op de maand van now", () => {
    const trend = buildPlacementsTrend([], now, 3);
    expect(trend.series.map((m) => m.key)).toEqual(["2026-06", "2026-07", "2026-08"]);
    expect(trend.months).toBe(3);
  });

  it("laat plaatsingen buiten het venster vallen", () => {
    const trend = buildPlacementsTrend(rows("2026-01-15", "2026-08-01", "2026-08-02"), now, 3);
    expect(trend.totalCount).toBe(2);
  });

  it("berekent de maand-op-maand delta t.o.v. de vorige maand", () => {
    // juli: 2 plaatsingen, augustus: 3 → (3-2)/2 = +50%
    const trend = buildPlacementsTrend(
      rows("2026-07-05", "2026-07-10", "2026-08-01", "2026-08-05", "2026-08-20"),
      now,
      6,
    );
    expect(trend.deltaPct).toBe(50);
  });

  it("geeft null-delta zolang de lopende maand nog leeg is (geen misleidende -100%)", () => {
    const trend = buildPlacementsTrend(rows("2026-07-10"), now, 6);
    expect(trend.deltaPct).toBeNull();
  });
});
