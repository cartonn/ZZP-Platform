import { describe, expect, it } from "vitest";
import {
  type CompareCandidate,
  buildCandidateComparison,
  pickUniqueBest,
} from "./candidate-compare";

function candidate(over: Partial<CompareCandidate> & { id: string }): CompareCandidate {
  return {
    name: over.id,
    matchScore: null,
    proposedRate: null,
    trustLevel: "BASIS",
    complianceStatus: null,
    firstTimeRightRate: null,
    available: false,
    ...over,
  };
}

describe("pickUniqueBest", () => {
  it("kiest de uniek hoogste score", () => {
    const cs = [candidate({ id: "a", matchScore: 60 }), candidate({ id: "b", matchScore: 80 })];
    expect(pickUniqueBest(cs, (c) => c.matchScore)).toBe("b");
  });

  it("geeft null bij gelijkspel op de top", () => {
    const cs = [candidate({ id: "a", matchScore: 80 }), candidate({ id: "b", matchScore: 80 })];
    expect(pickUniqueBest(cs, (c) => c.matchScore)).toBeNull();
  });

  it("negeert kandidaten zonder score (null)", () => {
    const cs = [
      candidate({ id: "a", matchScore: null }),
      candidate({ id: "b", matchScore: 50 }),
      candidate({ id: "c", matchScore: null }),
    ];
    expect(pickUniqueBest(cs, (c) => c.matchScore)).toBe("b");
  });

  it("geeft null als niemand een score heeft", () => {
    const cs = [candidate({ id: "a" }), candidate({ id: "b" })];
    expect(pickUniqueBest(cs, (c) => c.matchScore)).toBeNull();
  });
});

describe("buildCandidateComparison", () => {
  it("behoudt de kandidaat-volgorde en muteert de invoer niet", () => {
    const input = [candidate({ id: "a" }), candidate({ id: "b" })];
    const result = buildCandidateComparison(input);
    expect(result.candidates.map((c) => c.id)).toEqual(["a", "b"]);
    expect(result.candidates).not.toBe(input);
  });

  it("scherpste tarief = het laagste bekende tarief", () => {
    const cs = [
      candidate({ id: "a", proposedRate: 75 }),
      candidate({ id: "b", proposedRate: 60 }),
      candidate({ id: "c", proposedRate: null }),
    ];
    expect(buildCandidateComparison(cs).bestRateId).toBe("b");
  });

  it("hoogste vertrouwen wint, gelijkspel geeft geen winnaar", () => {
    const win = buildCandidateComparison([
      candidate({ id: "a", trustLevel: "DEELS" }),
      candidate({ id: "b", trustLevel: "VOLLEDIG" }),
    ]);
    expect(win.bestTrustId).toBe("b");
    const tie = buildCandidateComparison([
      candidate({ id: "a", trustLevel: "VOLLEDIG" }),
      candidate({ id: "b", trustLevel: "VOLLEDIG" }),
    ]);
    expect(tie.bestTrustId).toBeNull();
  });

  it("sterkste compliance wint; opdracht zonder vereisten levert geen compliance-winnaar", () => {
    const ranked = buildCandidateComparison([
      candidate({ id: "a", complianceStatus: "WARNING" }),
      candidate({ id: "b", complianceStatus: "COMPLIANT" }),
    ]);
    expect(ranked.bestComplianceId).toBe("b");
    const none = buildCandidateComparison([
      candidate({ id: "a", complianceStatus: null }),
      candidate({ id: "b", complianceStatus: null }),
    ]);
    expect(none.bestComplianceId).toBeNull();
  });

  it("hoogste leverbetrouwbaarheid wint; te kleine steekproef (null) doet niet mee", () => {
    const result = buildCandidateComparison([
      candidate({ id: "a", firstTimeRightRate: 80 }),
      candidate({ id: "b", firstTimeRightRate: null }),
      candidate({ id: "c", firstTimeRightRate: 95 }),
    ]);
    expect(result.bestDeliveryId).toBe("c");
  });

  it("één kandidaat → alle winnaars null (niets te vergelijken)", () => {
    const result = buildCandidateComparison([candidate({ id: "a", matchScore: 90 })]);
    expect(result.bestMatchId).toBeNull();
    expect(result.bestTrustId).toBeNull();
  });

  it("combineert de dimensies onafhankelijk", () => {
    const result = buildCandidateComparison([
      candidate({
        id: "a",
        matchScore: 90,
        proposedRate: 80,
        trustLevel: "BASIS",
        complianceStatus: "COMPLIANT",
        firstTimeRightRate: 70,
      }),
      candidate({
        id: "b",
        matchScore: 70,
        proposedRate: 65,
        trustLevel: "VOLLEDIG",
        complianceStatus: "WARNING",
        firstTimeRightRate: 95,
      }),
    ]);
    expect(result.bestMatchId).toBe("a");
    expect(result.bestRateId).toBe("b");
    expect(result.bestTrustId).toBe("b");
    expect(result.bestComplianceId).toBe("a");
    expect(result.bestDeliveryId).toBe("b");
  });
});
