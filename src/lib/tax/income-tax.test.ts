import { describe, expect, it } from "vitest";
import {
  progressiveTax,
  taxableProfit,
  estimateIncomeTax,
  marginalIncomeTaxRateBps,
  MARGINAL_PROBE_CENTS,
} from "@/lib/tax/income-tax";
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

describe("marginalIncomeTaxRateBps", () => {
  it("winst binnen de eerste schijf: ~35,9% marginaal (MKB-vrijstelling × 35,82% + Zvw)", () => {
    // €30.000 winst, urencriterium gehaald: de aftrek is een vast bedrag (niet marginaal),
    // dus de volgende euro wordt belast na 12,7% MKB-vrijstelling in de eerste schijf.
    // 0,873 × (35,82% + 5,26%) ≈ 35,86%.
    const bps = marginalIncomeTaxRateBps({ profitCents: 3000000, urencriteriumMet: true });
    expect(bps).toBeGreaterThan(3560);
    expect(bps).toBeLessThan(3610);
  });

  it("winst volledig onder de zelfstandigenaftrek → marginaal 0% (volgende euro nog aftrekbaar)", () => {
    // €0 winst, urencriterium gehaald, probe €1.000 < zelfstandigenaftrek €1.200 → geheel geabsorbeerd.
    expect(marginalIncomeTaxRateBps({ profitCents: 0, urencriteriumMet: true })).toBe(0);
  });

  it("progressief: marginale voet in de toptariefschijf ligt hoger dan in de eerste schijf", () => {
    const laag = marginalIncomeTaxRateBps({ profitCents: 3000000, urencriteriumMet: true });
    const hoog = marginalIncomeTaxRateBps({ profitCents: 10000000, urencriteriumMet: true });
    expect(hoog).toBeGreaterThan(laag);
  });

  it("nooit negatief; ligt onder het nominale toptarief (49,5%)", () => {
    const bps = marginalIncomeTaxRateBps({ profitCents: 12000000, urencriteriumMet: true });
    expect(bps).toBeGreaterThanOrEqual(0);
    expect(bps).toBeLessThan(4950);
  });

  it("zonder urencriterium wordt de eerste euro al belast (geen aftrek om te absorberen)", () => {
    const bps = marginalIncomeTaxRateBps({ profitCents: 0, urencriteriumMet: false });
    expect(bps).toBeGreaterThan(0);
  });

  it("standaard-probe is € 1.000", () => {
    expect(MARGINAL_PROBE_CENTS).toBe(100000);
  });
});
