import { describe, it, expect } from "vitest";
import {
  summarizeJobCompetition,
  competitionLevel,
  chanceLevel,
  competitionChip,
  COMPETITION_MODERATE_MIN,
  COMPETITION_HIGH_MIN,
  COMPETITION_STRONG_SCORE,
  COMPETITION_FAIR_SCORE,
} from "@/lib/job-competition";

describe("competitionLevel", () => {
  it("is 'low' onder de matig-drempel", () => {
    expect(competitionLevel(0)).toBe("low");
    expect(competitionLevel(COMPETITION_MODERATE_MIN - 1)).toBe("low");
  });

  it("is 'moderate' op de matig-drempel (inclusief) tot de hoog-drempel", () => {
    expect(competitionLevel(COMPETITION_MODERATE_MIN)).toBe("moderate");
    expect(competitionLevel(COMPETITION_HIGH_MIN - 1)).toBe("moderate");
  });

  it("is 'high' op en boven de hoog-drempel", () => {
    expect(competitionLevel(COMPETITION_HIGH_MIN)).toBe("high");
    expect(competitionLevel(50)).toBe("high");
  });
});

describe("chanceLevel", () => {
  it("geeft null bij onbekende score", () => {
    expect(chanceLevel(null)).toBeNull();
  });

  it("classificeert op de grenzen inclusief", () => {
    expect(chanceLevel(COMPETITION_STRONG_SCORE)).toBe("strong");
    expect(chanceLevel(COMPETITION_STRONG_SCORE - 1)).toBe("fair");
    expect(chanceLevel(COMPETITION_FAIR_SCORE)).toBe("fair");
    expect(chanceLevel(COMPETITION_FAIR_SCORE - 1)).toBe("longshot");
    expect(chanceLevel(0)).toBe("longshot");
  });
});

describe("summarizeJobCompetition", () => {
  it("nudge 'Wees de eerste' bij nul reacties, niet urgent", () => {
    const r = summarizeJobCompetition({ applicantCount: 0, myScore: 80 });
    expect(r.headline).toBe("Wees de eerste");
    expect(r.urgent).toBe(false);
    expect(r.applicantCount).toBe(0);
    expect(r.level).toBe("low");
  });

  it("nul reacties met sterke match noemt de vroege voorsprong", () => {
    const r = summarizeJobCompetition({ applicantCount: 0, myScore: 90 });
    expect(r.hint).toContain("sterke match");
  });

  it("nul reacties met beperkte match stuurt op eisen aanvullen", () => {
    const r = summarizeJobCompetition({ applicantCount: 0, myScore: 20 });
    expect(r.hint).toContain("ontbrekende eisen");
  });

  it("toont alleen belangstelling wanneer de eigen score onbekend is", () => {
    const high = summarizeJobCompetition({ applicantCount: 10, myScore: null });
    expect(high.chance).toBeNull();
    expect(high.headline).toBe("Veel belangstelling");
    expect(high.urgent).toBe(true);

    const mod = summarizeJobCompetition({ applicantCount: 4, myScore: null });
    expect(mod.headline).toBe("Enkele kandidaten");

    const low = summarizeJobCompetition({ applicantCount: 1, myScore: null });
    expect(low.headline).toBe("Weinig concurrentie");
    expect(low.urgent).toBe(false);
  });

  it("sterke match + hoge concurrentie → reageer snel (urgent)", () => {
    const r = summarizeJobCompetition({ applicantCount: 12, myScore: 85 });
    expect(r.chance).toBe("strong");
    expect(r.level).toBe("high");
    expect(r.headline).toBe("Sterke match — reageer snel");
    expect(r.urgent).toBe(true);
  });

  it("sterke match + lage concurrentie → goede kans, niet urgent", () => {
    const r = summarizeJobCompetition({ applicantCount: 1, myScore: 85 });
    expect(r.headline).toBe("Goede kans");
    expect(r.urgent).toBe(false);
    expect(r.hint).toContain("weinig concurrentie");
  });

  it("redelijke match + hoge concurrentie → veel concurrentie (urgent)", () => {
    const r = summarizeJobCompetition({ applicantCount: 9, myScore: 60 });
    expect(r.chance).toBe("fair");
    expect(r.headline).toBe("Veel concurrentie");
    expect(r.urgent).toBe(true);
  });

  it("beperkte match + hoge concurrentie → beperkte kans, niet urgent", () => {
    const r = summarizeJobCompetition({ applicantCount: 10, myScore: 30 });
    expect(r.chance).toBe("longshot");
    expect(r.headline).toBe("Beperkte kans");
    expect(r.urgent).toBe(false);
  });

  it("beperkte match + lage concurrentie → kans bestaat", () => {
    const r = summarizeJobCompetition({ applicantCount: 1, myScore: 30 });
    expect(r.headline).toBe("Kans bestaat");
    expect(r.hint).toContain("ontbrekende eisen");
  });

  it("normaliseert een negatieve of fractionele telling", () => {
    expect(summarizeJobCompetition({ applicantCount: -5, myScore: 80 }).applicantCount).toBe(0);
    expect(summarizeJobCompetition({ applicantCount: 4.9, myScore: 80 }).applicantCount).toBe(4);
  });
});

describe("competitionChip", () => {
  it("geeft null bij 0 reacties (geen ruis op lege opdrachten)", () => {
    expect(competitionChip(summarizeJobCompetition({ applicantCount: 0, myScore: 90 }))).toBeNull();
  });

  it("toont enkelvoud bij precies 1 reactie", () => {
    const chip = competitionChip(summarizeJobCompetition({ applicantCount: 1, myScore: null }));
    expect(chip).toEqual({ label: "1 reactie", tone: "info" });
  });

  it("toont meervoud met neutrale toon bij matige concurrentie", () => {
    const chip = competitionChip(
      summarizeJobCompetition({ applicantCount: COMPETITION_MODERATE_MIN, myScore: 80 }),
    );
    expect(chip).toEqual({ label: `${COMPETITION_MODERATE_MIN} reacties`, tone: "info" });
  });

  it("markeert urgent (veel reacties + niet-kansloze match) met een reageer-snel-cue", () => {
    const chip = competitionChip(
      summarizeJobCompetition({ applicantCount: COMPETITION_HIGH_MIN, myScore: 85 }),
    );
    expect(chip).toEqual({
      label: `${COMPETITION_HIGH_MIN} reacties · reageer snel`,
      tone: "urgent",
    });
  });

  it("blijft neutraal bij veel reacties maar een kansloze eigen match", () => {
    const chip = competitionChip(
      summarizeJobCompetition({ applicantCount: COMPETITION_HIGH_MIN, myScore: 10 }),
    );
    expect(chip).toEqual({ label: `${COMPETITION_HIGH_MIN} reacties`, tone: "info" });
  });
});
