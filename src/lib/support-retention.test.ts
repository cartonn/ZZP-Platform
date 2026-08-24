// Unit-tests voor de pure supportTicketRetentionCutoff-afleiding: venster → afkapdatum, uit-gedrag en
// grenswaarden. Geen DB, geen fixtures.

import { describe, it, expect } from "vitest";
import { supportTicketRetentionCutoff } from "@/lib/support-retention";

const NOW = new Date("2026-08-24T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("supportTicketRetentionCutoff", () => {
  it("berekent de afkapdatum = now - retentionDays", () => {
    const cutoff = supportTicketRetentionCutoff(365, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 365 * DAY));
  });

  it("geeft null bij 0 of negatieve dagen (retentie uit)", () => {
    expect(supportTicketRetentionCutoff(0, NOW)).toBeNull();
    expect(supportTicketRetentionCutoff(-5, NOW)).toBeNull();
  });

  it("geeft null bij niet-eindige invoer", () => {
    expect(supportTicketRetentionCutoff(Number.NaN, NOW)).toBeNull();
    expect(supportTicketRetentionCutoff(Number.POSITIVE_INFINITY, NOW)).toBeNull();
  });

  it("kapt fractionele dagen af (floor) vóór de aftrek", () => {
    const cutoff = supportTicketRetentionCutoff(365.9, NOW);
    expect(cutoff).toEqual(new Date(NOW.getTime() - 365 * DAY));
  });
});
