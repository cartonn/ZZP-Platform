import { describe, it, expect } from "vitest";
import {
  approvablePerformances,
  exportPrestatiesCsv,
  summarizePendingApprovalValue,
  type PrestatieOverzicht,
} from "./prestaties";

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
  disputed: false,
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

describe("approvablePerformances — wat de opdrachtgever écht kan keuren", () => {
  const submitted: PrestatieOverzicht = { ...base, id: "s1", status: "SUBMITTED" };

  it("neemt een ingediende, niet-disputed prestatie mee", () => {
    expect(approvablePerformances([submitted]).map((p) => p.id)).toEqual(["s1"]);
  });

  it("sluit een ingediende prestatie van een BEVROREN (disputed) samenwerking uit", () => {
    // Kernregressie (DOEL-1b): approvePerformance weigert server-side op een disputed samenwerking,
    // dus dit scherm mag 'm niet als goed te keuren tellen — anders een niet-verdwijnende, falende actie
    // die badge/`/acties`/cascade tegenspreekt.
    const frozen: PrestatieOverzicht = { ...submitted, id: "s2", disputed: true };
    expect(approvablePerformances([submitted, frozen]).map((p) => p.id)).toEqual(["s1"]);
  });

  it("sluit niet-ingediende statussen uit (concept/goedgekeurd/afgekeurd)", () => {
    const draft: PrestatieOverzicht = { ...base, id: "d1", status: "DRAFT" };
    const approved: PrestatieOverzicht = { ...base, id: "a1", status: "APPROVED" };
    const rejected: PrestatieOverzicht = { ...base, id: "r1", status: "REJECTED" };
    expect(approvablePerformances([draft, approved, rejected, submitted]).map((p) => p.id)).toEqual(
      ["s1"],
    );
  });
});

describe("summarizePendingApprovalValue — €-committed cost wacht op goedkeuring", () => {
  const submitted: PrestatieOverzicht = { ...base, id: "s1", status: "SUBMITTED" };

  it("telt de subtotalen van goed te keuren prestaties op", () => {
    const a: PrestatieOverzicht = { ...submitted, id: "a", subtotalCents: 10000_00 };
    const b: PrestatieOverzicht = { ...submitted, id: "b", subtotalCents: 5000_00 };
    const res = summarizePendingApprovalValue([a, b]);
    expect(res).toEqual({ count: 2, totalCents: 15000_00, withoutAmount: 0 });
  });

  it("telt uitsluitend de goed te keuren set (SUBMITTED, niet disputed) — één bron met de telling", () => {
    const pending: PrestatieOverzicht = { ...submitted, id: "p", subtotalCents: 8000_00 };
    const approved: PrestatieOverzicht = {
      ...base,
      id: "ap",
      status: "APPROVED",
      subtotalCents: 99999_00,
    };
    const frozen: PrestatieOverzicht = {
      ...submitted,
      id: "fr",
      disputed: true,
      subtotalCents: 4000_00,
    };
    const res = summarizePendingApprovalValue([pending, approved, frozen]);
    expect(res).toEqual({ count: 1, totalCents: 8000_00, withoutAmount: 0 });
  });

  it("negeert een prestatie zonder berekenbaar subtotaal in het bedrag maar telt 'm in withoutAmount", () => {
    const withAmount: PrestatieOverzicht = { ...submitted, id: "w", subtotalCents: 6000_00 };
    const noRate: PrestatieOverzicht = { ...submitted, id: "n", subtotalCents: null };
    const res = summarizePendingApprovalValue([withAmount, noRate]);
    expect(res).toEqual({ count: 2, totalCents: 6000_00, withoutAmount: 1 });
  });

  it("geeft nul-waarden op een lege lijst", () => {
    expect(summarizePendingApprovalValue([])).toEqual({
      count: 0,
      totalCents: 0,
      withoutAmount: 0,
    });
  });
});
