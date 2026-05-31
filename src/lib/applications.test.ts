import { describe, expect, it } from "vitest";
import {
  ApplicationTransitionError,
  assertApplicationTransition,
  canApply,
  canTransitionApplication,
} from "@/lib/applications";

describe("reactie-statusovergangen", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransitionApplication("NEW", "SHORTLIST")).toBe(true);
    expect(canTransitionApplication("VIEWED", "ACCEPTED")).toBe(true);
    expect(canTransitionApplication("SHORTLIST", "REJECTED")).toBe(true);
    expect(canTransitionApplication("REJECTED", "SHORTLIST")).toBe(true);
    expect(canTransitionApplication("ACCEPTED", "SHORTLIST")).toBe(true);
  });

  it("weigert ongeldige overgangen", () => {
    expect(canTransitionApplication("REJECTED", "ACCEPTED")).toBe(false);
    expect(canTransitionApplication("NEW", "NEW")).toBe(false);
    expect(() => assertApplicationTransition("REJECTED", "ACCEPTED")).toThrow(
      ApplicationTransitionError,
    );
  });
});

describe("canApply (plan-gating)", () => {
  it("onbeperkt bij maxApplications -1", () => {
    expect(canApply(-1, 999)).toBe(true);
  });

  it("staat toe onder de limiet, weigert op/over de limiet", () => {
    expect(canApply(5, 4)).toBe(true);
    expect(canApply(5, 5)).toBe(false);
    expect(canApply(5, 6)).toBe(false);
  });

  it("limiet 0 weigert alles", () => {
    expect(canApply(0, 0)).toBe(false);
  });
});
