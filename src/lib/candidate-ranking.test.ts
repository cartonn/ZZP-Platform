import { describe, expect, it } from "vitest";
import { type CompareCandidate } from "@/lib/candidate-compare";
import {
  RECOMMENDATION_MARGIN,
  overallCandidateScore,
  rankCandidates,
} from "@/lib/candidate-ranking";

function candidate(overrides: Partial<CompareCandidate> & { id: string }): CompareCandidate {
  return {
    name: overrides.id,
    matchScore: null,
    proposedRate: null,
    trustLevel: "BASIS",
    complianceStatus: null,
    firstTimeRightRate: null,
    available: true,
    ...overrides,
  };
}

describe("overallCandidateScore", () => {
  it("is een gewogen gemiddelde over de aanwezige dimensies (0–100)", () => {
    // Alle dimensies maximaal → 100.
    const perfect = candidate({
      id: "a",
      matchScore: 100,
      complianceStatus: "COMPLIANT",
      trustLevel: "VOLLEDIG",
      firstTimeRightRate: 100,
      reviewRating: { average: 5, count: 4 },
      startFit: "available",
      proximity: { level: "near", minutes: 10 },
    });
    expect(overallCandidateScore(perfect)).toBe(100);
  });

  it("straft een kandidaat niet voor ontbrekende dimensies (noemer krimpt mee)", () => {
    // Alleen trust bekend (VOLLEDIG = 1) → score 100 ondanks alle andere velden null.
    const onlyTrust = candidate({ id: "a", trustLevel: "VOLLEDIG" });
    expect(overallCandidateScore(onlyTrust)).toBe(100);
    const onlyTrustBasis = candidate({ id: "b", trustLevel: "BASIS" });
    expect(overallCandidateScore(onlyTrustBasis)).toBe(0);
  });

  it("weegt match zwaarder dan trust", () => {
    const highMatch = candidate({ id: "a", matchScore: 100, trustLevel: "BASIS" });
    const highTrust = candidate({ id: "b", matchScore: 0, trustLevel: "VOLLEDIG" });
    expect(overallCandidateScore(highMatch)).toBeGreaterThan(overallCandidateScore(highTrust));
  });
});

describe("rankCandidates", () => {
  it("geeft een lege ranking bij minder dan twee kandidaten", () => {
    expect(rankCandidates([]).recommendedId).toBeNull();
    expect(rankCandidates([candidate({ id: "solo" })]).ordered).toEqual([]);
  });

  it("rangschikt aflopend op totaalscore en beveelt een duidelijke koploper aan", () => {
    const strong = candidate({
      id: "strong",
      name: "Sanne",
      matchScore: 95,
      complianceStatus: "COMPLIANT",
      trustLevel: "VOLLEDIG",
    });
    const weak = candidate({ id: "weak", name: "Tom", matchScore: 40, trustLevel: "BASIS" });
    const r = rankCandidates([weak, strong]);
    expect(r.ordered.map((o) => o.id)).toEqual(["strong", "weak"]);
    expect(r.recommendedId).toBe("strong");
    expect(r.recommendedName).toBe("Sanne");
    expect(r.reasons).toContain("hoogste match");
    expect(r.reasons).toContain("voldoet aan de eisen");
    expect(r.reasons.length).toBeLessThanOrEqual(3);
  });

  it("beveelt niets aan bij een te kleine voorsprong (gelijke stand)", () => {
    const a = candidate({ id: "a", matchScore: 80, trustLevel: "DEELS" });
    const b = candidate({ id: "b", matchScore: 80, trustLevel: "DEELS" });
    const r = rankCandidates([a, b]);
    expect(r.recommendedId).toBeNull();
    // De ranglijst blijft wel zichtbaar.
    expect(r.ordered).toHaveLength(2);
    expect(Math.abs(r.scoreById.a! - r.scoreById.b!)).toBeLessThan(RECOMMENDATION_MARGIN);
  });

  it("kroont nooit een NON_COMPLIANT koploper, ook niet bij de hoogste score", () => {
    const bestButNonCompliant = candidate({
      id: "risky",
      matchScore: 100,
      complianceStatus: "NON_COMPLIANT",
      trustLevel: "VOLLEDIG",
      firstTimeRightRate: 100,
      reviewRating: { average: 5, count: 4 },
    });
    const compliant = candidate({
      id: "safe",
      matchScore: 50,
      complianceStatus: "COMPLIANT",
      trustLevel: "BASIS",
    });
    const r = rankCandidates([bestButNonCompliant, compliant]);
    // Non-compliant staat met afstand bovenaan op score, maar wordt niet aanbevolen.
    expect(r.ordered[0]!.id).toBe("risky");
    expect(r.scoreById.risky! - r.scoreById.safe!).toBeGreaterThanOrEqual(RECOMMENDATION_MARGIN);
    expect(r.recommendedId).toBeNull();
  });

  it("noemt 'eerder met jou samengewerkt' als reden wanneer van toepassing", () => {
    const rehire = candidate({
      id: "rehire",
      matchScore: 90,
      complianceStatus: "COMPLIANT",
      trustLevel: "VOLLEDIG",
      sharedHistory: { count: 2, lastCompletedAt: new Date("2026-01-01") },
    });
    const other = candidate({ id: "other", matchScore: 45, trustLevel: "BASIS" });
    const r = rankCandidates([other, rehire]);
    expect(r.recommendedId).toBe("rehire");
    expect(r.reasons).toContain("eerder met jou samengewerkt");
  });

  it("breekt gelijke scores deterministisch (match, dan naam)", () => {
    const a = candidate({ id: "a", name: "Zoë", matchScore: 70, trustLevel: "DEELS" });
    const b = candidate({ id: "b", name: "Anne", matchScore: 70, trustLevel: "DEELS" });
    const r = rankCandidates([a, b]);
    // Gelijke score én match → naam alfabetisch: Anne vóór Zoë.
    expect(r.ordered.map((o) => o.id)).toEqual(["b", "a"]);
  });
});
