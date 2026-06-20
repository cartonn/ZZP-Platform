import { describe, expect, it } from "vitest";
import {
  APPLICATION_TRANSITIONS,
  ApplicationTransitionError,
  assertApplicationTransition,
  canApply,
  canTransitionApplication,
  canWithdrawApplication,
  planBulkApplicationTransition,
  type BulkTransitionItem,
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

describe("planBulkApplicationTransition", () => {
  it("alle items eligible als overgang toegestaan is", () => {
    const items: BulkTransitionItem[] = [
      { id: "a", from: "NEW" },
      { id: "b", from: "VIEWED" },
      { id: "c", from: "SHORTLIST" },
    ];
    const plan = planBulkApplicationTransition(items, "REJECTED");
    expect(plan.eligible).toEqual(["a", "b", "c"]);
    expect(plan.skipped).toEqual([]);
  });

  it("gemengd: eligible en skipped bij verschillende statussen", () => {
    const items: BulkTransitionItem[] = [
      { id: "a", from: "NEW" },
      { id: "b", from: "ACCEPTED" }, // ACCEPTED -> SHORTLIST only
      { id: "c", from: "VIEWED" },
    ];
    const plan = planBulkApplicationTransition(items, "SHORTLIST");
    expect(plan.eligible).toContain("a");
    expect(plan.eligible).toContain("c");
    expect(plan.eligible).toContain("b"); // ACCEPTED -> SHORTLIST is allowed
    expect(plan.skipped).toEqual([]);
  });

  it("lege input geeft beide arrays leeg", () => {
    const plan = planBulkApplicationTransition([], "VIEWED");
    expect(plan.eligible).toEqual([]);
    expect(plan.skipped).toEqual([]);
  });

  it("no-op (from===to) wordt geskipt", () => {
    // SHORTLIST -> SHORTLIST: not in the transitions map, must be skipped
    const items: BulkTransitionItem[] = [{ id: "x", from: "SHORTLIST" }];
    const plan = planBulkApplicationTransition(items, "SHORTLIST");
    expect(plan.eligible).toEqual([]);
    expect(plan.skipped).toEqual(["x"]);
  });

  it("REJECTED als target: NEW/VIEWED/SHORTLIST eligible, ACCEPTED geskipt", () => {
    const items: BulkTransitionItem[] = [
      { id: "n", from: "NEW" },
      { id: "v", from: "VIEWED" },
      { id: "s", from: "SHORTLIST" },
      { id: "a", from: "ACCEPTED" }, // ACCEPTED only allows -> SHORTLIST
    ];
    const plan = planBulkApplicationTransition(items, "REJECTED");
    expect(plan.eligible).toEqual(["n", "v", "s"]);
    expect(plan.skipped).toEqual(["a"]);
  });
});

describe("canWithdrawApplication", () => {
  it("staat intrekken toe vóór een beslissing van de opdrachtgever", () => {
    expect(canWithdrawApplication("NEW")).toBe(true);
    expect(canWithdrawApplication("VIEWED")).toBe(true);
    expect(canWithdrawApplication("SHORTLIST")).toBe(true);
  });

  it("weigert intrekken na een beslissing of een eerdere intrekking", () => {
    expect(canWithdrawApplication("ACCEPTED")).toBe(false);
    expect(canWithdrawApplication("REJECTED")).toBe(false);
    expect(canWithdrawApplication("WITHDRAWN")).toBe(false);
  });
});

describe("WITHDRAWN-status", () => {
  it("is terminaal voor de opdrachtgever (geen uitgaande overgangen)", () => {
    expect(APPLICATION_TRANSITIONS.WITHDRAWN).toEqual([]);
  });

  it("is nooit een doel van een opdrachtgever-overgang", () => {
    for (const targets of Object.values(APPLICATION_TRANSITIONS)) {
      expect(targets).not.toContain("WITHDRAWN");
    }
  });
});
