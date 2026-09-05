import { describe, it, expect } from "vitest";
import {
  jobReachSpecSchema,
  hasDiscriminatingRequirements,
  toJobMatchSource,
  parseReachSpecFromForm,
  type JobReachSpec,
} from "./reach-spec";

function spec(partial: Partial<JobReachSpec> = {}): JobReachSpec {
  return jobReachSpecSchema.parse(partial);
}

describe("jobReachSpecSchema", () => {
  it("vult veilige defaults in voor een leeg object", () => {
    const s = jobReachSpecSchema.parse({});
    expect(s).toEqual({
      title: "",
      description: "",
      requiredSkillIds: [],
      optionalSkillIds: [],
      requiredCredentialTypes: [],
      rateMin: null,
      rateMax: null,
      workMode: "ONSITE",
      location: null,
      industryId: null,
    });
  });

  it("weigert een negatief tarief", () => {
    expect(jobReachSpecSchema.safeParse({ rateMin: -5 }).success).toBe(false);
  });
});

describe("hasDiscriminatingRequirements", () => {
  it("is false voor een leeg concept (zou de hele pool 'bereiken')", () => {
    expect(hasDiscriminatingRequirements(spec())).toBe(false);
  });

  it("is true zodra er een vereiste skill is", () => {
    expect(hasDiscriminatingRequirements(spec({ requiredSkillIds: ["s1"] }))).toBe(true);
  });

  it("is true zodra er een vereist certificaat is", () => {
    expect(hasDiscriminatingRequirements(spec({ requiredCredentialTypes: ["VOG"] }))).toBe(true);
  });

  it("is true zodra er een branche is", () => {
    expect(hasDiscriminatingRequirements(spec({ industryId: "i1" }))).toBe(true);
  });

  it("is true zodra er een minimumtarief is", () => {
    expect(hasDiscriminatingRequirements(spec({ rateMin: 40 }))).toBe(true);
  });

  it("blijft false met alleen gewenste (optionele) skills", () => {
    expect(hasDiscriminatingRequirements(spec({ optionalSkillIds: ["s1"] }))).toBe(false);
  });
});

describe("toJobMatchSource", () => {
  it("markeert vereiste skills als required en gewenste als optioneel", () => {
    const src = toJobMatchSource(spec({ requiredSkillIds: ["a", "b"], optionalSkillIds: ["c"] }));
    expect(src.skills).toEqual(
      expect.arrayContaining([
        { skillId: "a", required: true },
        { skillId: "b", required: true },
        { skillId: "c", required: false },
      ]),
    );
    expect(src.skills).toHaveLength(3);
  });

  it("laat required winnen bij overlap tussen vereist en gewenst (geen dubbeling)", () => {
    const src = toJobMatchSource(spec({ requiredSkillIds: ["a"], optionalSkillIds: ["a"] }));
    expect(src.skills).toEqual([{ skillId: "a", required: true }]);
  });

  it("dedupliceert certificaten en markeert ze allemaal als vereist", () => {
    const src = toJobMatchSource(spec({ requiredCredentialTypes: ["VOG", "VOG", "BIG"] }));
    expect(src.credentialRequirements).toEqual([
      { credentialType: "VOG", required: true },
      { credentialType: "BIG", required: true },
    ]);
  });

  it("geeft lege tekstvelden door als null (geen straf op ontbrekende tekst)", () => {
    const src = toJobMatchSource(spec({ title: "", description: "" }));
    expect(src.title).toBeNull();
    expect(src.description).toBeNull();
  });

  it("neemt tarief, werkvorm, locatie en branche over", () => {
    const src = toJobMatchSource(
      spec({ rateMin: 40, rateMax: 80, workMode: "HYBRID", location: "Utrecht", industryId: "i1" }),
    );
    expect(src).toMatchObject({
      rateMin: 40,
      rateMax: 80,
      workMode: "HYBRID",
      location: "Utrecht",
      industryId: "i1",
    });
  });
});

describe("parseReachSpecFromForm", () => {
  function form(entries: [string, string][]): FormData {
    const fd = new FormData();
    for (const [k, v] of entries) fd.append(k, v);
    return fd;
  }

  it("leest meervoudige skill-/certificaatvelden en trimt lege waarden", () => {
    const s = parseReachSpecFromForm(
      form([
        ["title", "Wijkverpleegkundige"],
        ["requiredSkillIds", "s1"],
        ["requiredSkillIds", "s2"],
        ["requiredSkillIds", ""],
        ["optionalSkillIds", "s3"],
        ["requiredCredentialTypes", "BIG"],
        ["rateMin", "45"],
        ["workMode", "ONSITE"],
        ["industryId", "zorg"],
      ]),
    );
    expect(s.requiredSkillIds).toEqual(["s1", "s2"]);
    expect(s.optionalSkillIds).toEqual(["s3"]);
    expect(s.requiredCredentialTypes).toEqual(["BIG"]);
    expect(s.rateMin).toBe(45);
    expect(s.industryId).toBe("zorg");
    expect(s.title).toBe("Wijkverpleegkundige");
  });

  it("maakt een leeg/ongeldig tarief en lege selects tot null", () => {
    const s = parseReachSpecFromForm(
      form([
        ["rateMin", ""],
        ["rateMax", "abc"],
        ["industryId", ""],
        ["location", "  "],
      ]),
    );
    expect(s.rateMin).toBeNull();
    expect(s.rateMax).toBeNull();
    expect(s.industryId).toBeNull();
    expect(s.location).toBeNull();
  });

  it("valt terug op ONSITE als werkvorm ontbreekt", () => {
    const s = parseReachSpecFromForm(form([["title", "x"]]));
    expect(s.workMode).toBe("ONSITE");
  });
});
