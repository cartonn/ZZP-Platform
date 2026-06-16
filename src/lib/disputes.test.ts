import { describe, it, expect } from "vitest";
import {
  disputeAgeDays,
  disputeUrgency,
  disputeUrgentThreshold,
  rankDisputeUrgency,
  sortDisputeRows,
  summarizeDisputes,
  buildDisputeRow,
  DISPUTE_URGENCY_THRESHOLDS,
  type DisputeRow,
  type DisputeUrgency,
} from "./disputes";

// Vaste referentietijd voor reproduceerbare tests.
const NOW = new Date("2026-06-05T12:00:00Z");

// Hulpfunctie: trek hele dagen + optioneel extra uren af van NOW.
function daysAgo(days: number, extraHours = 0): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000 - extraHours * 60 * 60 * 1000);
}

// Minimale fixture-row voor sorteer- en samenvattingstests.
function makeRow(id: string, urgency: DisputeUrgency, ageDays: number): DisputeRow {
  return {
    collaborationId: id,
    jobTitle: `Opdracht ${id}`,
    companyName: `Bedrijf ${id}`,
    freelancerName: `ZZP'er ${id}`,
    disputedAt: daysAgo(ageDays),
    disputeReason: null,
    ageDays,
    urgency,
  };
}

// ---------------------------------------------------------------------------
// disputeUrgentThreshold
// ---------------------------------------------------------------------------
describe("disputeUrgentThreshold", () => {
  it("ligt precies urgentDays vóór now", () => {
    const threshold = disputeUrgentThreshold(NOW);
    const expected = daysAgo(DISPUTE_URGENCY_THRESHOLDS.urgentDays);
    expect(threshold.getTime()).toBe(expected.getTime());
  });

  it("is consistent met disputeAgeDays: dispuut precies op de drempel telt als URGENT", () => {
    const threshold = disputeUrgentThreshold(NOW);
    // Op de drempel: leeftijd == urgentDays → URGENT, en disputedAt <= threshold.
    expect(disputeAgeDays(threshold, NOW)).toBe(DISPUTE_URGENCY_THRESHOLDS.urgentDays);
    expect(disputeUrgency(disputeAgeDays(threshold, NOW))).toBe("URGENT");
  });

  it("een dispuut net jonger dan de drempel valt erbuiten (niet URGENT)", () => {
    const threshold = disputeUrgentThreshold(NOW);
    const justYounger = new Date(threshold.getTime() + 1); // 1 ms ná de drempel
    expect(disputeAgeDays(justYounger, NOW)).toBe(DISPUTE_URGENCY_THRESHOLDS.urgentDays - 1);
    expect(justYounger.getTime()).toBeGreaterThan(threshold.getTime()); // valt buiten `lte`
  });

  it("gebruikt de huidige tijd als now wordt weggelaten", () => {
    const before = Date.now() - DISPUTE_URGENCY_THRESHOLDS.urgentDays * 24 * 60 * 60 * 1000;
    const threshold = disputeUrgentThreshold().getTime();
    const after = Date.now() - DISPUTE_URGENCY_THRESHOLDS.urgentDays * 24 * 60 * 60 * 1000;
    expect(threshold).toBeGreaterThanOrEqual(before);
    expect(threshold).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// disputeAgeDays
// ---------------------------------------------------------------------------
describe("disputeAgeDays", () => {
  it("berekent exact 7 dagen (floor van 7d 12u)", () => {
    const disputedAt = daysAgo(7, 12);
    expect(disputeAgeDays(disputedAt, NOW)).toBe(7);
  });

  it("geeft 0 als disputedAt gelijk is aan now", () => {
    expect(disputeAgeDays(NOW, NOW)).toBe(0);
  });

  it("geeft 0 als disputedAt in de toekomst ligt", () => {
    const future = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
    expect(disputeAgeDays(future, NOW)).toBe(0);
  });

  it("geeft 0 als het dispuut minder dan 1 dag geleden geopend is (paar uur)", () => {
    const fewHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000);
    expect(disputeAgeDays(fewHoursAgo, NOW)).toBe(0);
  });

  it("berekent exact 3 dagen", () => {
    expect(disputeAgeDays(daysAgo(3), NOW)).toBe(3);
  });

  it("berekent exact 30 dagen", () => {
    expect(disputeAgeDays(daysAgo(30), NOW)).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// disputeUrgency
// ---------------------------------------------------------------------------
describe("disputeUrgency", () => {
  it("0 dagen → NORMAAL", () => {
    expect(disputeUrgency(0)).toBe("NORMAAL");
  });

  it("1 dag → NORMAAL", () => {
    expect(disputeUrgency(1)).toBe("NORMAAL");
  });

  it("2 dagen → NORMAAL", () => {
    expect(disputeUrgency(2)).toBe("NORMAAL");
  });

  it("3 dagen (drempel raisedDays) → VERHOOGD", () => {
    expect(disputeUrgency(3)).toBe("VERHOOGD");
  });

  it("6 dagen → VERHOOGD", () => {
    expect(disputeUrgency(6)).toBe("VERHOOGD");
  });

  it("7 dagen (drempel urgentDays) → URGENT", () => {
    expect(disputeUrgency(7)).toBe("URGENT");
  });

  it("30 dagen → URGENT", () => {
    expect(disputeUrgency(30)).toBe("URGENT");
  });
});

// ---------------------------------------------------------------------------
// rankDisputeUrgency
// ---------------------------------------------------------------------------
describe("rankDisputeUrgency", () => {
  it("geeft URGENT de laagste rang (0)", () => {
    expect(rankDisputeUrgency("URGENT")).toBe(0);
  });

  it("geeft VERHOOGD rang 1", () => {
    expect(rankDisputeUrgency("VERHOOGD")).toBe(1);
  });

  it("geeft NORMAAL de hoogste rang (2)", () => {
    expect(rankDisputeUrgency("NORMAAL")).toBe(2);
  });

  it("URGENT < VERHOOGD < NORMAAL (numerieke volgorde)", () => {
    expect(rankDisputeUrgency("URGENT")).toBeLessThan(rankDisputeUrgency("VERHOOGD"));
    expect(rankDisputeUrgency("VERHOOGD")).toBeLessThan(rankDisputeUrgency("NORMAAL"));
  });
});

// ---------------------------------------------------------------------------
// sortDisputeRows
// ---------------------------------------------------------------------------
describe("sortDisputeRows", () => {
  it("sorteert URGENT vóór VERHOOGD vóór NORMAAL", () => {
    const rows = [
      makeRow("a", "NORMAAL", 1),
      makeRow("b", "URGENT", 8),
      makeRow("c", "VERHOOGD", 4),
    ];
    const sorted = sortDisputeRows(rows);
    expect(sorted.map((r) => r.urgency)).toEqual(["URGENT", "VERHOOGD", "NORMAAL"]);
  });

  it("sorteert bij gelijk niveau de oudste (hoogste ageDays) eerst", () => {
    const rows = [
      makeRow("a", "URGENT", 8),
      makeRow("b", "URGENT", 20),
      makeRow("c", "URGENT", 12),
    ];
    const sorted = sortDisputeRows(rows);
    expect(sorted.map((r) => r.ageDays)).toEqual([20, 12, 8]);
  });

  it("combineert urgentie- en leeftijdssortering correct", () => {
    const rows = [
      makeRow("a", "NORMAAL", 1),
      makeRow("b", "URGENT", 8),
      makeRow("c", "VERHOOGD", 5),
      makeRow("d", "URGENT", 15),
    ];
    const sorted = sortDisputeRows(rows);
    expect(sorted.at(0)?.collaborationId).toBe("d"); // URGENT, 15 dagen
    expect(sorted.at(1)?.collaborationId).toBe("b"); // URGENT, 8 dagen
    expect(sorted.at(2)?.collaborationId).toBe("c"); // VERHOOGD, 5 dagen
    expect(sorted.at(3)?.collaborationId).toBe("a"); // NORMAAL, 1 dag
  });

  it("geeft lege array terug voor lege invoer", () => {
    expect(sortDisputeRows([])).toEqual([]);
  });

  it("muteert de originele array niet", () => {
    const rows = [makeRow("a", "NORMAAL", 1), makeRow("b", "URGENT", 10)];
    sortDisputeRows(rows);
    // Originele volgorde ongewijzigd.
    expect(rows.at(0)?.collaborationId).toBe("a");
    expect(rows.at(1)?.collaborationId).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// summarizeDisputes
// ---------------------------------------------------------------------------
describe("summarizeDisputes", () => {
  it("telt total correct", () => {
    const rows = [
      makeRow("a", "URGENT", 10),
      makeRow("b", "VERHOOGD", 4),
      makeRow("c", "NORMAAL", 1),
    ];
    expect(summarizeDisputes(rows).total).toBe(3);
  });

  it("telt byUrgency correct", () => {
    const rows = [
      makeRow("a", "URGENT", 10),
      makeRow("b", "URGENT", 8),
      makeRow("c", "VERHOOGD", 4),
      makeRow("d", "NORMAAL", 1),
    ];
    const summary = summarizeDisputes(rows);
    expect(summary.byUrgency.URGENT).toBe(2);
    expect(summary.byUrgency.VERHOOGD).toBe(1);
    expect(summary.byUrgency.NORMAAL).toBe(1);
  });

  it("alle drie niveaus aanwezig (ook 0) bij lege lijst", () => {
    const summary = summarizeDisputes([]);
    expect(summary.total).toBe(0);
    expect(summary.byUrgency).toHaveProperty("URGENT", 0);
    expect(summary.byUrgency).toHaveProperty("VERHOOGD", 0);
    expect(summary.byUrgency).toHaveProperty("NORMAAL", 0);
  });

  it("alle drie niveaus aanwezig (ook 0) als niet alle niveaus voorkomen", () => {
    const rows = [makeRow("a", "URGENT", 9)];
    const summary = summarizeDisputes(rows);
    expect(summary.byUrgency.URGENT).toBe(1);
    expect(summary.byUrgency.VERHOOGD).toBe(0);
    expect(summary.byUrgency.NORMAAL).toBe(0);
  });

  it("oldestAgeDays is de hoogste ageDays uit de lijst", () => {
    const rows = [
      makeRow("a", "URGENT", 15),
      makeRow("b", "VERHOOGD", 4),
      makeRow("c", "NORMAAL", 1),
    ];
    expect(summarizeDisputes(rows).oldestAgeDays).toBe(15);
  });

  it("oldestAgeDays is 0 voor een lege lijst", () => {
    expect(summarizeDisputes([]).oldestAgeDays).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildDisputeRow
// ---------------------------------------------------------------------------
describe("buildDisputeRow", () => {
  it("leidt ageDays en urgency correct af voor een 7-daags dispuut", () => {
    const disputedAt = daysAgo(7);
    const row = buildDisputeRow(
      {
        collaborationId: "collab-1",
        jobTitle: "Senior Developer",
        companyName: "Acme BV",
        freelancerName: "Jan Jansen",
        disputedAt,
        disputeReason: "Betaling uitgesteld",
      },
      NOW,
    );
    expect(row.ageDays).toBe(7);
    expect(row.urgency).toBe("URGENT");
  });

  it("leidt VERHOOGD af voor 3 dagen oud dispuut", () => {
    const row = buildDisputeRow(
      {
        collaborationId: "collab-2",
        jobTitle: "Designer",
        companyName: "Beta BV",
        freelancerName: "Piet Pietersen",
        disputedAt: daysAgo(3),
        disputeReason: null,
      },
      NOW,
    );
    expect(row.ageDays).toBe(3);
    expect(row.urgency).toBe("VERHOOGD");
  });

  it("leidt NORMAAL af voor 1 dag oud dispuut", () => {
    const row = buildDisputeRow(
      {
        collaborationId: "collab-3",
        jobTitle: "Consultant",
        companyName: "Gamma BV",
        freelancerName: "Klaas Klaassen",
        disputedAt: daysAgo(1),
        disputeReason: "Scope onduidelijk",
      },
      NOW,
    );
    expect(row.ageDays).toBe(1);
    expect(row.urgency).toBe("NORMAAL");
  });

  it("behoudt alle invoervelden in de output", () => {
    const disputedAt = daysAgo(5);
    const row = buildDisputeRow(
      {
        collaborationId: "collab-4",
        jobTitle: "Tester",
        companyName: "Delta BV",
        freelancerName: "Marie Janssen",
        disputedAt,
        disputeReason: "Kwaliteit",
      },
      NOW,
    );
    expect(row.collaborationId).toBe("collab-4");
    expect(row.jobTitle).toBe("Tester");
    expect(row.companyName).toBe("Delta BV");
    expect(row.freelancerName).toBe("Marie Janssen");
    expect(row.disputedAt).toBe(disputedAt);
    expect(row.disputeReason).toBe("Kwaliteit");
  });
});
