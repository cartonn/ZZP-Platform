import { describe, it, expect } from "vitest";
import { parseCsvShifts, exportDienstenCsv, type DienstSummary } from "./diensten";

describe("parseCsvShifts", () => {
  it("parses a single valid row (ISO-8601)", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T22:00;2024-01-16T06:00;Nachtdienst");
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]!.start).toEqual(new Date("2024-01-15T22:00"));
    expect(shifts[0]!.end).toEqual(new Date("2024-01-16T06:00"));
    expect(shifts[0]!.description).toBe("Nachtdienst");
  });

  it("parses a row with space instead of T", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15 08:00;2024-01-15 16:00;Dagdienst");
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]!.description).toBe("Dagdienst");
  });

  it("skips a recognised header row", () => {
    const csv = "start;eind;omschrijving\n2024-01-15T08:00;2024-01-15T16:00;Dag";
    const { shifts, errors } = parseCsvShifts(csv);
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
  });

  it("skips header 'datum_start'", () => {
    const csv = "datum_start;eind;omschrijving\n2024-01-15T08:00;2024-01-15T16:00;Dag";
    const { shifts, errors } = parseCsvShifts(csv);
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(1);
  });

  it("handles empty text", () => {
    const { shifts, errors } = parseCsvShifts("   ");
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(0);
  });

  it("handles optional description column", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T08:00;2024-01-15T16:00");
    expect(errors).toHaveLength(0);
    expect(shifts[0]!.description).toBe("");
  });

  it("reports error for invalid start date", () => {
    const { shifts, errors } = parseCsvShifts("geen-datum;2024-01-15T16:00;Dag");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.line).toBe(1);
    expect(errors[0]!.message).toContain("begintijd");
  });

  it("reports error for invalid end date", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T08:00;geen-datum;Dag");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.message).toContain("eindtijd");
  });

  it("reports error when end is before start", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T16:00;2024-01-15T08:00;Omgekeerd");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.message).toContain("na begintijd");
  });

  it("reports error for row with only one column", () => {
    const { shifts, errors } = parseCsvShifts("2024-01-15T08:00");
    expect(shifts).toHaveLength(0);
    expect(errors[0]!.message).toContain("kolommen");
  });

  it("parses multiple rows and collects errors per row", () => {
    const csv = [
      "2024-01-15T08:00;2024-01-15T16:00;Goed",
      "geen-datum;2024-01-16T16:00;Fout",
      "2024-01-17T08:00;2024-01-17T16:00;Goed 2",
    ].join("\n");
    const { shifts, errors } = parseCsvShifts(csv);
    expect(shifts).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.line).toBe(2);
  });

  it("handles Windows line endings", () => {
    const { shifts, errors } = parseCsvShifts(
      "2024-01-15T08:00;2024-01-15T16:00;A\r\n2024-01-16T08:00;2024-01-16T16:00;B",
    );
    expect(errors).toHaveLength(0);
    expect(shifts).toHaveLength(2);
  });

  it("truncates long description to 500 chars", () => {
    const longDesc = "x".repeat(600);
    const { shifts } = parseCsvShifts(`2024-01-15T08:00;2024-01-15T16:00;${longDesc}`);
    expect(shifts[0]!.description.length).toBe(500);
  });
});

describe("exportDienstenCsv", () => {
  const base: DienstSummary = {
    id: "d1",
    collaborationId: "c1",
    jobTitle: "Nachtzorg Jansen",
    companyName: "Zorgbureau XYZ",
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

  it("genereert een koptekstregel", () => {
    const csv = exportDienstenCsv([]);
    expect(csv).toContain("Opdracht");
    expect(csv).toContain("Periode start");
    expect(csv).toContain("Subtotaal (EUR)");
  });

  it("bevat opdrachttitel en opdrachtgeversnaam", () => {
    const csv = exportDienstenCsv([base]);
    expect(csv).toContain("Nachtzorg Jansen");
    expect(csv).toContain("Zorgbureau XYZ");
  });

  it("toont ORT-indicator correct", () => {
    const csv = exportDienstenCsv([base]);
    expect(csv).toContain('"Ja"');
    const noOrt = exportDienstenCsv([{ ...base, hasOrt: false }]);
    expect(noOrt).toContain('"Nee"');
  });

  it("formatteert bedragen als EUR met komma", () => {
    const csv = exportDienstenCsv([base]);
    expect(csv).toContain("16000,00");
  });

  it("escapet aanhalingstekens", () => {
    const d: DienstSummary = { ...base, description: 'Avond "nacht" dienst' };
    const csv = exportDienstenCsv([d]);
    expect(csv).toContain('""nacht""');
  });

  it("vertaalt status naar Nederlands label", () => {
    expect(exportDienstenCsv([{ ...base, status: "SUBMITTED" }])).toContain("Ter goedkeuring");
    expect(exportDienstenCsv([{ ...base, status: "REJECTED" }])).toContain("Afgekeurd");
  });

  it("verwerkt lege lijst — alleen koptekst", () => {
    const lines = exportDienstenCsv([]).split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(1);
  });

  it("exporteert meerdere rijen in volgorde", () => {
    const d2: DienstSummary = { ...base, id: "d2", jobTitle: "Dagzorg Pietersen" };
    const lines = exportDienstenCsv([base, d2]).split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Nachtzorg Jansen");
    expect(lines[2]).toContain("Dagzorg Pietersen");
  });
});
