import { describe, expect, it } from "vitest";

import {
  incomeGoalGlance,
  incomeGoalHeadline,
  incomeGoalPace,
  incomeGoalPaceHint,
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

describe("incomeGoalPace", () => {
  const euro = (cents: number) => `€ ${(cents / 100).toFixed(2)}`;
  // €6000 doel; verwacht deel bij een gelijkmatig tempo hangt van de dag van de maand af.
  const goal = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 0, expectedCents: 0 });

  it("returns null when there is no goal", () => {
    const s = summarizeIncomeGoal({ goalCents: null, realizedCents: 100_000, expectedCents: 0 });
    expect(incomeGoalPace(s, new Date(Date.UTC(2026, 0, 15)))).toBeNull();
  });

  it("returns null when the goal is already achieved", () => {
    const s = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 600_000, expectedCents: 0 });
    expect(s.status).toBe("achieved");
    expect(incomeGoalPace(s, new Date(Date.UTC(2026, 0, 15)))).toBeNull();
  });

  it("flags 'behind' when realized trails the even pace, with a needed weekly pace", () => {
    const s = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 100_000, expectedCents: 0 });
    const pace = incomeGoalPace(s, new Date(Date.UTC(2026, 0, 15)));
    expect(pace).not.toBeNull();
    expect(pace).toMatchObject({
      dayOfMonth: 15,
      daysInMonth: 31,
      daysRemaining: 16,
      expectedByNowCents: 290_323,
      deltaCents: -190_323,
      remainingToGoalCents: 500_000,
      neededPerWeekCents: 218_750,
      state: "behind",
      tone: "warning",
    });
    expect(incomeGoalPaceHint(pace!, euro)).toBe(
      "Je loopt € 1903.23 achter op het gelijkmatige tempo — houd ≈ € 2187.50/week aan in de resterende 16 dagen om je doel te halen.",
    );
  });

  it("flags 'ahead' when realized leads the even pace", () => {
    const s = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 300_000, expectedCents: 0 });
    const pace = incomeGoalPace(s, new Date(Date.UTC(2026, 0, 10)));
    expect(pace?.state).toBe("ahead");
    expect(pace?.tone).toBe("success");
    expect(pace?.expectedByNowCents).toBe(193_548);
    expect(incomeGoalPaceHint(pace!, euro)).toBe(
      "Je loopt voor op schema — na dag 10/31 zou een gelijkmatig tempo € 1935.48 zijn.",
    );
  });

  it("flags 'on_track' within the tolerance band around the even pace", () => {
    const s = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 290_000, expectedCents: 0 });
    const pace = incomeGoalPace(s, new Date(Date.UTC(2026, 0, 15)));
    expect(pace?.state).toBe("on_track");
    expect(pace?.tone).toBe("primary");
    expect(incomeGoalPaceHint(pace!, euro)).toBe(
      "Op koers voor de tijd van de maand — na dag 15/31 lig je rond het gelijkmatige tempo (€ 2903.23).",
    );
  });

  it("uses a month-is-nearly-over phrasing on the last day", () => {
    const s = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 400_000, expectedCents: 0 });
    const pace = incomeGoalPace(s, new Date(Date.UTC(2026, 0, 31)));
    expect(pace?.daysRemaining).toBe(0);
    expect(pace?.state).toBe("behind");
    expect(incomeGoalPaceHint(pace!, euro)).toBe(
      "De maand is bijna om en je zit € 2000.00 onder het gelijkmatige tempo.",
    );
  });

  it("respects the shorter length of February", () => {
    const s = summarizeIncomeGoal({ goalCents: 600_000, realizedCents: 0, expectedCents: 0 });
    const pace = incomeGoalPace(s, new Date(Date.UTC(2026, 1, 14)));
    expect(pace?.daysInMonth).toBe(28);
    expect(pace?.expectedByNowCents).toBe(300_000);
    expect(goal.status).toBe("behind");
  });
});
