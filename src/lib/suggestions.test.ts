import { describe, expect, it } from "vitest";
import {
  type ClientFreelancerSuggestion,
  type FreelancerSuggestion,
  mergeClientSuggestions,
  topSuggestions,
} from "./suggestions";

const s = (freelancerId: string, score: number): FreelancerSuggestion => ({
  freelancerId,
  name: freelancerId,
  score,
  compliance: "COMPLIANT",
  trustLevel: "BASIS",
  availability: "AVAILABLE",
});

const cs = (
  freelancerId: string,
  score: number,
  jobId: string,
  relatedness?: number,
): ClientFreelancerSuggestion => ({
  freelancerId,
  name: freelancerId,
  score,
  compliance: "COMPLIANT",
  trustLevel: "BASIS",
  availability: "AVAILABLE",
  jobId,
  jobTitle: `Opdracht ${jobId}`,
  ...(relatedness !== undefined ? { relatedness } : {}),
});

describe("topSuggestions", () => {
  it("filtert ZZP'ers onder de drempel weg", () => {
    const out = topSuggestions([s("a", 80), s("b", 50), s("c", 69)], { minScore: 70, limit: 10 });
    expect(out.map((x) => x.freelancerId)).toEqual(["a"]);
  });

  it("sorteert aflopend op score en begrenst op limit", () => {
    const out = topSuggestions([s("a", 72), s("b", 95), s("c", 88), s("d", 100)], {
      minScore: 70,
      limit: 2,
    });
    expect(out.map((x) => x.freelancerId)).toEqual(["d", "b"]);
  });

  it("geeft een lege lijst als niets de drempel haalt", () => {
    expect(topSuggestions([s("a", 10), s("b", 69)], { minScore: 70, limit: 4 })).toEqual([]);
  });

  it("draagt het beschikbaarheidsstatusveld ongewijzigd mee", () => {
    const out = topSuggestions([{ ...s("a", 80), availability: "LIMITED" }], {
      minScore: 70,
      limit: 10,
    });
    expect(out[0]?.availability).toBe("LIMITED");
  });
});

describe("mergeClientSuggestions", () => {
  it("dedupeert dezelfde freelancerId over twee opdrachten en houdt de hoogst scorende", () => {
    const list: ClientFreelancerSuggestion[] = [
      cs("freelancer-1", 80, "job-a"),
      cs("freelancer-1", 92, "job-b"),
    ];
    const out = mergeClientSuggestions(list, { limit: 10 });
    expect(out).toHaveLength(1);
    expect(out[0]?.freelancerId).toBe("freelancer-1");
    expect(out[0]?.score).toBe(92);
    expect(out[0]?.jobId).toBe("job-b");
  });

  it("sorteert aflopend op score en respecteert het limiet", () => {
    const list: ClientFreelancerSuggestion[] = [
      cs("f1", 70, "job-a"),
      cs("f2", 95, "job-a"),
      cs("f3", 88, "job-b"),
      cs("f4", 100, "job-b"),
    ];
    const out = mergeClientSuggestions(list, { limit: 2 });
    expect(out.map((x) => x.freelancerId)).toEqual(["f4", "f2"]);
  });

  it("breekt een gelijke score af op relatedness (hoogste wint)", () => {
    const list: ClientFreelancerSuggestion[] = [
      cs("f1", 85, "job-a", 0.2),
      cs("f1", 85, "job-b", 0.6),
      cs("f2", 85, "job-c", 0.4),
    ];
    const out = mergeClientSuggestions(list, { limit: 10 });
    // f1 deduped: job-b wins (relatedness 0.6 > 0.2)
    expect(out).toHaveLength(2);
    const f1 = out.find((x) => x.freelancerId === "f1");
    expect(f1?.jobId).toBe("job-b");
    expect(f1?.relatedness).toBe(0.6);
    // f2 has relatedness 0.4, f1 has 0.6 → f1 sorts first
    expect(out[0]?.freelancerId).toBe("f1");
    expect(out[1]?.freelancerId).toBe("f2");
  });
});
