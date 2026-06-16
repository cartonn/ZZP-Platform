import { describe, expect, it } from "vitest";
import { ringGeometry, barHeights, sharePct } from "./bi-geometry";

describe("ringGeometry", () => {
  it("clampt en rondt het percentage af naar 0..100", () => {
    expect(ringGeometry(-20, 10).pct).toBe(0);
    expect(ringGeometry(140, 10).pct).toBe(100);
    expect(ringGeometry(66.6, 10).pct).toBe(67);
  });

  it("verdeelt de omtrek over dash + gap naar rato van het percentage", () => {
    const r = 50;
    const g = ringGeometry(25, r);
    expect(g.circumference).toBeCloseTo(2 * Math.PI * r);
    expect(g.dash).toBeCloseTo(g.circumference * 0.25);
    expect(g.dash + g.gap).toBeCloseTo(g.circumference);
  });

  it("0% geeft geen boog, 100% vult de hele ring", () => {
    expect(ringGeometry(0, 30).dash).toBe(0);
    const full = ringGeometry(100, 30);
    expect(full.gap).toBeCloseTo(0);
    expect(full.dash).toBeCloseTo(full.circumference);
  });
});

describe("barHeights", () => {
  it("schaalt de hoogste waarde naar maxHeight en de rest naar rato", () => {
    expect(barHeights([50, 100, 25], 120)).toEqual([60, 120, 30]);
  });

  it("geeft nul-hoogtes voor een lege of volledig nul-reeks", () => {
    expect(barHeights([], 120)).toEqual([]);
    expect(barHeights([0, 0, 0], 120)).toEqual([0, 0, 0]);
  });

  it("houdt kleine niet-nul waarden zichtbaar via minHeight en negeert negatieven", () => {
    const [a, b, c] = barHeights([1, 1000, -5], 100, 3);
    expect(a).toBe(3); // 0.1px → opgetild naar minHeight
    expect(b).toBe(100);
    expect(c).toBe(0); // negatief → nul
  });
});

describe("sharePct", () => {
  it("rekent het aandeel uit en clampt naar 0..100", () => {
    expect(sharePct(1, 4)).toBe(25);
    expect(sharePct(3, 3)).toBe(100);
    expect(sharePct(5, 4)).toBe(100);
  });

  it("is veilig bij total ≤ 0", () => {
    expect(sharePct(2, 0)).toBe(0);
    expect(sharePct(2, -1)).toBe(0);
  });
});
