import { describe, it, expect } from "vitest";
import {
  summarizeVerificationTurnaround,
  VERIFICATION_TURNAROUND_MIN_SAMPLE,
} from "./verification-turnaround";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Bouw een sample met een gegeven doorlooptijd in ms (submitted op een vaste basis). */
function sample(durationMs: number): { submittedAt: Date; verifiedAt: Date } {
  const submittedAt = new Date("2026-01-01T09:00:00Z");
  return { submittedAt, verifiedAt: new Date(submittedAt.getTime() + durationMs) };
}

describe("summarizeVerificationTurnaround", () => {
  it("returns null under the sample threshold", () => {
    const few = Array.from({ length: VERIFICATION_TURNAROUND_MIN_SAMPLE - 1 }, () =>
      sample(DAY_MS),
    );
    expect(summarizeVerificationTurnaround(few)).toBeNull();
  });

  it("computes median and p90 in whole days, rounded up (min 1)", () => {
    // 10 samples: één per hele dag van 1..10 dagen doorlooptijd.
    const samples = Array.from({ length: 10 }, (_, i) => sample((i + 1) * DAY_MS));
    const result = summarizeVerificationTurnaround(samples);
    expect(result).not.toBeNull();
    expect(result!.sampleCount).toBe(10);
    // mediaan van 1..10 dagen = 5.5 dag → ceil = 6; p90 ≈ 9.1 dag → ceil = 10.
    expect(result!.typicalDays).toBe(6);
    expect(result!.p90Days).toBe(10);
  });

  it("rounds a sub-day turnaround up to ~1 day (reassuring upper bound)", () => {
    const samples = Array.from({ length: 8 }, () => sample(3 * 60 * 60 * 1000)); // 3 uur
    const result = summarizeVerificationTurnaround(samples);
    expect(result!.typicalDays).toBe(1);
    expect(result!.p90Days).toBe(1);
  });

  it("is independent of input order", () => {
    const durations = [1, 9, 3, 7, 5, 2, 8, 4, 6, 10].map((d) => d * DAY_MS);
    const forward = summarizeVerificationTurnaround(durations.map(sample));
    const reversed = summarizeVerificationTurnaround([...durations].reverse().map(sample));
    expect(forward).toEqual(reversed);
  });

  it("ignores legacy records without timestamps and negative (clock-anomaly) durations", () => {
    const valid = Array.from({ length: 8 }, () => sample(2 * DAY_MS));
    const noisy = [
      ...valid,
      { submittedAt: null, verifiedAt: new Date() },
      { submittedAt: new Date(), verifiedAt: null },
      // verifiedAt vóór submittedAt → genegeerd
      {
        submittedAt: new Date("2026-02-02T00:00:00Z"),
        verifiedAt: new Date("2026-02-01T00:00:00Z"),
      },
    ];
    const result = summarizeVerificationTurnaround(noisy);
    expect(result!.sampleCount).toBe(8); // alleen de geldige samples tellen
    expect(result!.typicalDays).toBe(2);
  });

  it("keeps p90 at least the median even when they collapse to one value", () => {
    const samples = Array.from({ length: 12 }, () => sample(2 * DAY_MS));
    const result = summarizeVerificationTurnaround(samples);
    expect(result!.typicalDays).toBe(2);
    expect(result!.p90Days).toBeGreaterThanOrEqual(result!.typicalDays);
  });

  it("honours a custom minimum sample", () => {
    const three = Array.from({ length: 3 }, () => sample(DAY_MS));
    expect(summarizeVerificationTurnaround(three, 5)).toBeNull();
    expect(summarizeVerificationTurnaround(three, 3)).not.toBeNull();
  });
});
