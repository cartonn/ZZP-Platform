import { describe, it, expect } from "vitest";
import {
  expensesCsv,
  EXPENSES_EXPORT_HEADERS,
  type ExpenseCsvRow,
} from "@/lib/administration/expenses-csv";

const row = (over: Partial<ExpenseCsvRow> = {}): ExpenseCsvRow => ({
  occurredAt: new Date("2026-03-10T00:00:00.000Z"),
  description: "Treinkaartje",
  category: "REISKOSTEN",
  netCents: 1250,
  vatCents: 88,
  ...over,
});

describe("expensesCsv", () => {
  it("start met de vaste kopregel", () => {
    const lines = expensesCsv([row()]).split("\r\n");
    expect(lines[0]).toBe(EXPENSES_EXPORT_HEADERS.join(";"));
  });

  it("rendert datum als ISO, geld in euro's met punt-decimaal en het NL-categorielabel", () => {
    const lines = expensesCsv([row()]).split("\r\n");
    expect(lines[1]).toBe("2026-03-10;Treinkaartje;Reiskosten;12.50;0.88;");
  });

  it("sorteert oplopend op datum, los van de aanlever-volgorde", () => {
    const csv = expensesCsv([
      row({ occurredAt: new Date("2026-05-01T00:00:00.000Z"), description: "Later" }),
      row({ occurredAt: new Date("2026-01-01T00:00:00.000Z"), description: "Eerder" }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toContain("2026-01-01;Eerder");
    expect(lines[2]).toContain("2026-05-01;Later");
  });

  it("valt terug op 'Overig' bij een onbekende categorie", () => {
    const lines = expensesCsv([row({ category: "ONZIN", description: "Rest" })]).split("\r\n");
    expect(lines[1]).toBe("2026-03-10;Rest;Overig;12.50;0.88;");
  });

  it("neemt de rittenregistratie-kilometers mee, en laat de kolom leeg zonder km", () => {
    const withKm = expensesCsv([row({ kilometers: 42 })]).split("\r\n");
    expect(withKm[1]).toBe("2026-03-10;Treinkaartje;Reiskosten;12.50;0.88;42");
    const zeroKm = expensesCsv([row({ kilometers: 0 })]).split("\r\n");
    expect(zeroKm[1]).toBe("2026-03-10;Treinkaartje;Reiskosten;12.50;0.88;");
  });

  it("dekt formule-injectie in de omschrijving af (CWE-1236)", () => {
    const lines = expensesCsv([row({ description: "=SOM(A1)" })]).split("\r\n");
    // De leidende '=' krijgt een apostrof-prefix zodat een spreadsheet het niet als formule uitvoert.
    expect(lines[1]).toContain(";'=SOM(A1);");
  });

  it("levert alleen de kopregel bij een lege lijst", () => {
    expect(expensesCsv([])).toBe(EXPENSES_EXPORT_HEADERS.join(";"));
  });

  it("verwerkt negatieve centen (correctie) met minteken", () => {
    const lines = expensesCsv([row({ netCents: -500, vatCents: 0 })]).split("\r\n");
    expect(lines[1]).toContain(";-5.00;0.00");
  });
});
