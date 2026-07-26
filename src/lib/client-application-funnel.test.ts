import { describe, expect, it } from "vitest";
import {
  summarizeClientApplications,
  CLIENT_FUNNEL_MIN_DECIDED,
} from "@/lib/client-application-funnel";

describe("summarizeClientApplications", () => {
  it("telt totaal, wachtenden, shortlist en geaccepteerd uit een statustelling", () => {
    const f = summarizeClientApplications({
      NEW: 3,
      VIEWED: 2,
      SHORTLIST: 4,
      ACCEPTED: 5,
      REJECTED: 6,
      WITHDRAWN: 1,
    });
    expect(f.total).toBe(21);
    expect(f.awaitingFirstLook).toBe(3);
    expect(f.shortlisted).toBe(4);
    expect(f.accepted).toBe(5);
  });

  it("rekent aannamekans over de besliste reacties (geaccepteerd + afgewezen)", () => {
    // 5 geaccepteerd van 5+15 = 20 besliste = 25%.
    const f = summarizeClientApplications({ ACCEPTED: 5, REJECTED: 15, NEW: 100, WITHDRAWN: 8 });
    expect(f.acceptanceRate).toBe(25);
  });

  it("negeert NEW en WITHDRAWN in de aannamekans-noemer", () => {
    // Alleen ACCEPTED telt als beslist → 100%, ongeacht NEW/WITHDRAWN.
    const f = summarizeClientApplications({
      ACCEPTED: CLIENT_FUNNEL_MIN_DECIDED,
      NEW: 9,
      WITHDRAWN: 9,
    });
    expect(f.acceptanceRate).toBe(100);
  });

  it("geeft null-aannamekans onder de steekproefdrempel aan besliste reacties", () => {
    const f = summarizeClientApplications({ ACCEPTED: 1, REJECTED: 1, SHORTLIST: 50 });
    expect(f.acceptanceRate).toBeNull();
  });

  it("geeft null-aannamekans zonder enige besliste reactie", () => {
    const f = summarizeClientApplications({ NEW: 10, VIEWED: 4, SHORTLIST: 2 });
    expect(f.acceptanceRate).toBeNull();
  });

  it("levert nullen op een lege telling", () => {
    const f = summarizeClientApplications({});
    expect(f).toEqual({
      total: 0,
      awaitingFirstLook: 0,
      shortlisted: 0,
      accepted: 0,
      acceptanceRate: null,
    });
  });

  it("negeert negatieve/onbekende waarden defensief", () => {
    const f = summarizeClientApplications({ NEW: -5, ACCEPTED: 4, REJECTED: 4, GARBAGE: 3 });
    // -5 → 0; totaal = 4 + 4 + 3 = 11; awaiting 0; aannamekans 4/8 = 50%.
    expect(f.total).toBe(11);
    expect(f.awaitingFirstLook).toBe(0);
    expect(f.acceptanceRate).toBe(50);
  });
});
