// Unit-tests voor de pure messageRetentionCutoff-afleiding: venster → afkapdatum, uit-gedrag en
// grenswaarden. Geen DB, geen fixtures.

import { describe, it, expect } from "vitest";
import { messageRetentionCutoff } from "@/lib/message-retention";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("messageRetentionCutoff", () => {
  it("berekent de afkapdatum = now - retentionDays", () => {
    const cutoff = messageRetentionCutoff(365, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 365 * DAY));
  });

  it("geeft null bij 0 of negatieve dagen (retentie uit)", () => {
    expect(messageRetentionCutoff(0, NOW)).toBeNull();
    expect(messageRetentionCutoff(-5, NOW)).toBeNull();
  });

  it("geeft null bij niet-eindige invoer", () => {
    expect(messageRetentionCutoff(Number.NaN, NOW)).toBeNull();
    expect(messageRetentionCutoff(Number.POSITIVE_INFINITY, NOW)).toBeNull();
  });

  it("kapt fractionele dagen af (floor) vóór de aftrek", () => {
    const cutoff = messageRetentionCutoff(365.9, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 365 * DAY));
  });
});
