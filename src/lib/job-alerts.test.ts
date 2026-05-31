import { describe, expect, it } from "vitest";
import { JOB_ALERT_MIN_SCORE, planJobAlerts } from "./job-alerts";

describe("planJobAlerts", () => {
  it("neemt kandidaten op boven de drempel die nog niet gereageerd hebben", () => {
    const result = planJobAlerts([
      { profileId: "p1", userId: "u1", score: 80, hasApplied: false },
      { profileId: "p2", userId: "u2", score: 65, hasApplied: false },
      { profileId: "p3", userId: "u3", score: 90, hasApplied: false },
    ]);
    expect(result.map((r) => r.profileId)).toEqual(["p3", "p1"]);
  });

  it("filtert kandidaten die al gereageerd hebben", () => {
    const result = planJobAlerts([
      { profileId: "p1", userId: "u1", score: 95, hasApplied: true },
      { profileId: "p2", userId: "u2", score: 85, hasApplied: false },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.profileId).toBe("p2");
  });

  it("respecteert een aangepaste minimum-score", () => {
    const result = planJobAlerts(
      [
        { profileId: "p1", userId: "u1", score: 60, hasApplied: false },
        { profileId: "p2", userId: "u2", score: 80, hasApplied: false },
      ],
      { minScore: 75 },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.profileId).toBe("p2");
  });

  it("geeft lege array terug als er geen kandidaten zijn", () => {
    expect(planJobAlerts([])).toEqual([]);
  });

  it("sorteert aflopend op score", () => {
    const result = planJobAlerts([
      { profileId: "p1", userId: "u1", score: 75, hasApplied: false },
      { profileId: "p2", userId: "u2", score: 95, hasApplied: false },
      { profileId: "p3", userId: "u3", score: 85, hasApplied: false },
    ]);
    expect(result.map((r) => r.score)).toEqual([95, 85, 75]);
  });

  it("sluit kandidaten uit met een score onder de drempel", () => {
    const result = planJobAlerts([
      { profileId: "p1", userId: "u1", score: JOB_ALERT_MIN_SCORE - 1, hasApplied: false },
    ]);
    expect(result).toHaveLength(0);
  });

  it("neemt kandidaten op met een score gelijk aan de drempel", () => {
    const result = planJobAlerts([
      { profileId: "p1", userId: "u1", score: JOB_ALERT_MIN_SCORE, hasApplied: false },
    ]);
    expect(result).toHaveLength(1);
  });

  it("sluit zowel lage score als al-gereageerd tegelijk uit", () => {
    const result = planJobAlerts([
      { profileId: "p1", userId: "u1", score: 95, hasApplied: true },
      { profileId: "p2", userId: "u2", score: 50, hasApplied: false },
      { profileId: "p3", userId: "u3", score: 80, hasApplied: false },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.profileId).toBe("p3");
  });
});
