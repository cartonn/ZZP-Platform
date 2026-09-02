import { describe, it, expect } from "vitest";
import {
  rankDbaLevel,
  sortDbaRows,
  summarizeDbaOverview,
  type DbaOverviewRow,
} from "./dba-overview";
import type { DbaAssessment, DbaSignalLevel } from "./dba-monitor";
import { DBA_DISCLAIMER } from "./config";

// Maak een minimale fixture-assessment met alleen de velden die de helpers gebruiken.
function makeAssessment(level: DbaSignalLevel, durationMonths: number | null): DbaAssessment {
  return {
    collaborationId: "collab-test",
    durationMonths,
    level,
    signals: [],
    disclaimer: DBA_DISCLAIMER,
  };
}

// Maak een minimale fixture-row.
function makeRow(id: string, level: DbaSignalLevel, durationMonths: number | null): DbaOverviewRow {
  return {
    collaborationId: id,
    jobTitle: `Job ${id}`,
    companyName: `Bedrijf ${id}`,
    freelancerName: `ZZP'er ${id}`,
    startDate: null,
    relationshipStartDate: null,
    bridgedPriorPlacements: 0,
    assessment: makeAssessment(level, durationMonths),
  };
}

// ---------------------------------------------------------------------------
// rankDbaLevel
// ---------------------------------------------------------------------------
describe("rankDbaLevel", () => {
  it("geeft HOOG de laagste rang (0)", () => {
    expect(rankDbaLevel("HOOG")).toBe(0);
  });

  it("geeft VERHOOGD rang 1", () => {
    expect(rankDbaLevel("VERHOOGD")).toBe(1);
  });

  it("geeft LAAG de hoogste rang (2)", () => {
    expect(rankDbaLevel("LAAG")).toBe(2);
  });

  it("HOOG < VERHOOGD < LAAG (numerieke volgorde)", () => {
    expect(rankDbaLevel("HOOG")).toBeLessThan(rankDbaLevel("VERHOOGD"));
    expect(rankDbaLevel("VERHOOGD")).toBeLessThan(rankDbaLevel("LAAG"));
  });
});

// ---------------------------------------------------------------------------
// sortDbaRows
// ---------------------------------------------------------------------------
describe("sortDbaRows", () => {
  it("sorteert HOOG vóór VERHOOGD vóór LAAG", () => {
    const rows = [makeRow("a", "LAAG", 3), makeRow("b", "HOOG", 3), makeRow("c", "VERHOOGD", 3)];
    const sorted = sortDbaRows(rows);
    expect(sorted.map((r) => r.assessment.level)).toEqual(["HOOG", "VERHOOGD", "LAAG"]);
  });

  it("sorteert bij gelijk niveau langste duur eerst", () => {
    const rows = [
      makeRow("a", "VERHOOGD", 4),
      makeRow("b", "VERHOOGD", 12),
      makeRow("c", "VERHOOGD", 7),
    ];
    const sorted = sortDbaRows(rows);
    expect(sorted.map((r) => r.assessment.durationMonths)).toEqual([12, 7, 4]);
  });

  it("behandelt null durationMonths als 0 bij sortering", () => {
    const rows = [makeRow("a", "LAAG", null), makeRow("b", "LAAG", 5), makeRow("c", "LAAG", 0)];
    const sorted = sortDbaRows(rows);
    // Langste duur eerst: 5, dan 0 en null (beide 0) — volgorde 0/null onderling willekeurig maar
    // row "b" moet als eerste staan.
    expect(sorted.at(0)?.collaborationId).toBe("b");
  });

  it("combineert niveau- en duurssortering", () => {
    const rows = [
      makeRow("a", "LAAG", 20),
      makeRow("b", "HOOG", 3),
      makeRow("c", "VERHOOGD", 10),
      makeRow("d", "HOOG", 8),
    ];
    const sorted = sortDbaRows(rows);
    expect(sorted.at(0)?.collaborationId).toBe("d"); // HOOG, 8 maanden
    expect(sorted.at(1)?.collaborationId).toBe("b"); // HOOG, 3 maanden
    expect(sorted.at(2)?.collaborationId).toBe("c"); // VERHOOGD, 10 maanden
    expect(sorted.at(3)?.collaborationId).toBe("a"); // LAAG, 20 maanden
  });

  it("geeft lege array terug voor lege invoer", () => {
    expect(sortDbaRows([])).toEqual([]);
  });

  it("muteert de originele array niet", () => {
    const rows = [makeRow("a", "LAAG", 5), makeRow("b", "HOOG", 2)];
    sortDbaRows(rows);
    // Originele volgorde ongewijzigd: "a" op index 0, "b" op index 1.
    expect(rows.at(0)?.collaborationId).toBe("a");
    expect(rows.at(1)?.collaborationId).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// summarizeDbaOverview
// ---------------------------------------------------------------------------
describe("summarizeDbaOverview", () => {
  it("telt total correct", () => {
    const rows = [makeRow("a", "HOOG", 3), makeRow("b", "VERHOOGD", 2), makeRow("c", "LAAG", 1)];
    expect(summarizeDbaOverview(rows).total).toBe(3);
  });

  it("telt byLevel correct", () => {
    const rows = [
      makeRow("a", "HOOG", 3),
      makeRow("b", "HOOG", 2),
      makeRow("c", "VERHOOGD", 1),
      makeRow("d", "LAAG", 1),
    ];
    const summary = summarizeDbaOverview(rows);
    expect(summary.byLevel.HOOG).toBe(2);
    expect(summary.byLevel.VERHOOGD).toBe(1);
    expect(summary.byLevel.LAAG).toBe(1);
  });

  it("alle drie niveaus aanwezig (ook 0) bij lege lijst", () => {
    const summary = summarizeDbaOverview([]);
    expect(summary.total).toBe(0);
    expect(summary.byLevel).toHaveProperty("HOOG", 0);
    expect(summary.byLevel).toHaveProperty("VERHOOGD", 0);
    expect(summary.byLevel).toHaveProperty("LAAG", 0);
  });

  it("alle drie niveaus aanwezig (ook 0) als niet alle niveaus voorkomen", () => {
    const rows = [makeRow("a", "HOOG", 5)];
    const summary = summarizeDbaOverview(rows);
    expect(summary.byLevel.HOOG).toBe(1);
    expect(summary.byLevel.VERHOOGD).toBe(0);
    expect(summary.byLevel.LAAG).toBe(0);
  });
});
