// Unit-tests voor de pure applicationRetentionCutoff-afleiding: venster → afkapdatum, uit-gedrag en
// grenswaarden. Geen DB, geen fixtures.

import { describe, it, expect } from "vitest";
import { applicationRetentionCutoff } from "@/lib/application-retention";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("applicationRetentionCutoff", () => {
  it("berekent de afkapdatum = now - retentionDays", () => {
    const cutoff = applicationRetentionCutoff(28, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 28 * DAY));
  });

  it("geeft null bij 0 of negatieve dagen (retentie uit)", () => {
    expect(applicationRetentionCutoff(0, NOW)).toBeNull();
    expect(applicationRetentionCutoff(-5, NOW)).toBeNull();
  });

  it("geeft null bij niet-eindige invoer", () => {
    expect(applicationRetentionCutoff(Number.NaN, NOW)).toBeNull();
    expect(applicationRetentionCutoff(Number.POSITIVE_INFINITY, NOW)).toBeNull();
  });

  it("kapt fractionele dagen af (floor) vóór de aftrek", () => {
    const cutoff = applicationRetentionCutoff(28.9, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 28 * DAY));
  });
});
