import { describe, expect, it } from "vitest";
import { progressiveTax, taxableProfit, estimateIncomeTax } from "@/lib/tax/income-tax";
import { ZELFSTANDIGENAFTREK_CENTS, STARTERSAFTREK_CENTS } from "@/lib/tax/config";

describe("progressiveTax", () => {
  it("nul of negatieve grondslag → geen heffing", () => {
    expect(progressiveTax(0)).toBe(0);
    expect(progressiveTax(-100000)).toBe(0);
  });

  it("binnen de eerste schijf: 35,82%", () => {
    // €10.000 → 35,82% = €3.582
    expect(progressiveTax(1000000)).toBe(358200);
  });

  it("over de schijfgrens heen telt progressief op", () => {
    // €50.000: eerste €38.441 @ 35,82% + €11.559 @ 37,48%
    const expected = Math.round(3844100 * 0.3582 + (5000000 - 3844100) * 0.3748);
    expect(progressiveTax(5000000)).toBe(expected);
  });
});

describe("taxableProfit", () => {
  it("zonder urencriterium: geen zelfstandigen-/startersaftrek, wel MKB-vrijstelling", () => {
    const r = taxableProfit({ profitCents: 5000000, urencriteriumMet: false });
    expect(r.zelfstandigenaftrekCents).toBe(0);
    expect(r.startersaftrekCents).toBe(0);
    // MKB 12,7% over de volle winst
    expect(r.mkbVrijstellingCents).toBe(Math.round(5000000 * 0.127));
    expect(r.taxableProfitCents).toBe(5000000 - r.mkbVrijstellingCents);
  });

  it("met urencriterium: zelfstandigenaftrek toegepast", () => {
    const r = taxableProfit({ profitCents: 5000000, urencriteriumMet: true });
    expect(r.zelfstandigenaftrekCents).toBe(ZELFSTANDIGENAFTREK_CENTS);
  });

  it("starter met urencriterium: ook startersaftrek", () => {
    const r = taxableProfit({ profitCents: 5000000, urencriteriumMet: true, starter: true });
    expect(r.startersaftrekCents).toBe(STARTERSAFTREK_CENTS);
    const afterAftrek = 5000000 - ZELFSTANDIGENAFTREK_CENTS - STARTERSAFTREK_CENTS;
    expect(r.taxableProfitCents).toBe(afterAftrek - Math.round(afterAftrek * 0.127));
  });

  it("aftrek brengt de winst niet onder nul", () => {
    const r = taxableProfit({ profitCents: 50000, urencriteriumMet: true, starter: true });
    expect(r.taxableProfitCents).toBe(0);
    expect(r.zelfstandigenaftrekCents).toBe(50000); // gecapt op de winst
  });
});

describe("estimateIncomeTax", () => {
  it("geeft box1 + Zvw + totaal en effectief tarief", () => {
    const r = estimateIncomeTax({ profitCents: 6000000, urencriteriumMet: true, starter: false });
    expect(r.box1Cents).toBeGreaterThan(0);
    expect(r.zvwCents).toBeGreaterThan(0);
    expect(r.totalCents).toBe(r.box1Cents + r.zvwCents);
    expect(r.effectiveRateBps).toBeGreaterThan(0);
    expect(r.effectiveRateBps).toBeLessThan(5000); // effectief altijd onder de toptarief
  });

  it("urencriterium verlaagt de heffing (aftrek werkt)", () => {
    const met = estimateIncomeTax({ profitCents: 6000000, urencriteriumMet: true });
    const niet = estimateIncomeTax({ profitCents: 6000000, urencriteriumMet: false });
    expect(met.totalCents).toBeLessThan(niet.totalCents);
  });

  it("nul winst → nul heffing", () => {
    const r = estimateIncomeTax({ profitCents: 0, urencriteriumMet: true });
    expect(r.totalCents).toBe(0);
    expect(r.effectiveRateBps).toBe(0);
  });
});
