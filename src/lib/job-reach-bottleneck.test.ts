import { describe, expect, it } from "vitest";
import { REACH_MIN_SCORE, REACH_STRONG_SCORE } from "@/lib/job-reach";
import {
  categorizeReachGap,
  summarizeReachBottleneck,
  type ReachBottleneckCandidate,
  type ReachGapCategory,
} from "@/lib/job-reach-bottleneck";

function cand(
  score: number,
  topGapLabel: string | null,
  available = false,
): ReachBottleneckCandidate {
  return { score, available, topGapLabel };
}

describe("categorizeReachGap", () => {
  const cases: [string, ReachGapCategory | null][] = [
    ["Mist vereist certificaat", "credential"],
    ["Vereist certificaat is verlopen", "credential"],
    ["Certificaat in beoordeling", "credential"],
    ["Mist 2 van 3 vereiste skills", "skills"],
    ["Tarief ligt boven het budget", "rate"],
    ["Werkmodus sluit niet aan", "workMode"],
    ["Verder dan je max. reistijd (ca. 55 min)", "travel"],
    ["Andere branche dan jouw profiel", "branche"],
    ["Momenteel niet beschikbaar", "availability"],
    ["Iets onbekends", null],
  ];
  it.each(cases)("categoriseert %s → %s", (label, expected) => {
    expect(categorizeReachGap(label)).toBe(expected);
  });

  it("kiest certificaat vóór de generieke skills-check", () => {
    // Beide substrings zouden kunnen matchen; de certificaat-check gaat voor.
    expect(categorizeReachGap("Mist vereist certificaat")).toBe("credential");
  });
});

describe("summarizeReachBottleneck", () => {
  it("geeft null bij een lege pool", () => {
    expect(summarizeReachBottleneck([])).toBeNull();
  });

  it("negeert kandidaten onder de minimumscore", () => {
    const r = summarizeReachBottleneck([
      cand(REACH_MIN_SCORE - 1, "Tarief ligt boven het budget"),
      cand(10, "Tarief ligt boven het budget"),
    ]);
    expect(r).toBeNull();
  });

  it("negeert sterk-én-beschikbare kandidaten (die zijn al bereik)", () => {
    const r = summarizeReachBottleneck([
      cand(REACH_STRONG_SCORE, "Tarief ligt boven het budget", true),
      cand(REACH_STRONG_SCORE + 5, "Tarief ligt boven het budget", true),
    ]);
    expect(r).toBeNull();
  });

  it("claimt niet op een enkeling (count < 2 → null)", () => {
    const r = summarizeReachBottleneck([cand(60, "Tarief ligt boven het budget")]);
    expect(r).toBeNull();
  });

  it("vindt de meest voorkomende drempel met telling en poolgrootte", () => {
    const r = summarizeReachBottleneck([
      cand(60, "Tarief ligt boven het budget"),
      cand(65, "Tarief ligt boven het budget"),
      cand(55, "Mist 1 van 2 vereiste skills"),
    ]);
    expect(r).not.toBeNull();
    expect(r!.category).toBe("rate");
    expect(r!.count).toBe(2);
    expect(r!.poolSize).toBe(3);
    expect(r!.label).toBe("Tarief boven budget");
    expect(r!.hint).toContain("2 passende ZZP'ers");
  });

  it("telt sterke maar niet-beschikbare kandidaten mee in de conversie-pool", () => {
    const r = summarizeReachBottleneck([
      cand(REACH_STRONG_SCORE, "Momenteel niet beschikbaar", false),
      cand(REACH_STRONG_SCORE + 3, "Momenteel niet beschikbaar", false),
    ]);
    expect(r).not.toBeNull();
    expect(r!.category).toBe("availability");
    expect(r!.count).toBe(2);
  });

  it("breekt een gelijkspel op de vaste prioriteit (credential > rate)", () => {
    const r = summarizeReachBottleneck([
      cand(60, "Mist vereist certificaat"),
      cand(62, "Tarief ligt boven het budget"),
      cand(64, "Mist vereist certificaat"),
      cand(66, "Tarief ligt boven het budget"),
    ]);
    expect(r!.category).toBe("credential");
    expect(r!.count).toBe(2);
  });

  it("negeert kandidaten zonder minpunt of met een onbekend label", () => {
    const r = summarizeReachBottleneck([
      cand(60, null),
      cand(62, "Iets onbekends"),
      cand(64, "Werkmodus sluit niet aan"),
      cand(66, "Werkmodus sluit niet aan"),
    ]);
    expect(r!.category).toBe("workMode");
    expect(r!.count).toBe(2);
    expect(r!.poolSize).toBe(4);
  });

  it("gebruikt enkelvoud in de tip bij count 1 — n.v.t. want count<2 → null; plural bij ≥2", () => {
    const r = summarizeReachBottleneck([
      cand(60, "Andere branche dan jouw profiel"),
      cand(62, "Andere branche dan jouw profiel"),
    ]);
    expect(r!.hint).toContain("2 passende ZZP'ers");
  });
});
