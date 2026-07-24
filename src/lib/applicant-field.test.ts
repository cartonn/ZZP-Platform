import { describe, expect, it } from "vitest";
import { summarizeApplicantField, type FieldCandidate } from "@/lib/applicant-field";

function cand(overrides: Partial<FieldCandidate> = {}): FieldCandidate {
  return {
    matchScore: 70,
    complianceStatus: "COMPLIANT",
    startFit: "available",
    ...overrides,
  };
}

describe("summarizeApplicantField", () => {
  it("geeft null bij minder dan twee kandidaten", () => {
    expect(summarizeApplicantField([])).toBeNull();
    expect(summarizeApplicantField([cand()])).toBeNull();
  });

  it("telt het totaal ongeacht de deelmaten", () => {
    const s = summarizeApplicantField([cand(), cand(), cand()]);
    expect(s?.total).toBe(3);
  });

  it("berekent mediaan/min/max over kandidaten mét een score (oneven aantal)", () => {
    const s = summarizeApplicantField([
      cand({ matchScore: 40 }),
      cand({ matchScore: 90 }),
      cand({ matchScore: 60 }),
    ]);
    expect(s?.match).toEqual({ median: 60, min: 40, max: 90, count: 3 });
  });

  it("mediaan bij even aantal = gemiddelde van de twee middelste, afgerond", () => {
    const s = summarizeApplicantField([
      cand({ matchScore: 50 }),
      cand({ matchScore: 61 }),
      cand({ matchScore: 70 }),
      cand({ matchScore: 80 }),
    ]);
    // middelste twee = 61 en 70 → 65.5 → afgerond 66
    expect(s?.match?.median).toBe(66);
    expect(s?.match?.min).toBe(50);
    expect(s?.match?.max).toBe(80);
  });

  it("negeert kandidaten zonder score in de spreiding (eigen noemer)", () => {
    const s = summarizeApplicantField([
      cand({ matchScore: 80 }),
      cand({ matchScore: null }),
      cand({ matchScore: 60 }),
    ]);
    expect(s?.match).toEqual({ median: 70, min: 60, max: 80, count: 2 });
  });

  it("geeft match=null als geen enkele kandidaat een score heeft", () => {
    const s = summarizeApplicantField([cand({ matchScore: null }), cand({ matchScore: null })]);
    expect(s?.match).toBeNull();
    expect(s?.total).toBe(2);
  });

  it("telt volledig compliant t.o.v. de kandidaten mét een oordeel", () => {
    const s = summarizeApplicantField([
      cand({ complianceStatus: "COMPLIANT" }),
      cand({ complianceStatus: "WARNING" }),
      cand({ complianceStatus: "NON_COMPLIANT" }),
      cand({ complianceStatus: null }),
    ]);
    expect(s?.compliant).toEqual({ count: 1, known: 3 });
  });

  it("geeft compliant=null als de opdracht geen certificaten eist (alle statussen null)", () => {
    const s = summarizeApplicantField([
      cand({ complianceStatus: null }),
      cand({ complianceStatus: null }),
    ]);
    expect(s?.compliant).toBeNull();
  });

  it("telt beschikbaar-op-startdatum alleen als 'available' (limited telt niet mee)", () => {
    const s = summarizeApplicantField([
      cand({ startFit: "available" }),
      cand({ startFit: "limited" }),
      cand({ startFit: "blocked" }),
    ]);
    expect(s?.availableOnStart).toEqual({ count: 1, known: 3 });
  });

  it("negeert unknown/ontbrekende startFit in de start-noemer", () => {
    const s = summarizeApplicantField([
      cand({ startFit: "available" }),
      cand({ startFit: "unknown" }),
      cand({ startFit: undefined }),
    ]);
    expect(s?.availableOnStart).toEqual({ count: 1, known: 1 });
  });

  it("geeft availableOnStart=null als geen enkele kandidaat een start-oordeel heeft", () => {
    const s = summarizeApplicantField([
      cand({ startFit: "unknown" }),
      cand({ startFit: undefined }),
    ]);
    expect(s?.availableOnStart).toBeNull();
  });
});
