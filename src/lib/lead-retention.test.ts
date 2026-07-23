// Unit-tests voor de pure lead-retentie-afleiding: afkapdatum + welke lead-status snoeibaar is.

import { describe, it, expect } from "vitest";
import { leadRetentionCutoff, isLeadRetentionEligible } from "@/lib/lead-retention";

const NOW = new Date("2026-07-23T12:00:00.000Z");

describe("leadRetentionCutoff", () => {
  it("geeft null als retentie uit staat (0 of negatief)", () => {
    expect(leadRetentionCutoff(0, NOW)).toBeNull();
    expect(leadRetentionCutoff(-1, NOW)).toBeNull();
    expect(leadRetentionCutoff(Number.NaN, NOW)).toBeNull();
  });

  it("berekent de afkapdatum retentieDays vóór nu", () => {
    const cutoff = leadRetentionCutoff(365, NOW);
    expect(cutoff).not.toBeNull();
    const expected = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(cutoff!.getTime()).toBe(expected.getTime());
  });

  it("kapt fractionele dagen naar beneden af (deterministisch)", () => {
    const cutoff = leadRetentionCutoff(30.9, NOW);
    const expected = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(cutoff!.getTime()).toBe(expected.getTime());
  });
});

describe("isLeadRetentionEligible", () => {
  it("alleen beslíste leads (KLANT/NO_DEAL) zijn snoeibaar", () => {
    expect(isLeadRetentionEligible("KLANT")).toBe(true);
    expect(isLeadRetentionEligible("NO_DEAL")).toBe(true);
  });

  it("actieve prospects (KOUD/WARM) worden nooit gesnoeid", () => {
    expect(isLeadRetentionEligible("KOUD")).toBe(false);
    expect(isLeadRetentionEligible("WARM")).toBe(false);
  });
});
