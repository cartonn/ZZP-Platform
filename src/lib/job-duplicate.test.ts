import { describe, expect, it } from "vitest";
import {
  buildJobDuplicateInitial,
  duplicateJobTitle,
  JOB_TITLE_MAX,
  type DuplicableJob,
} from "./job-duplicate";

describe("duplicateJobTitle", () => {
  it("voegt ' (kopie)' toe aan een gewone titel", () => {
    expect(duplicateJobTitle("Verpleegkundige nachtdienst")).toBe(
      "Verpleegkundige nachtdienst (kopie)",
    );
  });

  it("trimt de bron en voegt daarna toe", () => {
    expect(duplicateJobTitle("  Timmerman  ")).toBe("Timmerman (kopie)");
  });

  it("dupliceert het achtervoegsel niet als het er al staat", () => {
    expect(duplicateJobTitle("Schilder (kopie)")).toBe("Schilder (kopie)");
  });

  it("herkent het achtervoegsel hoofdletterongevoelig", () => {
    expect(duplicateJobTitle("Schilder (KOPIE)")).toBe("Schilder (KOPIE)");
  });

  it("kort de basistitel in zodat het geheel binnen de max past", () => {
    const long = "a".repeat(200);
    const result = duplicateJobTitle(long);
    expect(result.length).toBeLessThanOrEqual(JOB_TITLE_MAX);
    expect(result.endsWith(" (kopie)")).toBe(true);
  });

  it("kort een reeds te lange kopie-titel in tot de max", () => {
    const result = duplicateJobTitle("b".repeat(200) + " (kopie)");
    expect(result.length).toBeLessThanOrEqual(JOB_TITLE_MAX);
  });
});

const source: DuplicableJob = {
  title: "Elektromonteur",
  description: "Onderhoud aan installaties.",
  industryId: "ind-1",
  rateMin: 45,
  rateMax: 65,
  location: "Utrecht",
  workMode: "ONSITE",
  modelAgreementType: "GEEN_WERKGEVERSGEZAG",
  dbaDirectSupervision: false,
  dbaEmbedded: true,
  dbaFixedSchedule: false,
  dbaNoSubstitution: false,
  dbaExclusive: false,
  dbaWeakEntrepreneurship: false,
  dbaDurationMonths: 6,
  skills: [
    { skillId: "s1", required: true },
    { skillId: "s2", required: true },
    { skillId: "s3", required: false },
  ],
  credentialRequirements: [
    { credentialType: "VOG", required: true },
    { credentialType: "CERTIFICATE", required: false },
  ],
};

describe("buildJobDuplicateInitial", () => {
  it("neemt de inhoud over en zet een kopie-titel", () => {
    const initial = buildJobDuplicateInitial(source);
    expect(initial.title).toBe("Elektromonteur (kopie)");
    expect(initial.description).toBe("Onderhoud aan installaties.");
    expect(initial.industryId).toBe("ind-1");
    expect(initial.rateMin).toBe("45");
    expect(initial.rateMax).toBe("65");
    expect(initial.location).toBe("Utrecht");
    expect(initial.workMode).toBe("ONSITE");
    expect(initial.modelAgreementType).toBe("GEEN_WERKGEVERSGEZAG");
  });

  it("laat id en startDate weg zodat een vers concept ontstaat", () => {
    const initial = buildJobDuplicateInitial(source);
    expect("id" in initial).toBe(false);
    expect(initial.startDate).toBe("");
  });

  it("splitst skills in verplicht en optioneel", () => {
    const initial = buildJobDuplicateInitial(source);
    expect(initial.requiredSkillIds).toEqual(["s1", "s2"]);
    expect(initial.optionalSkillIds).toEqual(["s3"]);
  });

  it("splitst certificaateisen in verplicht en optioneel", () => {
    const initial = buildJobDuplicateInitial(source);
    expect(initial.requiredCredentialTypes).toEqual(["VOG"]);
    expect(initial.optionalCredentialTypes).toEqual(["CERTIFICATE"]);
  });

  it("neemt de DBA-antwoorden over", () => {
    const initial = buildJobDuplicateInitial(source);
    expect(initial.dba.dbaEmbedded).toBe(true);
    expect(initial.dba.dbaDirectSupervision).toBe(false);
    expect(initial.dba.dbaDurationMonths).toBe("6");
  });

  it("normaliseert lege/afwezige waarden naar lege strings", () => {
    const initial = buildJobDuplicateInitial({
      ...source,
      industryId: null,
      rateMin: null,
      rateMax: null,
      location: null,
      modelAgreementType: null,
      dbaDurationMonths: null,
    });
    expect(initial.industryId).toBe("");
    expect(initial.rateMin).toBe("");
    expect(initial.rateMax).toBe("");
    expect(initial.location).toBe("");
    expect(initial.modelAgreementType).toBe("");
    expect(initial.dba.dbaDurationMonths).toBe("");
  });
});
