import { describe, expect, it } from "vitest";
import { type FreelancerSuggestion, topSuggestions } from "./suggestions";

const s = (freelancerId: string, score: number): FreelancerSuggestion => ({
  freelancerId,
  name: freelancerId,
  score,
  compliance: "COMPLIANT",
  trustLevel: "BASIS",
});

describe("topSuggestions", () => {
  it("filtert ZZP'ers onder de drempel weg", () => {
    const out = topSuggestions([s("a", 80), s("b", 50), s("c", 69)], { minScore: 70, limit: 10 });
    expect(out.map((x) => x.freelancerId)).toEqual(["a"]);
  });

  it("sorteert aflopend op score en begrenst op limit", () => {
    const out = topSuggestions([s("a", 72), s("b", 95), s("c", 88), s("d", 100)], { minScore: 70, limit: 2 });
    expect(out.map((x) => x.freelancerId)).toEqual(["d", "b"]);
  });

  it("geeft een lege lijst als niets de drempel haalt", () => {
    expect(topSuggestions([s("a", 10), s("b", 69)], { minScore: 70, limit: 4 })).toEqual([]);
  });
});
