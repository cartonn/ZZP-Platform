import { describe, it, expect } from "vitest";
import {
  summarizeJobReach,
  REACH_MIN_SCORE,
  REACH_STRONG_SCORE,
  type ReachCandidate,
} from "@/lib/job-reach";

const cand = (score: number, available = true): ReachCandidate => ({ score, available });

describe("summarizeJobReach", () => {
  it("telt een lege pool als bereik 'low' met een nul-tip", () => {
    const r = summarizeJobReach([]);
    expect(r).toMatchObject({
      total: 0,
      strong: 0,
      available: 0,
      strongAvailable: 0,
      level: "low",
    });
    expect(r.hint).toContain("Nog geen passende ZZP'ers");
  });

  it("negeert kandidaten onder de minimumscore", () => {
    const r = summarizeJobReach([cand(REACH_MIN_SCORE - 1), cand(0), cand(49)]);
    expect(r.total).toBe(0);
  });

  it("telt op de grens inclusief (score === REACH_MIN_SCORE telt mee)", () => {
    const r = summarizeJobReach([cand(REACH_MIN_SCORE)]);
    expect(r.total).toBe(1);
  });

  it("telt een sterke match op de grens (score === REACH_STRONG_SCORE) als strong", () => {
    const r = summarizeJobReach([cand(REACH_STRONG_SCORE)]);
    expect(r.strong).toBe(1);
    expect(r.strongAvailable).toBe(1);
  });

  it("scheidt beschikbaar van niet-beschikbaar", () => {
    const r = summarizeJobReach([cand(80, true), cand(80, false), cand(60, false)]);
    expect(r.total).toBe(3);
    expect(r.strong).toBe(2);
    expect(r.available).toBe(1);
    expect(r.strongAvailable).toBe(1);
  });

  it("is 'good' bij ≥3 sterke + beschikbare matches", () => {
    const r = summarizeJobReach([cand(90), cand(85), cand(75)]);
    expect(r.level).toBe("good");
    expect(r.hint).toBeNull();
  });

  it("is 'moderate' bij precies 1 sterke + beschikbare match", () => {
    const r = summarizeJobReach([cand(80, true), cand(60, false)]);
    expect(r.level).toBe("moderate");
    expect(r.hint).toContain("enkele passende");
  });

  it("is 'moderate' bij ≥3 beschikbare passenden zonder sterke matches", () => {
    const r = summarizeJobReach([cand(60), cand(55), cand(65)]);
    expect(r.strongAvailable).toBe(0);
    expect(r.available).toBe(3);
    expect(r.level).toBe("moderate");
  });

  it("is 'low' bij passenden maar geen beschikbaarheid", () => {
    const r = summarizeJobReach([cand(90, false), cand(80, false)]);
    expect(r.level).toBe("low");
    expect(r.hint).toContain("Beperkt bereik");
  });

  it("telt elke kandidaat hoogstens één keer per bucket", () => {
    const r = summarizeJobReach([cand(100, true)]);
    expect(r).toMatchObject({ total: 1, strong: 1, available: 1, strongAvailable: 1 });
  });
});
