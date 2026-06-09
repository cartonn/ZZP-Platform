import { describe, expect, it } from "vitest";
import { sparklinePoints } from "./sparkline";

describe("sparklinePoints", () => {
  it("geeft een lege string zonder waarden", () => {
    expect(sparklinePoints([])).toBe("");
  });

  it("zet een stijgende reeks om in dalende y-coördinaten (SVG-as)", () => {
    const points = sparklinePoints([0, 50, 100], 100, 30, 0).split(" ");
    const [y0 = NaN, y1 = NaN, y2 = NaN] = points.map((p) => Number(p.split(",")[1]));
    expect(y0).toBeGreaterThan(y1);
    expect(y1).toBeGreaterThan(y2);
    // Hoogste waarde raakt de bovenrand, laagste de onderrand.
    expect(y2).toBe(0);
    expect(y0).toBe(30);
  });

  it("spreidt de x-coördinaten gelijkmatig tot de rechterrand", () => {
    const points = sparklinePoints([1, 2, 3, 4, 5], 100, 30, 0).split(" ");
    const xs = points.map((p) => Number(p.split(",")[0]));
    expect(xs.at(0)).toBe(0);
    expect(xs.at(4)).toBe(100);
    expect(xs.at(2)).toBe(50);
  });

  it("tekent een middenlijn bij een vlakke reeks", () => {
    const points = sparklinePoints([7, 7, 7], 100, 30).split(" ");
    const ys = points.map((p) => Number(p.split(",")[1]));
    expect(new Set(ys).size).toBe(1);
    expect(ys[0]).toBe(15);
  });

  it("respecteert de marge", () => {
    const points = sparklinePoints([0, 10], 100, 30, 5).split(" ");
    expect(points[0]).toBe("5,25");
    expect(points[1]).toBe("95,5");
  });
});
