import { describe, expect, it } from "vitest";
import { type JobMatch, topMatches } from "./recommendations";

const m = (jobId: string, score: number): JobMatch => ({
  jobId,
  title: jobId,
  companyName: "Co",
  score,
  compliance: "COMPLIANT",
  availability: "AVAILABLE",
});

describe("topMatches", () => {
  it("filtert opdrachten onder de drempel weg", () => {
    const out = topMatches([m("a", 80), m("b", 50), m("c", 69)], { minScore: 70, limit: 10 });
    expect(out.map((x) => x.jobId)).toEqual(["a"]);
  });

  it("sorteert aflopend op score en begrenst op limit", () => {
    const out = topMatches([m("a", 72), m("b", 95), m("c", 88), m("d", 100)], {
      minScore: 70,
      limit: 2,
    });
    expect(out.map((x) => x.jobId)).toEqual(["d", "b"]);
  });

  it("geeft lege lijst als niets de drempel haalt", () => {
    expect(topMatches([m("a", 10), m("b", 69)], { minScore: 70, limit: 4 })).toEqual([]);
  });

  it("draagt de beschikbaarheidsstatus mee door de rangschikking", () => {
    const out = topMatches([{ ...m("a", 80), availability: "LIMITED" }], { minScore: 70, limit: 10 });
    expect(out.map((x) => x.availability)).toEqual(["LIMITED"]);
  });
});
