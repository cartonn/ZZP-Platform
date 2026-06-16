import { describe, expect, it } from "vitest";
import { donutSegments } from "./donut-geometry";

describe("donutSegments", () => {
  const CIRC = 100;

  it("verdeelt de omtrek naar rato en laat de boglengtes optellen tot de omtrek", () => {
    const { total, segments } = donutSegments([1, 1, 2], CIRC);
    expect(total).toBe(4);
    expect(segments.map((s) => s.dash)).toEqual([25, 25, 50]);
    expect(segments.reduce((sum, s) => sum + s.dash, 0)).toBeCloseTo(CIRC);
    expect(segments.map((s) => s.pct)).toEqual([25, 25, 50]);
  });

  it("plaatst segmenten cumulatief vanaf 12-uur (−90°)", () => {
    const { segments } = donutSegments([1, 1, 2], CIRC);
    expect(segments[0]!.rotation).toBe(-90);
    expect(segments[1]!.rotation).toBe(-90 + 90); // na 25%
    expect(segments[2]!.rotation).toBe(-90 + 180); // na 50%
  });

  it("geeft bij total = 0 overal een nul-boog en behoudt de lengte", () => {
    const { total, segments } = donutSegments([0, 0], CIRC);
    expect(total).toBe(0);
    expect(segments.every((s) => s.dash === 0 && s.gap === CIRC)).toBe(true);
  });

  it("behandelt negatieve waarden als nul", () => {
    const { total, segments } = donutSegments([-5, 10], CIRC);
    expect(total).toBe(10);
    expect(segments[0]!.value).toBe(0);
    expect(segments[1]!.dash).toBeCloseTo(CIRC);
  });
});
