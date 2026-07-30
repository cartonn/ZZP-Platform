import { describe, expect, it } from "vitest";
import { type LedgerEntry } from "./overview";
import { buildVatDeclaration } from "./vat-declaration";

// Helper: één grootboekregel op een datum in Q1 2026 (tenzij anders opgegeven).
function entry(
  account: LedgerEntry["account"],
  { debit = 0, credit = 0, at = new Date("2026-02-15T10:00:00Z") } = {},
): LedgerEntry {
  return { party: "FREELANCER", account, debitCents: debit, creditCents: credit, occurredAt: at };
}

describe("buildVatDeclaration", () => {
  it("mapt omzet + BTW naar rubriek 1a (grondslag + omzetbelasting)", () => {
    // Factuur: € 1.000 omzet, € 210 af te dragen BTW.
    const entries: LedgerEntry[] = [
      entry("OMZET", { credit: 100_000 }),
      entry("BTW_AF_TE_DRAGEN", { credit: 21_000 }),
    ];
    const decl = buildVatDeclaration(entries, "FREELANCER", 2026, 1);
    const r1a = decl.rubrieken.find((r) => r.code === "1a");
    expect(r1a).toMatchObject({ baseCents: 100_000, vatCents: 21_000 });
  });

  it("zet de verschuldigde BTW in 5a en de voorbelasting in 5b", () => {
    const entries: LedgerEntry[] = [
      entry("OMZET", { credit: 100_000 }),
      entry("BTW_AF_TE_DRAGEN", { credit: 21_000 }),
      entry("BTW_VOORBELASTING", { debit: 5_000 }),
    ];
    const decl = buildVatDeclaration(entries, "FREELANCER", 2026, 1);
    expect(decl.rubrieken.find((r) => r.code === "5a")?.vatCents).toBe(21_000);
    expect(decl.rubrieken.find((r) => r.code === "5b")?.vatCents).toBe(5_000);
    expect(decl.rubrieken.find((r) => r.code === "5b")?.baseCents).toBeNull();
  });

  it("berekent het saldo (5g) als verschuldigd − voorbelasting: te betalen", () => {
    const entries: LedgerEntry[] = [
      entry("OMZET", { credit: 100_000 }),
      entry("BTW_AF_TE_DRAGEN", { credit: 21_000 }),
      entry("BTW_VOORBELASTING", { debit: 5_000 }),
    ];
    const decl = buildVatDeclaration(entries, "FREELANCER", 2026, 1);
    expect(decl.balanceCents).toBe(16_000);
  });

  it("geeft een negatief saldo (terug te ontvangen) wanneer de voorbelasting groter is", () => {
    const entries: LedgerEntry[] = [
      entry("BTW_AF_TE_DRAGEN", { credit: 2_000 }),
      entry("BTW_VOORBELASTING", { debit: 5_000 }),
    ];
    const decl = buildVatDeclaration(entries, "FREELANCER", 2026, 1);
    expect(decl.balanceCents).toBe(-3_000);
  });

  it("telt alleen boekingen binnen het gevraagde kwartaal", () => {
    const entries: LedgerEntry[] = [
      entry("OMZET", { credit: 100_000, at: new Date("2026-02-15T10:00:00Z") }), // Q1
      entry("BTW_AF_TE_DRAGEN", { credit: 21_000, at: new Date("2026-02-15T10:00:00Z") }), // Q1
      entry("OMZET", { credit: 500_000, at: new Date("2026-05-15T10:00:00Z") }), // Q2 — telt niet mee
    ];
    const decl = buildVatDeclaration(entries, "FREELANCER", 2026, 1);
    expect(decl.rubrieken.find((r) => r.code === "1a")?.baseCents).toBe(100_000);
  });

  it("levert nul-rubrieken bij een leeg kwartaal (geen boekingen)", () => {
    const decl = buildVatDeclaration([], "FREELANCER", 2026, 1);
    expect(decl.balanceCents).toBe(0);
    expect(decl.rubrieken.map((r) => r.vatCents)).toEqual([0, 0, 0]);
    expect(decl.rubrieken.find((r) => r.code === "1a")?.baseCents).toBe(0);
  });
});
