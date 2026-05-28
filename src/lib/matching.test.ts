import { describe, expect, it } from "vitest";
import {
  computeCompliance,
  computeMatchScore,
  type FreelancerCredential,
  type MatchInput,
} from "@/lib/matching";

const now = new Date("2026-05-25T12:00:00Z");
const past = new Date("2026-01-01T00:00:00Z");
const future = new Date("2027-01-01T00:00:00Z");

describe("computeCompliance", () => {
  it("is COMPLIANT zonder vereisten", () => {
    expect(computeCompliance([], [], now).status).toBe("COMPLIANT");
  });

  it("is COMPLIANT als alle vereisten VERIFIED en geldig zijn", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "DIPLOMA", status: "VERIFIED", expiresAt: null },
    ];
    const r = computeCompliance(["VOG", "DIPLOMA"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.satisfied).toEqual(["VOG", "DIPLOMA"]);
    expect(r.missing).toEqual([]);
  });

  it("is NON_COMPLIANT bij ontbrekend vereist credential", () => {
    const r = computeCompliance(["VOG"], [], now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.missing).toEqual(["VOG"]);
  });

  it("is WARNING bij een verlopen vereist credential", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "VERIFIED", expiresAt: past }];
    const r = computeCompliance(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.expired).toEqual(["VOG"]);
  });

  it("is WARNING bij een credential in beoordeling", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "SUBMITTED" }];
    const r = computeCompliance(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.inReview).toEqual(["VOG"]);
  });

  it("prioriteert een geldig VERIFIED credential boven een verlopen exemplaar", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: past },
      { type: "VOG", status: "VERIFIED", expiresAt: future },
    ];
    const r = computeCompliance(["VOG"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.satisfied).toEqual(["VOG"]);
  });
});

describe("computeMatchScore", () => {
  const base: MatchInput = {
    requiredSkillIds: ["react", "ts"],
    optionalSkillIds: ["next"],
    freelancerSkillIds: ["react", "ts", "next"],
    requiredCredentialTypes: ["VOG"],
    credentials: [{ type: "VOG", status: "VERIFIED", expiresAt: future }],
    job: { rateMin: 60, rateMax: 90, workMode: "HYBRID", location: "Amsterdam" },
    freelancer: { hourlyRate: 75, workMode: "HYBRID", location: "Amsterdam" },
  };

  it("geeft een perfecte match ~100", () => {
    const r = computeMatchScore(base, now);
    expect(r.score).toBe(100);
    expect(r.compliance.status).toBe("COMPLIANT");
  });

  it("verlaagt de score bij ontbrekende vereiste skills", () => {
    const r = computeMatchScore({ ...base, freelancerSkillIds: ["next"] }, now);
    expect(r.score).toBeLessThan(100);
    expect(r.breakdown.skills).toBeLessThan(50);
  });

  it("trekt compliance-punten af bij ontbrekend vereist credential", () => {
    const r = computeMatchScore({ ...base, credentials: [] }, now);
    expect(r.compliance.status).toBe("NON_COMPLIANT");
    expect(r.breakdown.compliance).toBe(0);
  });

  it("blijft binnen 0-100", () => {
    const r = computeMatchScore(
      {
        ...base,
        freelancerSkillIds: [],
        credentials: [],
        freelancer: { hourlyRate: 500, workMode: "ONSITE", location: "Groningen" },
      },
      now,
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("straft een tarief ruim boven het maximum", () => {
    const cheap = computeMatchScore(base, now);
    const pricey = computeMatchScore(
      { ...base, freelancer: { ...base.freelancer, hourlyRate: 180 } },
      now,
    );
    expect(pricey.breakdown.rate).toBeLessThan(cheap.breakdown.rate);
  });

  it("geeft alleen positieve reasons bij een perfecte match", () => {
    const r = computeMatchScore(base, now);
    expect(r.reasons.every((re) => re.kind === "positive")).toBe(true);
    expect(r.reasons.map((re) => re.label)).toContain("Alle vereiste skills aanwezig");
    expect(r.reasons.map((re) => re.label)).toContain("Voldoet aan de certificaateisen");
    expect(r.reasons.map((re) => re.label)).toContain("Tarief past binnen het budget");
    expect(r.reasons.map((re) => re.label)).toContain("Werkmodus komt overeen");
  });

  it("geeft een gap-reason met correct X/Y bij ontbrekende vereiste skills", () => {
    const r = computeMatchScore({ ...base, freelancerSkillIds: ["react"] }, now);
    const gap = r.reasons.find((re) => re.kind === "gap" && re.label.includes("vereiste skills"));
    expect(gap).toBeDefined();
    // base has 2 required skills; freelancer has 1, so missing = 1 of 2
    expect(gap?.label).toBe("Mist 1 van 2 vereiste skills");
  });

  it("geeft een compliance gap-reason bij ontbrekend vereist credential", () => {
    const r = computeMatchScore({ ...base, credentials: [] }, now);
    const gap = r.reasons.find((re) => re.kind === "gap" && re.label.includes("certificaat"));
    expect(gap).toBeDefined();
    expect(gap?.label).toBe("Mist vereist certificaat");
  });
});
