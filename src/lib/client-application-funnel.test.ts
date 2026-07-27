import { describe, expect, it } from "vitest";
import {
  summarizeClientApplications,
  ageInDays,
  CLIENT_FUNNEL_MIN_DECIDED,
  CANDIDATE_GHOSTING_RISK_DAYS,
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
      awaitingFirstLookOldestDays: null,
      awaitingFirstLookAtRisk: false,
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

  describe("langst-wachtende NEW-reactie (ghosting-risico)", () => {
    const now = new Date("2026-07-27T12:00:00Z");

    it("rekent de leeftijd van de langst wachtende NEW-reactie in hele dagen", () => {
      const oldestNewAt = new Date("2026-07-24T09:00:00Z"); // ~3 dagen + 3 uur → floor = 3
      const f = summarizeClientApplications({ NEW: 2 }, { oldestNewAt, now });
      expect(f.awaitingFirstLookOldestDays).toBe(3);
      expect(f.awaitingFirstLookAtRisk).toBe(false);
    });

    it("markeert een ghosting-risico vanaf de drempel", () => {
      const oldestNewAt = new Date(now.getTime() - CANDIDATE_GHOSTING_RISK_DAYS * 86_400_000);
      const f = summarizeClientApplications({ NEW: 1 }, { oldestNewAt, now });
      expect(f.awaitingFirstLookOldestDays).toBe(CANDIDATE_GHOSTING_RISK_DAYS);
      expect(f.awaitingFirstLookAtRisk).toBe(true);
    });

    it("geeft geen leeftijd/risico zonder wachtende NEW-reactie, ook al is er een tijdstip", () => {
      const oldestNewAt = new Date("2026-01-01T00:00:00Z"); // verdwaald/oud tijdstip
      const f = summarizeClientApplications({ NEW: 0, SHORTLIST: 3 }, { oldestNewAt, now });
      expect(f.awaitingFirstLookOldestDays).toBeNull();
      expect(f.awaitingFirstLookAtRisk).toBe(false);
    });

    it("geeft geen leeftijd wanneer er geen tijdstip bekend is", () => {
      const f = summarizeClientApplications({ NEW: 4 }, { oldestNewAt: null, now });
      expect(f.awaitingFirstLookOldestDays).toBeNull();
      expect(f.awaitingFirstLookAtRisk).toBe(false);
    });

    it("klemt een toekomstig tijdstip naar 0 dagen (nooit negatief)", () => {
      const oldestNewAt = new Date(now.getTime() + 5 * 86_400_000);
      const f = summarizeClientApplications({ NEW: 1 }, { oldestNewAt, now });
      expect(f.awaitingFirstLookOldestDays).toBe(0);
      expect(f.awaitingFirstLookAtRisk).toBe(false);
    });
  });

  describe("ageInDays", () => {
    const now = new Date("2026-07-27T12:00:00Z");
    it("geeft null voor een ontbrekend tijdstip", () => {
      expect(ageInDays(null, now)).toBeNull();
      expect(ageInDays(undefined, now)).toBeNull();
    });
    it("rondt naar beneden af op hele dagen", () => {
      expect(ageInDays(new Date(now.getTime() - 86_400_000 - 1), now)).toBe(1);
      expect(ageInDays(new Date(now.getTime() - 86_400_000 + 1), now)).toBe(0);
    });
    it("is nooit negatief bij een toekomstig tijdstip", () => {
      expect(ageInDays(new Date(now.getTime() + 999_999), now)).toBe(0);
    });
  });
});
