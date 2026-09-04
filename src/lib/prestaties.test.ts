import { describe, it, expect } from "vitest";
import {
  approvablePerformances,
  exportPrestatiesCsv,
  summarizePendingApprovalValue,
  toPrestatieOverzicht,
  type PrestatieOverzicht,
  type PrestatieRow,
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
  ortBreakdown: {
    normalHours: 40,
    ortHours: 40,
    baseCents: 14000_00,
    surchargeCents: 2000_00,
  },
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

  it("bevat de ORT-uitsplitsingskolommen met basis + toeslag", () => {
    const csv = exportPrestatiesCsv([base]);
    const lines = csv.split("\r\n");
    const header = lines[0]!.split(";");
    const row = lines[1]!.split(";");
    const col = (name: string) => row[header.indexOf(name)];
    expect(header).toContain("Reguliere uren");
    expect(header).toContain("ORT-uren");
    expect(col("Reguliere uren")).toBe("40");
    expect(col("ORT-uren")).toBe("40");
    expect(col("Basisbedrag (EUR)")).toBe("14000,00");
    expect(col("ORT-toeslag (EUR)")).toBe("2000,00");
  });

  it("laat de ORT-uitsplitsing leeg voor een milestone (geen uurbasis)", () => {
    const milestone: PrestatieOverzicht = {
      ...base,
      type: "MILESTONE",
      hours: null,
      hasOrt: false,
      ortBreakdown: { normalHours: 0, ortHours: 0, baseCents: 0, surchargeCents: 0 },
    };
    const csv = exportPrestatiesCsv([milestone]);
    const lines = csv.split("\r\n");
    const header = lines[0]!.split(";");
    const row = lines[1]!.split(";");
    const col = (name: string) => row[header.indexOf(name)];
    expect(col("Reguliere uren")).toBe("");
    expect(col("Basisbedrag (EUR)")).toBe("");
    expect(col("Subtotaal (EUR)")).toBe("16000,00");
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

// Maatwerk-ORT-percentages (bps); alle categorieën verplicht, anders valt parseOrtCustomRates terug.
const RATES_NIGHT_49 = JSON.stringify({
  EVENING: 2200,
  NIGHT: 4900,
  SATURDAY: 5200,
  SUNDAY: 7200,
  HOLIDAY: 10000,
});
const RATES_NIGHT_20 = JSON.stringify({
  EVENING: 2200,
  NIGHT: 2000,
  SATURDAY: 5200,
  SUNDAY: 7200,
  HOLIDAY: 10000,
});

function row(overrides: Partial<PrestatieRow> = {}): PrestatieRow {
  return {
    id: "p1",
    type: "HOURS",
    status: "APPROVED",
    rateCents: 5000, // €50/u
    hours: 80,
    ortSegments: JSON.stringify([
      { category: "NORMAL", hours: 40 },
      { category: "NIGHT", hours: 40 },
    ]),
    amountCents: null,
    periodStart: new Date("2026-01-01"),
    periodEnd: new Date("2026-01-31"),
    description: "Januari nachtzorg",
    submittedAt: new Date("2026-02-01"),
    approvedAt: new Date("2026-02-02"),
    rejectedAt: null,
    rejectionReason: null,
    collaboration: {
      id: "c1",
      ortProfile: null,
      ortCustomRates: RATES_NIGHT_49,
      disputedAt: null,
      job: { title: "Nachtzorg Jansen" },
      freelancer: { user: { name: "Fatima Ouahabi" } },
    },
    invoice: null,
    ...overrides,
  };
}

describe("toPrestatieOverzicht — factuur is de bevroren waarheid (geen ORT-drift)", () => {
  // Basis is snapshot-stabiel: (40u + 40u) × €50 = €4000 = 400000 cent (onafhankelijk van de toeslag).
  const BASE_CENTS = 40 * 5000 + 40 * 5000; // 400000

  it("zonder factuur: herberekent live uit de actuele toeslagen (en die driften met de rate)", () => {
    // NIGHT 40u tegen +49%: toeslag = round(200000 × 4900/10000) = 98000.
    const at49 = toPrestatieOverzicht(
      row({ collaboration: { ...row().collaboration, ortCustomRates: RATES_NIGHT_49 } }),
    );
    // NIGHT 40u tegen +20%: toeslag = round(200000 × 2000/10000) = 40000.
    const at20 = toPrestatieOverzicht(
      row({ collaboration: { ...row().collaboration, ortCustomRates: RATES_NIGHT_20 } }),
    );

    expect(at49.subtotalCents).toBe(BASE_CENTS + 98000); // 498000
    expect(at20.subtotalCents).toBe(BASE_CENTS + 40000); // 440000
    // Bewijst de drift: zonder factuur verschuift het getoonde bedrag met de live toeslagen.
    expect(at49.subtotalCents).not.toBe(at20.subtotalCents);
    expect(at49.ortBreakdown.surchargeCents).toBe(98000);
    expect(at20.ortBreakdown.surchargeCents).toBe(40000);
  });

  it("met factuur: toont het bevroren factuursubtotaal, ook al zijn de toeslagen daarna gewijzigd", () => {
    // Factuur is afgeleid bij goedkeuring met +49% (subtotaal 498000). De opdrachtgever wijzigde
    // de samenwerking daarna naar +20% — een live-herberekening zou nu 440000 tonen en afwijken
    // van de factuur die daadwerkelijk is verstuurd/betaald.
    const res = toPrestatieOverzicht(
      row({
        collaboration: { ...row().collaboration, ortCustomRates: RATES_NIGHT_20 },
        invoice: { subtotalCents: 498000 },
      }),
    );
    expect(res.subtotalCents).toBe(498000);
    // De toeslag reconciliëert tegen het bevroren subtotaal; de basis blijft snapshot-stabiel.
    expect(res.ortBreakdown.baseCents).toBe(BASE_CENTS);
    expect(res.ortBreakdown.surchargeCents).toBe(498000 - BASE_CENTS); // 98000, niet 40000
  });

  it("HOURS zonder ORT-segmenten met factuur: subtotaal = factuur, geen toeslag", () => {
    const res = toPrestatieOverzicht(
      row({ ortSegments: null, invoice: { subtotalCents: BASE_CENTS } }),
    );
    expect(res.hasOrt).toBe(false);
    expect(res.subtotalCents).toBe(BASE_CENTS);
    expect(res.ortBreakdown.surchargeCents).toBe(0);
  });

  it("MILESTONE met factuur: subtotaal = factuur, lege ORT-uitsplitsing", () => {
    const res = toPrestatieOverzicht(
      row({
        type: "MILESTONE",
        rateCents: null,
        hours: null,
        ortSegments: null,
        amountCents: 250000,
        invoice: { subtotalCents: 250000 },
      }),
    );
    expect(res.type).toBe("MILESTONE");
    expect(res.subtotalCents).toBe(250000);
    expect(res.ortBreakdown).toEqual({
      normalHours: 0,
      ortHours: 0,
      baseCents: 0,
      surchargeCents: 0,
    });
  });

  it("valt terug op live-berekening als er (nog) geen factuur is (bv. SUBMITTED)", () => {
    const res = toPrestatieOverzicht(row({ status: "SUBMITTED", invoice: null }));
    expect(res.subtotalCents).toBe(BASE_CENTS + 98000);
  });
});
