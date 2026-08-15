import { describe, it, expect } from "vitest";
import { parseCsvRecords } from "@/lib/csv";
import {
  ROSTER_EXPORT_HEADERS,
  rosterCsv,
  rosterExportRow,
  type RosterExportRow,
} from "./roster-export";

function baseRow(overrides: Partial<RosterExportRow> = {}): RosterExportRow {
  return {
    name: "Sanne de Vries",
    headline: "Verpleegkundige",
    email: "sanne@example.com",
    location: "Utrecht",
    workMode: "ONSITE",
    hourlyRate: 65,
    availability: "AVAILABLE",
    engageabilityStatus: "ACTIEF",
    activeCollaborations: 0,
    freeDate: null,
    awayUntil: null,
    credentialCount: 3,
    credentialAlert: null,
    completeness: 90,
    dormancyTier: "active",
    ...overrides,
  };
}

describe("rosterExportRow", () => {
  it("mapt de kernvelden naar leesbare NL-labels", () => {
    const cells = rosterExportRow(baseRow());
    expect(cells).toEqual([
      "Sanne de Vries",
      "Verpleegkundige",
      "sanne@example.com",
      "Utrecht",
      "Op locatie",
      "65",
      "Beschikbaar",
      "Inzetbaar",
      "", // 0 actieve inzet → leeg
      "", // geen vrijkomdatum
      "", // niet afwezig
      "3",
      "", // geen waarschuwing
      "90",
      "", // active → geen re-engagement-label
    ]);
    // Rij en kop moeten dezelfde lengte hebben (geen kolomverschuiving).
    expect(cells).toHaveLength(ROSTER_EXPORT_HEADERS.length);
  });

  it("toont actieve inzet, vrijkomdatum, afwezigheid en re-engagement wanneer aanwezig", () => {
    const cells = rosterExportRow(
      baseRow({
        workMode: "HYBRID",
        availability: "LIMITED",
        engageabilityStatus: "AANDACHT",
        activeCollaborations: 2,
        freeDate: new Date("2026-09-01T00:00:00Z"),
        awayUntil: new Date("2026-08-20T00:00:00Z"),
        credentialAlert: "1 certificaat verloopt binnenkort",
        dormancyTier: "dormant",
      }),
    );
    expect(cells[4]).toBe("Hybride");
    expect(cells[6]).toBe("Beperkt beschikbaar");
    expect(cells[7]).toBe("Aandacht nodig");
    expect(cells[8]).toBe("2");
    expect(cells[9]).not.toBe("");
    expect(cells[10]).not.toBe("");
    expect(cells[12]).toBe("1 certificaat verloopt binnenkort");
    expect(cells[14]).toBe("Stilgevallen");
  });

  it("laat lege optionele velden leeg (geen tarief/headline/locatie)", () => {
    const cells = rosterExportRow(
      baseRow({ headline: null, location: null, hourlyRate: null, dormancyTier: "cooling" }),
    );
    expect(cells[1]).toBe("");
    expect(cells[3]).toBe("");
    expect(cells[5]).toBe("");
    expect(cells[14]).toBe("Koelt af");
  });
});

describe("rosterCsv", () => {
  it("begint met de kopregel en bevat een rij per ZZP'er", () => {
    const csv = rosterCsv([baseRow(), baseRow({ name: "Piet Jansen" })]);
    const records = parseCsvRecords(csv);
    expect(records).toHaveLength(3); // kop + 2 rijen
    expect(records[0]).toEqual([...ROSTER_EXPORT_HEADERS]);
    expect(records[1]![0]).toBe("Sanne de Vries");
    expect(records[2]![0]).toBe("Piet Jansen");
  });

  it("dekt een leeg roster (alleen de kopregel)", () => {
    const records = parseCsvRecords(rosterCsv([]));
    expect(records).toHaveLength(1);
    expect(records[0]).toEqual([...ROSTER_EXPORT_HEADERS]);
  });

  it("beveiligt tegen CSV-formule-injectie in door de gebruiker beheerde velden (CWE-1236)", () => {
    const csv = rosterCsv([baseRow({ name: "=SUM(A1:A9)", headline: "@cmd", location: "+trap" })]);
    // De ruwe tekst moet de gevaarlijke cellen met een voorloop-apostrof neutraliseren.
    expect(csv).toContain("'=SUM(A1:A9)");
    expect(csv).toContain("'@cmd");
    expect(csv).toContain("'+trap");
  });
});
