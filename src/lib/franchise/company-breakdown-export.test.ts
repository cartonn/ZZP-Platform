import { describe, it, expect } from "vitest";
import { COMPANY_BREAKDOWN_EXPORT_HEADERS, companyBreakdownCsv } from "./company-breakdown-export";
import { type CompanyBreakdownRow } from "@/lib/tenant-stats";

function row(over: Partial<CompanyBreakdownRow> = {}): CompanyBreakdownRow {
  return {
    companyId: "c1",
    name: "Zorggroep West",
    revenuePaidCents: 101640,
    totalJobs: 4,
    filledJobs: 3,
    fillRate: 75,
    ...over,
  };
}

describe("companyBreakdownCsv", () => {
  it("begint met de kolomkoppen", () => {
    const csv = companyBreakdownCsv([]);
    expect(csv).toBe(COMPANY_BREAKDOWN_EXPORT_HEADERS.join(";"));
  });

  it("schrijft één rij met euro-omzet (punt-decimaal) en de tellingen", () => {
    const csv = companyBreakdownCsv([row()]);
    const [, dataLine] = csv.split("\r\n");
    expect(dataLine).toBe("Zorggroep West;1016.40;4;3;75");
  });

  it("behoudt de aangeleverde rij-volgorde (scherm-pariteit)", () => {
    const csv = companyBreakdownCsv([
      row({ companyId: "a", name: "Alfa", revenuePaidCents: 50000 }),
      row({ companyId: "b", name: "Beta", revenuePaidCents: 20000 }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]!.startsWith("Alfa;")).toBe(true);
    expect(lines[2]!.startsWith("Beta;")).toBe(true);
  });

  it("beveiligt tegen formule-injectie in de opdrachtgevernaam (CWE-1236)", () => {
    const csv = companyBreakdownCsv([row({ name: "=CMD()|calc" })]);
    const dataLine = csv.split("\r\n")[1]!;
    // Gevaarlijke leidende '=' krijgt een voorloopse apostrof en het veld wordt gequote
    // (bevat een leidend "'=" plus geen scheidingsteken → quoting door de pipe niet nodig,
    // maar de guard-apostrof staat er).
    expect(dataLine.startsWith("'=CMD()|calc;")).toBe(true);
  });

  it("quotet een naam met het scheidingsteken", () => {
    const csv = companyBreakdownCsv([row({ name: "Alfa; Beta BV" })]);
    const dataLine = csv.split("\r\n")[1]!;
    expect(dataLine.startsWith('"Alfa; Beta BV";')).toBe(true);
  });

  it("toont vulgraad 0 en 0 diensten netjes", () => {
    const csv = companyBreakdownCsv([
      row({ name: "Nieuw", revenuePaidCents: 0, totalJobs: 0, filledJobs: 0, fillRate: 0 }),
    ]);
    expect(csv.split("\r\n")[1]).toBe("Nieuw;0.00;0;0;0");
  });
});
