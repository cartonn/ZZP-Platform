import { describe, expect, it } from "vitest";
import { excludeAndLimit, type JobMatch, topMatches } from "./recommendations";

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
    const out = topMatches([{ ...m("a", 80), availability: "LIMITED" }], {
      minScore: 70,
      limit: 10,
    });
    expect(out.map((x) => x.availability)).toEqual(["LIMITED"]);
  });
});

describe("excludeAndLimit", () => {
  it("sluit de bekeken opdracht uit en behoudt de volgorde", () => {
    const out = excludeAndLimit([m("a", 90), m("b", 85), m("c", 80)], "b", 3);
    expect(out.map((x) => x.jobId)).toEqual(["a", "c"]);
  });

  it("begrenst op limit ná het uitsluiten", () => {
    const out = excludeAndLimit([m("a", 90), m("b", 85), m("c", 80), m("d", 75)], "a", 2);
    expect(out.map((x) => x.jobId)).toEqual(["b", "c"]);
  });

  it("is een no-op wanneer de uit te sluiten opdracht ontbreekt", () => {
    const out = excludeAndLimit([m("a", 90), m("b", 85)], "zzz", 5);
    expect(out.map((x) => x.jobId)).toEqual(["a", "b"]);
  });

  it("geeft een lege lijst voor een lege invoer", () => {
    expect(excludeAndLimit([], "a", 3)).toEqual([]);
  });
});
