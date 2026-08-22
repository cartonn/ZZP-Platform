import { describe, expect, it } from "vitest";
import { COMPETITION_HIGH_MIN, COMPETITION_MODERATE_MIN } from "@/lib/job-competition";
import { summarizeApplicationCompetition } from "@/lib/application-competition";
import { type ApplicationStatus } from "@/lib/enums";

describe("summarizeApplicationCompetition", () => {
  it("geeft null voor reeds besliste of afgehandelde reacties", () => {
    for (const status of ["REJECTED", "ACCEPTED", "WITHDRAWN"] as ApplicationStatus[]) {
      expect(summarizeApplicationCompetition({ otherApplicantCount: 5, status })).toBeNull();
    }
  });

  it("NEW zonder andere kandidaten: enige kandidaat, positief", () => {
    const note = summarizeApplicationCompetition({ otherApplicantCount: 0, status: "NEW" });
    expect(note).not.toBeNull();
    expect(note!.tone).toBe("positive");
    expect(note!.label).toBe("Enige kandidaat");
  });

  it("VIEWED met weinig concurrentie: neutraal-positief, telt anderen", () => {
    const note = summarizeApplicationCompetition({ otherApplicantCount: 1, status: "VIEWED" });
    expect(note!.label).toBe("Nog 1 andere kandidaat");
    expect(note!.tone).toBe("positive");
  });

  it("meervoud correct bij >1 andere kandidaat", () => {
    const note = summarizeApplicationCompetition({ otherApplicantCount: 2, status: "NEW" });
    expect(note!.label).toBe("Nog 2 andere kandidaten");
  });

  it("matige concurrentie (drempel): neutraal", () => {
    const note = summarizeApplicationCompetition({
      otherApplicantCount: COMPETITION_MODERATE_MIN,
      status: "NEW",
    });
    expect(note!.tone).toBe("neutral");
  });

  it("hoge concurrentie (drempel): caution + breder-kijken-tip", () => {
    const note = summarizeApplicationCompetition({
      otherApplicantCount: COMPETITION_HIGH_MIN,
      status: "VIEWED",
    });
    expect(note!.tone).toBe("caution");
    expect(note!.hint.toLowerCase()).toContain("andere opdrachten");
  });

  it("SHORTLIST blijft positief, ook bij veel concurrentie", () => {
    const note = summarizeApplicationCompetition({
      otherApplicantCount: COMPETITION_HIGH_MIN + 4,
      status: "SHORTLIST",
    });
    expect(note!.tone).toBe("positive");
    expect(note!.label).toBe(`Nog ${COMPETITION_HIGH_MIN + 4} andere kandidaten`);
  });

  it("SHORTLIST zonder anderen: enige op de shortlist", () => {
    const note = summarizeApplicationCompetition({ otherApplicantCount: 0, status: "SHORTLIST" });
    expect(note!.label).toBe("Enige op de shortlist");
    expect(note!.tone).toBe("positive");
  });

  it("negatieve of fractionele input wordt geklemd/afgekapt", () => {
    expect(summarizeApplicationCompetition({ otherApplicantCount: -3, status: "NEW" })!.label).toBe(
      "Enige kandidaat",
    );
    expect(
      summarizeApplicationCompetition({ otherApplicantCount: 2.9, status: "NEW" })!.label,
    ).toBe("Nog 2 andere kandidaten");
  });
});
