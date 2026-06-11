import { describe, expect, it } from "vitest";
import { meterSegments } from "./meter";

describe("meterSegments", () => {
  it("vult 9 van 10 segmenten bij 92%", () => {
    const segments = meterSegments(92);
    expect(segments).toHaveLength(10);
    expect(segments.filter(Boolean)).toHaveLength(9);
    expect(segments[8]).toBe(true);
    expect(segments[9]).toBe(false);
  });

  it("vult alles bij 100% en niets bij 0%", () => {
    expect(meterSegments(100).every(Boolean)).toBe(true);
    expect(meterSegments(0).some(Boolean)).toBe(false);
  });

  it("toont minstens één segment bij een lage maar positieve score", () => {
    expect(meterSegments(3).filter(Boolean)).toHaveLength(1);
  });

  it("klemt scores buiten 0–100 vast", () => {
    expect(meterSegments(140).every(Boolean)).toBe(true);
    expect(meterSegments(-5).some(Boolean)).toBe(false);
  });

  it("respecteert een afwijkend segmentaantal", () => {
    const segments = meterSegments(50, 4);
    expect(segments).toHaveLength(4);
    expect(segments.filter(Boolean)).toHaveLength(2);
  });
});
