import { describe, expect, it } from "vitest";
import {
  computePoolCoverageGap,
  poolCoverageGapHeadline,
  type CoverageDemandRow,
  type CoverageSupplyRow,
} from "./pool-coverage-gap";

function demand(
  kind: CoverageDemandRow["kind"],
  key: string,
  label: string,
  dienstId: string,
): CoverageDemandRow {
  return { kind, key, label, dienstId };
}

function supply(
  kind: CoverageSupplyRow["kind"],
  key: string,
  freelancerId: string,
): CoverageSupplyRow {
  return { kind, key, freelancerId };
}

describe("computePoolCoverageGap", () => {
  it("geeft geen gaten bij lege vraag", () => {
    const result = computePoolCoverageGap([], [supply("credential", "BIG", "f1")]);
    expect(result.gaps).toEqual([]);
    expect(result.criticalCount).toBe(0);
  });

  it("markeert een hard gat (severity none) wanneer niemand in de pool het levert", () => {
    const result = computePoolCoverageGap(
      [
        demand("credential", "BIG", "BIG-registratie", "d1"),
        demand("credential", "BIG", "BIG-registratie", "d2"),
        demand("credential", "BIG", "BIG-registratie", "d3"),
      ],
      [supply("credential", "VOG", "f1")], // wel aanbod, maar van een ander type
    );
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0]).toMatchObject({
      kind: "credential",
      key: "BIG",
      openDienstCount: 3,
      qualifiedInPool: 0,
      severity: "none",
    });
    expect(result.criticalCount).toBe(1);
  });

  it("markeert schaarste (severity scarce) wanneer aanbod kleiner is dan de vraag", () => {
    const result = computePoolCoverageGap(
      [
        demand("skill", "s1", "IC-verpleegkunde", "d1"),
        demand("skill", "s1", "IC-verpleegkunde", "d2"),
        demand("skill", "s1", "IC-verpleegkunde", "d3"),
      ],
      [supply("skill", "s1", "f1"), supply("skill", "s1", "f2")],
    );
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0]).toMatchObject({
      openDienstCount: 3,
      qualifiedInPool: 2,
      severity: "scarce",
    });
    expect(result.criticalCount).toBe(0);
  });

  it("geen gat bij volle dekking (aanbod ≥ vraag)", () => {
    const result = computePoolCoverageGap(
      [demand("credential", "VOG", "VOG", "d1")],
      [supply("credential", "VOG", "f1"), supply("credential", "VOG", "f2")],
    );
    expect(result.gaps).toEqual([]);
  });

  it("telt distinct diensten en distinct vakmensen (dedup)", () => {
    const result = computePoolCoverageGap(
      [
        demand("credential", "BIG", "BIG", "d1"),
        demand("credential", "BIG", "BIG", "d1"), // dubbele dienst
        demand("credential", "BIG", "BIG", "d2"),
      ],
      [
        supply("credential", "BIG", "f1"),
        supply("credential", "BIG", "f1"), // dubbele vakmens (bv. twee geldige certificaten)
      ],
    );
    expect(result.gaps[0]).toMatchObject({
      openDienstCount: 2,
      qualifiedInPool: 1,
      severity: "scarce",
    });
  });

  it("houdt certificaat en vaardigheid met dezelfde sleutel gescheiden", () => {
    const result = computePoolCoverageGap(
      [demand("credential", "x", "Cert X", "d1"), demand("skill", "x", "Skill X", "d1")],
      [supply("credential", "x", "f1")], // dekt alleen de credential-variant
    );
    // credential x: dekking 1 ≥ 1 → geen gat; skill x: 0 aanbod → hard gat
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0]).toMatchObject({ kind: "skill", key: "x", severity: "none" });
  });

  it("sorteert harde gaten eerst, dan op meeste open diensten", () => {
    const result = computePoolCoverageGap(
      [
        // scarce, veel diensten
        demand("skill", "scarce", "Scarce", "d1"),
        demand("skill", "scarce", "Scarce", "d2"),
        demand("skill", "scarce", "Scarce", "d3"),
        // hard gat, minder diensten
        demand("credential", "hard", "Hard", "d1"),
      ],
      [supply("skill", "scarce", "f1"), supply("skill", "scarce", "f2")],
    );
    expect(result.gaps.map((g) => g.key)).toEqual(["hard", "scarce"]);
  });

  it("sorteert bij gelijke severity op meeste open diensten, dan minste aanbod", () => {
    const result = computePoolCoverageGap(
      [
        demand("skill", "a", "A", "d1"),
        demand("skill", "a", "A", "d2"),
        demand("skill", "b", "B", "d1"),
        demand("skill", "b", "B", "d2"),
        demand("skill", "b", "B", "d3"),
      ],
      [supply("skill", "a", "f1"), supply("skill", "b", "f1")],
    );
    // b heeft meer open diensten (3) dan a (2) → b eerst
    expect(result.gaps.map((g) => g.key)).toEqual(["b", "a"]);
  });
});

describe("poolCoverageGapHeadline", () => {
  it("null bij geen gaten", () => {
    expect(poolCoverageGapHeadline({ gaps: [], criticalCount: 0 })).toBeNull();
  });

  it("harde-gat-kop bij criticalCount > 0", () => {
    const result = computePoolCoverageGap([demand("credential", "BIG", "BIG", "d1")], []);
    const headline = poolCoverageGapHeadline(result);
    expect(headline).toContain("niemand in je pool");
  });

  it("schaarste-kop wanneer er alleen scarce gaten zijn", () => {
    const result = computePoolCoverageGap(
      [demand("skill", "s1", "S1", "d1"), demand("skill", "s1", "S1", "d2")],
      [supply("skill", "s1", "f1")],
    );
    const headline = poolCoverageGapHeadline(result);
    expect(headline).toContain("te weinig gekwalificeerde vakmensen");
  });
});
