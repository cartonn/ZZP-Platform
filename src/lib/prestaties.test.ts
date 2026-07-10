import { describe, it, expect } from "vitest";
import { exportPrestatiesCsv, type PrestatieOverzicht } from "./prestaties";

const base: PrestatieOverzicht = {
  id: "p1",
  collaborationId: "c1",
  jobTitle: "Nachtzorg Jansen",
  freelancerName: "Fatima Ouahabi",
  type: "HOURS",
  status: "APPROVED",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-01-31"),
  hours: 80,
  subtotalCents: 16000_00,
  hasOrt: true,
  description: "Januari nachtzorg",
  submittedAt: new Date("2026-02-01"),
  approvedAt: new Date("2026-02-02"),
  rejectedAt: null,
  rejectionReason: null,
};

describe("exportPrestatiesCsv", () => {
  it("genereert een koptekstregel", () => {
    const csv = exportPrestatiesCsv([]);
    expect(csv).toContain("ZZP'er");
    expect(csv).toContain("Periode start");
    expect(csv).toContain("Subtotaal (EUR)");
  });

  it("bevat ZZP'er-naam en opdrachtttitel", () => {
    const csv = exportPrestatiesCsv([base]);
    expect(csv).toContain("Fatima Ouahabi");
    expect(csv).toContain("Nachtzorg Jansen");
  });

  it("toont ORT-indicator correct", () => {
    // De canonieke CSV-kern quotet alleen waar nodig; "Ja"/"Nee" bevatten geen scheidingsteken en
    // komen dus onaangehaald als los veld tussen de semikolons te staan.
    const csv = exportPrestatiesCsv([base]);
    expect(csv).toMatch(/;Ja;/);

    const noOrt = exportPrestatiesCsv([{ ...base, hasOrt: false }]);
    expect(noOrt).toMatch(/;Nee;/);
  });

  it("formatteert bedragen als EUR met komma", () => {
    const csv = exportPrestatiesCsv([base]);
    expect(csv).toContain("16000,00");
  });

  it("vult lege velden in bij null-waarden", () => {
    const p: PrestatieOverzicht = { ...base, hours: null, subtotalCents: null, approvedAt: null };
    const csv = exportPrestatiesCsv([p]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
  });

  it("escapet aanhalingstekens in omschrijving", () => {
    const p: PrestatieOverzicht = { ...base, description: 'Avond "zorg" dienst' };
    const csv = exportPrestatiesCsv([p]);
    expect(csv).toContain('""zorg""');
  });

  it("vertaalt status naar Nederlands label", () => {
    const submitted = exportPrestatiesCsv([{ ...base, status: "SUBMITTED" }]);
    expect(submitted).toContain("Ter goedkeuring");

    const rejected = exportPrestatiesCsv([{ ...base, status: "REJECTED" }]);
    expect(rejected).toContain("Afgekeurd");
  });

  it("vertaalt type naar Nederlands label", () => {
    const milestone = exportPrestatiesCsv([{ ...base, type: "MILESTONE" }]);
    expect(milestone).toContain("Milestone");
  });

  it("verwerkt lege lijst zonder fout", () => {
    const csv = exportPrestatiesCsv([]);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(1); // alleen koptekst
  });

  it("beveiligt tegen CSV-formule-injectie in vrije tekst van de ZZP'er (CWE-1236 / OWASP A03)", () => {
    // Een ZZP'er zet een formule als naam/omschrijving; de opdrachtgever opent de export in Excel.
    // Zonder de guard zou de cel als formule uitgevoerd worden. De gedeelde toCsv-kern moet een
    // voorloopse apostrof plaatsen zodat de inhoud als tekst blijft staan.
    const p: PrestatieOverzicht = {
      ...base,
      freelancerName: "=cmd|'/c calc'!A1",
      description: "@SUM(1+1)",
      rejectionReason: "+1234567",
    };
    const csv = exportPrestatiesCsv([p]);
    // Geen enkele cel mag "kaal" met een gevaarlijk teken beginnen (altijd voorafgegaan door ').
    expect(csv).toContain("'=cmd");
    expect(csv).toContain("'@SUM(1+1)");
    expect(csv).toContain("'+1234567");
    expect(csv).not.toMatch(/(^|;|")=cmd/);
  });

  it("exporteert meerdere rijen in de juiste volgorde", () => {
    const p2: PrestatieOverzicht = {
      ...base,
      id: "p2",
      freelancerName: "Jan de Vries",
      jobTitle: "Dagzorg",
    };
    const csv = exportPrestatiesCsv([base, p2]);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(3); // header + 2 rijen
    expect(lines[1]).toContain("Fatima Ouahabi");
    expect(lines[2]).toContain("Jan de Vries");
  });
});
