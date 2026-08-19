import { describe, it, expect } from "vitest";
import { relationBreakdownCsv, type RelationBreakdownCsvRow } from "@/lib/relation-breakdown-csv";

const FREELANCER_LABELS = { relation: "Opdrachtgever", amount: "Omzet (EUR)" };
const CLIENT_LABELS = { relation: "ZZP'er", amount: "Uitgaven (EUR)" };

const rows: RelationBreakdownCsvRow[] = [
  { name: "De Linde", paidCents: 250000, sharePct: 62, placements: 3 },
  { name: "Zorggroep West", paidCents: 150000, sharePct: 38, placements: 1 },
];

describe("relationBreakdownCsv", () => {
  it("schrijft de rol-afhankelijke kop (ZZP'er = omzet per opdrachtgever)", () => {
    const lines = relationBreakdownCsv(rows, FREELANCER_LABELS).split("\r\n");
    expect(lines[0]).toBe("Opdrachtgever;Omzet (EUR);Aandeel (%);Samenwerkingen");
  });

  it("schrijft de rol-afhankelijke kop (opdrachtgever = uitgaven per ZZP'er)", () => {
    const lines = relationBreakdownCsv(rows, CLIENT_LABELS).split("\r\n");
    // ZZP'er bevat een apostrof → geen formule-prefix nodig (start niet met = + @ - ), wel gewoon tekst.
    expect(lines[0]).toBe("ZZP'er;Uitgaven (EUR);Aandeel (%);Samenwerkingen");
  });

  it("serialiseert elke relatie als één rij met euro-bedrag, aandeel en aantal samenwerkingen", () => {
    const lines = relationBreakdownCsv(rows, FREELANCER_LABELS).split("\r\n");
    expect(lines[1]).toBe("De Linde;2500.00;62;3");
    expect(lines[2]).toBe("Zorggroep West;1500.00;38;1");
    expect(lines).toHaveLength(3);
  });

  it("behoudt de aangeleverde volgorde (bedrag aflopend, zoals op het scherm)", () => {
    const unsorted: RelationBreakdownCsvRow[] = [
      { name: "Klein", paidCents: 100, sharePct: 10, placements: 1 },
      { name: "Groot", paidCents: 900, sharePct: 90, placements: 2 },
    ];
    const lines = relationBreakdownCsv(unsorted, FREELANCER_LABELS).split("\r\n");
    // Geen her-sortering: rij-volgorde = invoervolgorde.
    expect(lines[1]!.startsWith("Klein;")).toBe(true);
    expect(lines[2]!.startsWith("Groot;")).toBe(true);
  });

  it("beveiligt tegen formule-injectie in een relatienaam van derden (CWE-1236)", () => {
    const evil: RelationBreakdownCsvRow[] = [
      { name: "=SOM(A1:A9)", paidCents: 50000, sharePct: 100, placements: 1 },
    ];
    const lines = relationBreakdownCsv(evil, CLIENT_LABELS).split("\r\n");
    // Een cel die met '=' begint krijgt een voorloopse apostrof (formule-injectie-guard);
    // er zit geen scheidingsteken/quote/newline in, dus verdere quoting is niet nodig.
    expect(lines[1]).toBe("'=SOM(A1:A9);500.00;100;1");
  });

  it("geeft bij geen relaties alleen de kopregel terug", () => {
    const out = relationBreakdownCsv([], FREELANCER_LABELS);
    expect(out).toBe("Opdrachtgever;Omzet (EUR);Aandeel (%);Samenwerkingen");
  });
});
