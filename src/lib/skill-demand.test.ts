import { describe, expect, it } from "vitest";
import { computeSkillDemand, type JobSkillRequirementRow } from "@/lib/skill-demand";

function req(jobId: string, skillId: string, skillName: string): JobSkillRequirementRow {
  return { jobId, skillId, skillName };
}

describe("computeSkillDemand", () => {
  it("levert een leeg signaal zonder vereisten", () => {
    expect(computeSkillDemand([], ["s1"])).toEqual({ gaps: [], blockedOpportunities: 0 });
  });

  it("negeert vaardigheden die de ZZP'er al in zijn profiel heeft", () => {
    const result = computeSkillDemand(
      [req("j1", "s1", "Wondzorg"), req("j1", "s2", "Medicatie")],
      ["s1", "s2"],
    );
    expect(result.gaps).toEqual([]);
    expect(result.blockedOpportunities).toBe(0);
  });

  it("rapporteert een ontbrekende vereiste vaardigheid met opportunity-telling", () => {
    const result = computeSkillDemand([req("j1", "s1", "Wondzorg")], []);
    expect(result.gaps).toEqual([{ skillId: "s1", name: "Wondzorg", opportunityCount: 1 }]);
    expect(result.blockedOpportunities).toBe(1);
  });

  it("telt distinct opdrachten per vaardigheid en dedupliceert dubbele (job, skill)-rijen", () => {
    const result = computeSkillDemand(
      [
        req("j1", "s1", "Wondzorg"),
        req("j2", "s1", "Wondzorg"),
        req("j1", "s1", "Wondzorg"), // dubbele rij, mag niet dubbeltellen
      ],
      [],
    );
    expect(result.gaps).toEqual([{ skillId: "s1", name: "Wondzorg", opportunityCount: 2 }]);
    expect(result.blockedOpportunities).toBe(2);
  });

  it("sorteert op opportunityCount desc, dan alfabetisch op naam", () => {
    const result = computeSkillDemand(
      [
        req("j1", "s1", "Zorg"), // 1 opdracht
        req("j2", "s2", "Begeleiding"), // 2 opdrachten
        req("j3", "s2", "Begeleiding"),
        req("j4", "s3", "Administratie"), // 2 opdrachten, alfabetisch vóór Begeleiding
        req("j5", "s3", "Administratie"),
      ],
      [],
    );
    expect(result.gaps.map((g) => g.name)).toEqual(["Administratie", "Begeleiding", "Zorg"]);
    expect(result.gaps[0]).toEqual({ skillId: "s3", name: "Administratie", opportunityCount: 2 });
  });

  it("telt geblokkeerde opdrachten uniek over meerdere ontbrekende vaardigheden", () => {
    // j1 vraagt twee ontbrekende skills; telt maar één keer als geblokkeerde opdracht.
    const result = computeSkillDemand(
      [req("j1", "s1", "Wondzorg"), req("j1", "s2", "Medicatie"), req("j2", "s1", "Wondzorg")],
      [],
    );
    expect(result.blockedOpportunities).toBe(2);
    expect(result.gaps).toHaveLength(2);
  });

  it("mengt bezeten en ontbrekende vaardigheden correct", () => {
    const result = computeSkillDemand(
      [req("j1", "s1", "Heeft"), req("j1", "s2", "Mist"), req("j2", "s2", "Mist")],
      ["s1"],
    );
    expect(result.gaps).toEqual([{ skillId: "s2", name: "Mist", opportunityCount: 2 }]);
    expect(result.blockedOpportunities).toBe(2);
  });
});
