import { describe, expect, it } from "vitest";
import { parseGraceDays } from "./config";
import { graceCutoff, isGraceEligible, type GraceCandidate } from "./performance-grace-task";

describe("parseGraceDays", () => {
  it("is uit (0) bij leeg, ontbrekend of ongeldig", () => {
    expect(parseGraceDays(undefined)).toBe(0);
    expect(parseGraceDays("")).toBe(0);
    expect(parseGraceDays("  ")).toBe(0);
    expect(parseGraceDays("nee")).toBe(0);
    expect(parseGraceDays("0")).toBe(0);
    expect(parseGraceDays("-3")).toBe(0);
  });

  it("parseert een positief geheel aantal dagen", () => {
    expect(parseGraceDays("7")).toBe(7);
    expect(parseGraceDays("5.9")).toBe(5);
  });
});

describe("graceCutoff", () => {
  it("ligt het opgegeven aantal dagen vóór nu", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    expect(graceCutoff(now, 7).toISOString()).toBe("2026-06-02T12:00:00.000Z");
  });
});

describe("isGraceEligible", () => {
  const cutoff = new Date("2026-06-02T12:00:00.000Z");
  const base: GraceCandidate = {
    status: "SUBMITTED",
    submittedAt: new Date("2026-06-01T00:00:00.000Z"),
    collabStatus: "ACTIVE",
    disputedAt: null,
  };

  it("keurt een tijdige, ingediende, schone prestatie goed", () => {
    expect(isGraceEligible(base, cutoff)).toBe(true);
  });

  it("slaat een te recent ingediende prestatie over", () => {
    expect(
      isGraceEligible({ ...base, submittedAt: new Date("2026-06-05T00:00:00.000Z") }, cutoff),
    ).toBe(false);
  });

  it("slaat niet-ingediende, betwiste of geannuleerde gevallen over", () => {
    expect(isGraceEligible({ ...base, status: "APPROVED" }, cutoff)).toBe(false);
    expect(isGraceEligible({ ...base, submittedAt: null }, cutoff)).toBe(false);
    expect(
      isGraceEligible({ ...base, disputedAt: new Date("2026-06-01T00:00:00.000Z") }, cutoff),
    ).toBe(false);
    expect(isGraceEligible({ ...base, collabStatus: "CANCELLED" }, cutoff)).toBe(false);
  });
});
