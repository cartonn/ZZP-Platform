import { describe, expect, it } from "vitest";
import {
  assessJobQuality,
  JOB_DESCRIPTION_MIN_LENGTH,
  JOB_QUALITY_MAX_TIPS,
  type JobQualityInput,
} from "./job-quality";

function base(overrides: Partial<JobQualityInput> = {}): JobQualityInput {
  return {
    title: "Wijkverpleegkundige, regio Utrecht",
    description: "x".repeat(JOB_DESCRIPTION_MIN_LENGTH),
    rateMinEuro: 60,
    industryId: "zorg",
    location: "Utrecht",
    workMode: "ONSITE",
    startDate: "2026-08-01",
    requiredSkillCount: 2,
    marketMedianEuro: 55,
    ...overrides,
  };
}

describe("assessJobQuality", () => {
  it("een volledige, aantrekkelijke plaatsing scoort 100 en is 'strong'", () => {
    const result = assessJobQuality(base());
    expect(result.score).toBe(100);
    expect(result.level).toBe("strong");
    expect(result.tips).toEqual([]);
    expect(result.doneCount).toBe(result.applicableCount);
  });

  it("een lege plaatsing scoort 0 en is 'thin'", () => {
    const result = assessJobQuality(
      base({
        title: "",
        description: "",
        rateMinEuro: null,
        industryId: "",
        location: "",
        workMode: "ONSITE",
        startDate: "",
        requiredSkillCount: 0,
        marketMedianEuro: null,
      }),
    );
    expect(result.score).toBe(0);
    expect(result.level).toBe("thin");
    expect(result.tips.length).toBe(JOB_QUALITY_MAX_TIPS);
  });

  it("titel telt pas als concreet vanaf de minimumlengte", () => {
    const short = assessJobQuality(base({ title: "Zorg" }));
    expect(short.checks.find((c) => c.code === "title")?.done).toBe(false);
    const ok = assessJobQuality(base({ title: "Verpleegkundige" }));
    expect(ok.checks.find((c) => c.code === "title")?.done).toBe(true);
  });

  it("omschrijving onder de drempel is niet voldaan en geeft de zwaarste tip bovenaan", () => {
    const result = assessJobQuality(base({ description: "Kort." }));
    const desc = result.checks.find((c) => c.code === "description");
    expect(desc?.done).toBe(false);
    // description weegt 25 (zwaarst) → staat bovenaan de tips.
    expect(result.tips[0]).toContain("Beschrijf taken");
  });

  it("de concurrerend-tarief-check telt niet mee zonder markt-mediaan", () => {
    const result = assessJobQuality(base({ marketMedianEuro: null }));
    expect(result.checks.some((c) => c.code === "rateCompetitive")).toBe(false);
  });

  it("de concurrerend-tarief-check telt niet mee zonder tarief", () => {
    const result = assessJobQuality(base({ rateMinEuro: null }));
    expect(result.checks.some((c) => c.code === "rateCompetitive")).toBe(false);
  });

  it("tarief onder het marktmediaan geeft een verhoog-tip met bedrag", () => {
    const result = assessJobQuality(base({ rateMinEuro: 40, marketMedianEuro: 55 }));
    const check = result.checks.find((c) => c.code === "rateCompetitive");
    expect(check?.done).toBe(false);
    expect(check?.tip).toContain("€55");
    expect(result.score).toBeLessThan(100);
  });

  it("tarief op of boven het mediaan is voldaan", () => {
    const exact = assessJobQuality(base({ rateMinEuro: 55, marketMedianEuro: 55 }));
    expect(exact.checks.find((c) => c.code === "rateCompetitive")?.done).toBe(true);
  });

  it("locatie is voldaan bij ingevulde plaats óf bij werk op afstand", () => {
    const remote = assessJobQuality(base({ location: "", workMode: "REMOTE" }));
    expect(remote.checks.find((c) => c.code === "location")?.done).toBe(true);
    const onsiteNoLoc = assessJobQuality(base({ location: "", workMode: "ONSITE" }));
    expect(onsiteNoLoc.checks.find((c) => c.code === "location")?.done).toBe(false);
  });

  it("voldane checks dragen geen tip meer", () => {
    const result = assessJobQuality(base());
    expect(result.checks.every((c) => (c.done ? c.tip === null : c.tip !== null))).toBe(true);
  });

  it("alleen witruimte telt niet als ingevuld", () => {
    const result = assessJobQuality(base({ title: "   ", location: "  ", startDate: "  " }));
    expect(result.checks.find((c) => c.code === "title")?.done).toBe(false);
    expect(result.checks.find((c) => c.code === "location")?.done).toBe(false);
    expect(result.checks.find((c) => c.code === "startDate")?.done).toBe(false);
  });

  it("score is monotoon: een extra voldane check verhoogt nooit de tips en verlaagt de score niet", () => {
    const without = assessJobQuality(base({ requiredSkillCount: 0 }));
    const withSkill = assessJobQuality(base({ requiredSkillCount: 1 }));
    expect(withSkill.score).toBeGreaterThan(without.score);
    expect(withSkill.tips.length).toBeLessThanOrEqual(without.tips.length);
  });
});
