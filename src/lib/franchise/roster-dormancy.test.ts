import { describe, it, expect } from "vitest";
import {
  classifyRosterDormancy,
  summarizeRosterDormancy,
  rosterDormancyHeadline,
  DORMANT_IDLE_DAYS,
  COOLING_IDLE_DAYS,
} from "./roster-dormancy";

const NOW = new Date("2026-07-27T12:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

describe("classifyRosterDormancy", () => {
  it("markeert een bench-vakmens die ≥60 dagen niet inlogde als dormant (warning + benader-stap)", () => {
    const r = classifyRosterDormancy(
      { lastActiveAt: daysAgo(DORMANT_IDLE_DAYS + 5), activeCollaborations: 0 },
      NOW,
    );
    expect(r.tier).toBe("dormant");
    expect(r.tone).toBe("warning");
    expect(r.daysIdle).toBe(DORMANT_IDLE_DAYS + 5);
    expect(r.label).toContain("niet ingelogd");
    expect(r.suggestion).toBeTruthy();
  });

  it("markeert 30–59 dagen bench-inactiviteit als cooling (muted, vroeg-signaal)", () => {
    const r = classifyRosterDormancy(
      { lastActiveAt: daysAgo(COOLING_IDLE_DAYS + 1), activeCollaborations: 0 },
      NOW,
    );
    expect(r.tier).toBe("cooling");
    expect(r.tone).toBe("muted");
    expect(r.label).toContain("niet ingelogd");
  });

  it("geeft geen signaal onder de cooling-drempel", () => {
    const r = classifyRosterDormancy(
      { lastActiveAt: daysAgo(COOLING_IDLE_DAYS - 1), activeCollaborations: 0 },
      NOW,
    );
    expect(r.tier).toBe("active");
    expect(r.tone).toBeNull();
    expect(r.label).toBeNull();
  });

  it("negeert een nu-ingezette vakmens ongeacht hoe lang geleden hij inlogde (engaged via het werk)", () => {
    const r = classifyRosterDormancy(
      { lastActiveAt: daysAgo(DORMANT_IDLE_DAYS + 100), activeCollaborations: 1 },
      NOW,
    );
    expect(r.tier).toBe("active");
    expect(r.daysIdle).toBeNull();
    expect(r.label).toBeNull();
  });

  it("geeft geen vals alarm bij een onbekende laatste-login (nooit ingelogd)", () => {
    const r = classifyRosterDormancy({ lastActiveAt: null, activeCollaborations: 0 }, NOW);
    expect(r.tier).toBe("active");
    expect(r.daysIdle).toBeNull();
    expect(r.label).toBeNull();
  });

  it("grenswaarde: exact op de dormant-drempel telt als dormant", () => {
    const r = classifyRosterDormancy(
      { lastActiveAt: daysAgo(DORMANT_IDLE_DAYS), activeCollaborations: 0 },
      NOW,
    );
    expect(r.tier).toBe("dormant");
  });
});

describe("summarizeRosterDormancy", () => {
  it("telt de reeds geclassificeerde tiers; active telt niet mee als kandidaat", () => {
    // Zelfde bron als de kaart: classificeer per rij, tel dan de tiers.
    const rows = [
      { lastActiveAt: daysAgo(80), activeCollaborations: 0 }, // dormant
      { lastActiveAt: daysAgo(65), activeCollaborations: 0 }, // dormant
      { lastActiveAt: daysAgo(40), activeCollaborations: 0 }, // cooling
      { lastActiveAt: daysAgo(80), activeCollaborations: 2 }, // ingezet → active
      { lastActiveAt: daysAgo(5), activeCollaborations: 0 }, // active
      { lastActiveAt: null, activeCollaborations: 0 }, // onbekend → active
    ];
    const summary = summarizeRosterDormancy(
      rows.map((r) => ({ dormancyTier: classifyRosterDormancy(r, NOW).tier })),
    );
    expect(summary.total).toBe(6);
    expect(summary.dormant).toBe(2);
    expect(summary.cooling).toBe(1);
  });
});

describe("rosterDormancyHeadline", () => {
  it("is null zonder enige re-engagement-kandidaat", () => {
    expect(rosterDormancyHeadline({ total: 4, dormant: 0, cooling: 0 })).toBeNull();
  });

  it("benadrukt de stilgevallen vakmensen wanneer die er zijn", () => {
    const line = rosterDormancyHeadline({ total: 10, dormant: 3, cooling: 2 });
    expect(line).toContain("stilgevallen");
    expect(line).toContain("3");
  });

  it("valt terug op het cooling-signaal wanneer er nog geen dormant is", () => {
    const line = rosterDormancyHeadline({ total: 10, dormant: 0, cooling: 2 });
    expect(line).toContain("koelen af");
    expect(line).toContain("2");
  });

  it("gebruikt enkelvoud bij één afkoelende vakmens", () => {
    const line = rosterDormancyHeadline({ total: 10, dormant: 0, cooling: 1 });
    expect(line).toContain("1 vakmens koelt af");
  });
});
