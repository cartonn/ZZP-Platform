import { describe, expect, it } from "vitest";

import {
  incomeGoalGlance,
  incomeGoalHeadline,
  summarizeIncomeGoal,
  type IncomeGoalInput,
} from "./income-goal";

describe("summarizeIncomeGoal", () => {
  it("returns status 'none' with null percentages when there is no goal", () => {
    const s = summarizeIncomeGoal({
      goalCents: null,
      realizedCents: 100_000,
      expectedCents: 50_000,
    });
    expect(s.status).toBe("none");
    expect(s.goalCents).toBeNull();
    expect(s.realizedPct).toBeNull();
    expect(s.projectedPct).toBeNull();
    expect(s.remainingCents).toBe(0);
    expect(s.projectedCents).toBe(150_000);
  });

  it("treats a zero or negative goal as no goal", () => {
    for (const goalCents of [0, -500]) {
      const s = summarizeIncomeGoal({
        goalCents,
        realizedCents: 10_000,
        expectedCents: 0,
      });
      expect(s.status).toBe("none");
      expect(s.goalCents).toBeNull();
      expect(s.realizedPct).toBeNull();
    }
  });

  it("marks the goal as achieved when realized meets or exceeds it (100%)", () => {
    const s = summarizeIncomeGoal({
      goalCents: 300_000,
      realizedCents: 350_000,
      expectedCents: 0,
    });
    expect(s.status).toBe("achieved");
    expect(s.realizedPct).toBe(100);
    expect(s.projectedPct).toBe(100);
    expect(s.remainingCents).toBe(0);
  });

  it("is on_track when realized is short but realized+expected reaches the goal", () => {
    const s = summarizeIncomeGoal({
      goalCents: 300_000,
      realizedCents: 200_000,
      expectedCents: 150_000,
    });
    expect(s.status).toBe("on_track");
    expect(s.realizedPct).toBe(67); // round(200000/300000*100) = 67
    expect(s.projectedPct).toBe(100); // capped at 100
    expect(s.remainingCents).toBe(100_000);
  });

  it("is behind when realized+expected falls short of the goal", () => {
    const s = summarizeIncomeGoal({
      goalCents: 300_000,
      realizedCents: 100_000,
      expectedCents: 50_000,
    });
    expect(s.status).toBe("behind");
    expect(s.realizedPct).toBe(33); // round(100000/300000*100) = 33
    expect(s.projectedPct).toBe(50); // round(150000/300000*100) = 50
    expect(s.remainingCents).toBe(200_000);
  });

  it("clamps negative or NaN realized/expected amounts to 0", () => {
    const s = summarizeIncomeGoal({
      goalCents: 100_000,
      realizedCents: -5_000,
      expectedCents: Number.NaN,
    });
    expect(s.realizedCents).toBe(0);
    expect(s.expectedCents).toBe(0);
    expect(s.projectedCents).toBe(0);
    expect(s.status).toBe("behind");
    expect(s.realizedPct).toBe(0);
    expect(s.projectedPct).toBe(0);
    expect(s.remainingCents).toBe(100_000);
  });

  it("floors fractional cent inputs to whole cents", () => {
    const s = summarizeIncomeGoal({
      goalCents: 100_000,
      realizedCents: 49_999.9,
      expectedCents: 0,
    });
    expect(s.realizedCents).toBe(49_999);
  });
});

describe("incomeGoalHeadline", () => {
  const base: IncomeGoalInput = {
    goalCents: 300_000,
    realizedCents: 0,
    expectedCents: 0,
  };

  it("returns the calm NL headline for each status", () => {
    expect(incomeGoalHeadline(summarizeIncomeGoal({ ...base, goalCents: null }))).toBe(
      "Stel een maanddoel in om je voortgang te volgen.",
    );
    expect(incomeGoalHeadline(summarizeIncomeGoal({ ...base, realizedCents: 300_000 }))).toBe(
      "Maanddoel gehaald.",
    );
    expect(
      incomeGoalHeadline(
        summarizeIncomeGoal({
          ...base,
          realizedCents: 200_000,
          expectedCents: 150_000,
        }),
      ),
    ).toBe("Op koers — met je openstaande concepten haal je je doel.");
    expect(incomeGoalHeadline(summarizeIncomeGoal(base))).toBe(
      "Nog niet op koers voor je maanddoel.",
    );
  });
});

describe("incomeGoalGlance", () => {
  const base: IncomeGoalInput = {
    goalCents: 300_000,
    realizedCents: 0,
    expectedCents: 0,
  };
  // Deterministische stub-formatter zodat de test niet op Intl-locale leunt.
  const euro = (cents: number) => `€ ${(cents / 100).toFixed(2)}`;

  it("returns null without a goal (status none)", () => {
    expect(incomeGoalGlance(summarizeIncomeGoal({ ...base, goalCents: null }), euro)).toBeNull();
  });

  it("marks an achieved goal as success with the goal amount", () => {
    const glance = incomeGoalGlance(summarizeIncomeGoal({ ...base, realizedCents: 300_000 }), euro);
    expect(glance).toEqual({
      delta: "100% doel",
      hint: "Maanddoel van € 3000.00 gehaald",
      tone: "success",
    });
  });

  it("marks an on-track goal (drafts close the gap) as success", () => {
    const glance = incomeGoalGlance(
      summarizeIncomeGoal({ ...base, realizedCents: 200_000, expectedCents: 150_000 }),
      euro,
    );
    expect(glance).toEqual({
      delta: "67% doel",
      hint: "Met je openstaande concepten haal je je doel",
      tone: "success",
    });
  });

  it("marks a behind goal as warning with the remaining amount", () => {
    const glance = incomeGoalGlance(summarizeIncomeGoal({ ...base, realizedCents: 90_000 }), euro);
    expect(glance).toEqual({
      delta: "30% doel",
      hint: "Nog € 2100.00 tot je maanddoel",
      tone: "warning",
    });
  });
});
