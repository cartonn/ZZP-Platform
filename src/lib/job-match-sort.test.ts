import { describe, it, expect } from "vitest";
import { sortJobsByMatch, type ScoredJob } from "@/lib/job-match-sort";

const d = (iso: string) => new Date(iso);

describe("sortJobsByMatch", () => {
  it("sorteert hoogste matchscore eerst", () => {
    const input: ScoredJob<string>[] = [
      { job: "a", score: 40, publishedAt: d("2026-01-01") },
      { job: "b", score: 90, publishedAt: d("2026-01-01") },
      { job: "c", score: 65, publishedAt: d("2026-01-01") },
    ];
    expect(sortJobsByMatch(input)).toEqual(["b", "c", "a"]);
  });

  it("breekt gelijke score op nieuwste publicatie eerst", () => {
    const input: ScoredJob<string>[] = [
      { job: "oud", score: 80, publishedAt: d("2026-01-01") },
      { job: "nieuw", score: 80, publishedAt: d("2026-06-01") },
      { job: "midden", score: 80, publishedAt: d("2026-03-01") },
    ];
    expect(sortJobsByMatch(input)).toEqual(["nieuw", "midden", "oud"]);
  });

  it("plaatst een ontbrekende publicatiedatum achteraan bij gelijke score", () => {
    const input: ScoredJob<string>[] = [
      { job: "geen-datum", score: 50, publishedAt: null },
      { job: "wel-datum", score: 50, publishedAt: d("2026-01-01") },
    ];
    expect(sortJobsByMatch(input)).toEqual(["wel-datum", "geen-datum"]);
  });

  it("score wint van datum (een nieuwere lage match zakt onder een oudere hoge match)", () => {
    const input: ScoredJob<string>[] = [
      { job: "nieuw-laag", score: 30, publishedAt: d("2026-06-01") },
      { job: "oud-hoog", score: 95, publishedAt: d("2026-01-01") },
    ];
    expect(sortJobsByMatch(input)).toEqual(["oud-hoog", "nieuw-laag"]);
  });

  it("muteert de invoer niet", () => {
    const input: ScoredJob<string>[] = [
      { job: "a", score: 10, publishedAt: d("2026-01-01") },
      { job: "b", score: 20, publishedAt: d("2026-01-01") },
    ];
    const snapshot = input.map((s) => s.job);
    sortJobsByMatch(input);
    expect(input.map((s) => s.job)).toEqual(snapshot);
  });

  it("geeft een lege lijst terug voor lege invoer", () => {
    expect(sortJobsByMatch([])).toEqual([]);
  });
});
