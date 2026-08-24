import { describe, expect, it } from "vitest";
import {
  assessJobListingQuality,
  LISTING_QUALITY_CHECK_CODES,
  type JobListingForQuality,
} from "@/lib/job-listing-quality";

const complete: JobListingForQuality = {
  title: "Wijkverpleegkundige, regio Utrecht",
  description:
    "Je werkt in een hecht wijkteam en levert zowel planbare als onplanbare zorg aan cliënten bij hen thuis. We verwachten zelfstandigheid, een geldige BIG-registratie en goede communicatie met de cliënt en familie.",
  industryId: "ind-zorg",
  location: "Utrecht",
  workMode: "ONSITE",
  hasStartDate: true,
  requiredSkillCount: 2,
};

describe("assessJobListingQuality", () => {
  it("een volledige plaatsing heeft geen open tips en is compleet", () => {
    const result = assessJobListingQuality(complete);
    expect(result.complete).toBe(true);
    expect(result.openTips).toEqual([]);
    expect(result.doneCount).toBe(result.total);
    expect(result.total).toBe(LISTING_QUALITY_CHECK_CODES.length);
  });

  it("een dunne plaatsing levert concrete tips, zwaarst wegend eerst", () => {
    const thin: JobListingForQuality = {
      title: "",
      description: "Kort.",
      industryId: null,
      location: "",
      workMode: "ONSITE",
      hasStartDate: false,
      requiredSkillCount: 0,
    };
    const result = assessJobListingQuality(thin);
    expect(result.complete).toBe(false);
    const codes = result.openTips.map((t) => t.code);
    // Alle zes listing-onderdelen ontbreken.
    expect(codes.sort()).toEqual([...LISTING_QUALITY_CHECK_CODES].sort());
    // Omschrijving weegt het zwaarst (25) en staat vooraan.
    expect(result.openTips[0]?.code).toBe("description");
    // Elke tip draagt een niet-lege omschrijving.
    for (const tip of result.openTips) {
      expect(tip.tip.length).toBeGreaterThan(0);
    }
  });

  it("negeert de tarief-dimensie volledig (geen tarief-tip, ook zonder tarief)", () => {
    const result = assessJobListingQuality({ ...complete });
    expect(result.openTips.some((t) => t.code === "rate" || t.code === "rateCompetitive")).toBe(
      false,
    );
    // Een tarief hoort niet bij de listing-telling.
    expect(result.total).toBe(6);
  });

  it("locatie geldt als voldaan bij op-afstand-werk zonder plaats", () => {
    const remote = assessJobListingQuality({
      ...complete,
      location: "",
      workMode: "REMOTE",
    });
    expect(remote.openTips.some((t) => t.code === "location")).toBe(false);
  });

  it("telt alleen vereiste skills mee", () => {
    const noRequired = assessJobListingQuality({ ...complete, requiredSkillCount: 0 });
    expect(noRequired.openTips.some((t) => t.code === "skills")).toBe(true);
    // De vijf overige listing-onderdelen zijn nog wél voldaan.
    expect(noRequired.doneCount).toBe(5);
  });
});
