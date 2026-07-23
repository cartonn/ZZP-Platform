import { describe, it, expect } from "vitest";
import {
  summarizeTimeToFill,
  TIME_TO_FILL_MIN_SAMPLE,
  type FilledJobTiming,
} from "@/lib/time-to-fill";

const DAY = 24 * 60 * 60 * 1000;

/** Bouwt een rij die precies `days` dagen na een vast anker geplaatst is. */
function row(days: number, anchorMs = Date.UTC(2026, 0, 1)): FilledJobTiming {
  return { openedAt: new Date(anchorMs), placedAt: new Date(anchorMs + days * DAY) };
}

describe("summarizeTimeToFill", () => {
  it("geeft null onder de minimale steekproef", () => {
    expect(summarizeTimeToFill([])).toBeNull();
    expect(summarizeTimeToFill([row(3)])).toBeNull();
    expect(TIME_TO_FILL_MIN_SAMPLE).toBe(2);
  });

  it("berekent de mediaan bij oneven lengte", () => {
    const s = summarizeTimeToFill([row(10), row(2), row(6)]);
    expect(s).not.toBeNull();
    expect(s!.medianDays).toBe(6);
    expect(s!.sampleSize).toBe(3);
    expect(s!.fastestDays).toBe(2);
  });

  it("middelt (afgerond) de twee middelste waarden bij even lengte", () => {
    // gesorteerd: [2, 5, 6, 9] → (5+6)/2 = 5.5 → 6
    const s = summarizeTimeToFill([row(9), row(2), row(6), row(5)]);
    expect(s!.medianDays).toBe(6);
    expect(s!.sampleSize).toBe(4);
    expect(s!.fastestDays).toBe(2);
  });

  it("negeert negatieve doorlooptijden (plaatsing vóór publicatie)", () => {
    const anchor = Date.UTC(2026, 0, 1);
    const negatief: FilledJobTiming = {
      openedAt: new Date(anchor),
      placedAt: new Date(anchor - 5 * DAY),
    };
    const s = summarizeTimeToFill([negatief, row(4), row(8)]);
    expect(s!.sampleSize).toBe(2);
    expect(s!.medianDays).toBe(6); // (4+8)/2 = 6
    expect(s!.fastestDays).toBe(4);
  });

  it("valt terug op null als na filtering te weinig overblijft", () => {
    const anchor = Date.UTC(2026, 0, 1);
    const negatief: FilledJobTiming = {
      openedAt: new Date(anchor),
      placedAt: new Date(anchor - DAY),
    };
    expect(summarizeTimeToFill([negatief, row(4)])).toBeNull();
  });

  it("kapt sub-dag-doorlooptijden af naar hele dagen (floor)", () => {
    const anchor = Date.UTC(2026, 0, 1);
    const halveDag: FilledJobTiming = {
      openedAt: new Date(anchor),
      placedAt: new Date(anchor + DAY / 2),
    };
    const s = summarizeTimeToFill([halveDag, halveDag]);
    expect(s!.medianDays).toBe(0);
    expect(s!.fastestDays).toBe(0);
  });

  it("respecteert een custom minSample", () => {
    expect(summarizeTimeToFill([row(3), row(5)], 3)).toBeNull();
    expect(summarizeTimeToFill([row(3), row(5), row(7)], 3)).not.toBeNull();
  });
});
