import { describe, expect, it } from "vitest";
import {
  type CompareCandidate,
  buildCandidateComparison,
  exportCandidateComparisonCsv,
  isRateOverBudget,
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

  it("hoogste reputatie wint; kandidaat zonder beoordeling (count 0/null) doet niet mee", () => {
    const result = buildCandidateComparison([
      candidate({ id: "a", reviewRating: { average: 4.2, count: 3 } }),
      candidate({ id: "b", reviewRating: null }),
      candidate({ id: "c", reviewRating: { average: 4.8, count: 5 } }),
      candidate({ id: "d", reviewRating: { average: 5, count: 0 } }),
    ]);
    expect(result.bestRatingId).toBe("c");
  });

  it("gelijke reputatie geeft geen winnaar", () => {
    const tie = buildCandidateComparison([
      candidate({ id: "a", reviewRating: { average: 4.5, count: 2 } }),
      candidate({ id: "b", reviewRating: { average: 4.5, count: 9 } }),
    ]);
    expect(tie.bestRatingId).toBeNull();
  });

  it("geen enkele beoordeling → geen reputatie-winnaar", () => {
    const none = buildCandidateComparison([
      candidate({ id: "a" }),
      candidate({ id: "b", reviewRating: null }),
    ]);
    expect(none.bestRatingId).toBeNull();
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

describe("isRateOverBudget", () => {
  it("true wanneer het voorstel strikt boven het plafond ligt", () => {
    expect(isRateOverBudget(80, 65)).toBe(true);
  });

  it("false op of onder het plafond (gelijk telt niet als boven)", () => {
    expect(isRateOverBudget(65, 65)).toBe(false);
    expect(isRateOverBudget(50, 65)).toBe(false);
  });

  it("false zonder tarief of zonder (positief) budget — geen vals signaal", () => {
    expect(isRateOverBudget(null, 65)).toBe(false);
    expect(isRateOverBudget(80, null)).toBe(false);
    expect(isRateOverBudget(0, 65)).toBe(false);
    expect(isRateOverBudget(80, 0)).toBe(false);
    expect(isRateOverBudget(-10, 65)).toBe(false);
    expect(isRateOverBudget(80, -5)).toBe(false);
  });
});

describe("buildCandidateComparison — budgetplafond", () => {
  it("draagt een positief plafond mee", () => {
    const result = buildCandidateComparison(
      [candidate({ id: "a", proposedRate: 80 }), candidate({ id: "b", proposedRate: 60 })],
      65,
    );
    expect(result.budgetMaxRate).toBe(65);
  });

  it("geen/0/negatief plafond → null (geen budgetgrens)", () => {
    const cs = [candidate({ id: "a" }), candidate({ id: "b" })];
    expect(buildCandidateComparison(cs).budgetMaxRate).toBeNull();
    expect(buildCandidateComparison(cs, 0).budgetMaxRate).toBeNull();
    expect(buildCandidateComparison(cs, -5).budgetMaxRate).toBeNull();
  });

  it("draagt het plafond ook mee bij één kandidaat (geen winnaars)", () => {
    const result = buildCandidateComparison([candidate({ id: "a", proposedRate: 90 })], 70);
    expect(result.budgetMaxRate).toBe(70);
    expect(result.bestRateId).toBeNull();
  });
});

describe("exportCandidateComparisonCsv", () => {
  function serialize(
    candidates: CompareCandidate[],
    over?: { scoreById?: Record<string, number>; recommendedId?: string | null },
  ): string {
    return exportCandidateComparisonCsv({
      candidates,
      comparison: buildCandidateComparison(candidates),
      scoreById: over?.scoreById ?? {},
      recommendedId: over?.recommendedId ?? null,
    });
  }

  function lines(csv: string): string[] {
    return csv.split("\r\n");
  }

  it("zet een kopregel met alle 13 kolommen", () => {
    const csv = serialize([candidate({ id: "a" }), candidate({ id: "b" })]);
    const header = lines(csv)[0]!.split(";");
    expect(header).toEqual([
      "Kandidaat",
      "Totaalprofiel",
      "Aanbevolen",
      "Match",
      "Tariefvoorstel (EUR/uur)",
      "Boven budget",
      "Vertrouwen",
      "Reputatie",
      "Compliance",
      "Eerste keer akkoord",
      "Beschikbaar op startdatum",
      "Reistijd",
      "Eerdere samenwerkingen",
    ]);
  });

  it("schrijft één rij per kandidaat in de gegeven volgorde", () => {
    const csv = serialize([
      candidate({ id: "a", name: "Anna" }),
      candidate({ id: "b", name: "Bram" }),
      candidate({ id: "c", name: "Cas" }),
    ]);
    const rows = lines(csv);
    expect(rows).toHaveLength(4); // kop + 3
    expect(rows[1]!.split(";")[0]).toBe("Anna");
    expect(rows[2]!.split(";")[0]).toBe("Bram");
    expect(rows[3]!.split(";")[0]).toBe("Cas");
  });

  it("markeert alleen de aanbevolen kandidaat met Ja", () => {
    const csv = serialize([candidate({ id: "a" }), candidate({ id: "b" })], {
      recommendedId: "b",
    });
    const rows = lines(csv);
    expect(rows[1]!.split(";")[2]).toBe(""); // a niet aanbevolen
    expect(rows[2]!.split(";")[2]).toBe("Ja"); // b aanbevolen
  });

  it("markeert alleen boven-budget-kandidaten in de Boven-budget-kolom", () => {
    const candidates = [
      candidate({ id: "a", name: "Anna", proposedRate: 80 }),
      candidate({ id: "b", name: "Bram", proposedRate: 60 }),
    ];
    const csv = exportCandidateComparisonCsv({
      candidates,
      comparison: buildCandidateComparison(candidates, 65),
      scoreById: {},
      recommendedId: null,
    });
    const rows = lines(csv);
    expect(rows[1]!.split(";")[5]).toBe("Ja"); // Anna € 80 > € 65
    expect(rows[2]!.split(";")[5]).toBe(""); // Bram € 60 ≤ € 65
  });

  it("laat null-velden leeg", () => {
    const csv = serialize([candidate({ id: "a" }), candidate({ id: "b" })]);
    const cells = lines(csv)[1]!.split(";");
    // Totaalprofiel, Match, Tarief, Boven budget, Reputatie, Eerste keer, Startdatum, Reistijd, Historie leeg
    expect(cells[1]).toBe(""); // Totaalprofiel (geen score)
    expect(cells[3]).toBe(""); // Match
    expect(cells[4]).toBe(""); // Tarief
    expect(cells[5]).toBe(""); // Boven budget (geen tarief/budget)
    expect(cells[7]).toBe(""); // Reputatie
    expect(cells[9]).toBe(""); // Eerste keer akkoord
    expect(cells[10]).toBe(""); // Beschikbaar op startdatum
    expect(cells[11]).toBe(""); // Reistijd
    expect(cells[12]).toBe(""); // Eerdere samenwerkingen
  });

  it("toont n.v.t. bij een opdracht zonder certificaat-eis (complianceStatus null)", () => {
    const csv = serialize([
      candidate({ id: "a", complianceStatus: null }),
      candidate({ id: "b", complianceStatus: null }),
    ]);
    expect(lines(csv)[1]!.split(";")[8]).toBe("n.v.t.");
  });

  it("vertaalt vertrouwens- en compliance-labels", () => {
    const csv = serialize([
      candidate({ id: "a", trustLevel: "VOLLEDIG", complianceStatus: "COMPLIANT" }),
      candidate({ id: "b", trustLevel: "DEELS", complianceStatus: "NON_COMPLIANT" }),
    ]);
    const rows = lines(csv);
    expect(rows[1]!.split(";")[6]).toBe("Volledig");
    expect(rows[1]!.split(";")[8]).toBe("Compleet");
    expect(rows[2]!.split(";")[6]).toBe("Deels");
    expect(rows[2]!.split(";")[8]).toBe("Niet compleet");
  });

  it("vult score, match, tarief, reputatie en historie in", () => {
    const csv = serialize(
      [
        candidate({
          id: "a",
          name: "Anna",
          matchScore: 88,
          proposedRate: 65,
          reviewRating: { average: 4.5, count: 3 },
          sharedHistory: { count: 2, lastCompletedAt: null },
        }),
        candidate({ id: "b" }),
      ],
      { scoreById: { a: 91 }, recommendedId: "a" },
    );
    const cells = lines(csv)[1]!.split(";");
    expect(cells[1]).toBe("91"); // Totaalprofiel
    expect(cells[3]).toBe("88%"); // Match
    expect(cells[4]).toBe("65"); // Tarief
    expect(cells[5]).toBe(""); // Boven budget (geen budget meegegeven)
    expect(cells[7]).toBe("4,5 (3)"); // Reputatie met komma-decimaal
    expect(cells[12]).toBe("2"); // Eerdere samenwerkingen
  });

  it("beschermt tegen formule-injectie in een kandidaatnaam (CWE-1236)", () => {
    const csv = serialize([candidate({ id: "a", name: "=cmd()" }), candidate({ id: "b" })]);
    const firstCell = lines(csv)[1]!;
    // toCsv laat de cel niet met een kale '=' beginnen (voorloopse apostrof, evt. binnen quotes).
    expect(firstCell.startsWith("=")).toBe(false);
    expect(firstCell).toContain("'=cmd()");
  });
});
