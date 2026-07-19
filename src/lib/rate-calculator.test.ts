import { describe, expect, it } from "vitest";
import { requiredHourlyRate } from "@/lib/rate-calculator";
import { estimateIncomeTax } from "@/lib/tax/income-tax";
import { URENCRITERIUM_HOURS } from "@/lib/tax/config";

describe("requiredHourlyRate", () => {
  it("weigert ongeldige/onvolledige invoer (nul, negatief, niet-eindig)", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(requiredHourlyRate({ targetNetAnnualCents: bad, billableHoursPerYear: 1400 }).ok).toBe(
        false,
      );
      expect(
        requiredHourlyRate({ targetNetAnnualCents: 3_000_000, billableHoursPerYear: bad }).ok,
      ).toBe(false);
    }
  });

  it("de gevonden winst levert (na heffing) precies het netto-doel op", () => {
    const target = 3_600_000; // € 36.000 netto
    const res = requiredHourlyRate({
      targetNetAnnualCents: target,
      billableHoursPerYear: 1400,
    });
    expect(res.ok).toBe(true);
    // net(winst) ≥ doel, en het is de kleinste zulke winst (één cent lager haalt het doel niet).
    expect(res.netAnnualCents).toBeGreaterThanOrEqual(target);
    const oneLess = res.requiredProfitCents - 1;
    const netOneLess =
      oneLess - estimateIncomeTax({ profitCents: oneLess, urencriteriumMet: true }).totalCents;
    expect(netOneLess).toBeLessThan(target);
  });

  it("uurtarief = omzet / declarabele uren, en heffing komt uit de gedeelde IB/Zvw-motor", () => {
    const res = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1600,
    });
    expect(res.requiredRevenueCents).toBe(res.requiredProfitCents); // geen kosten
    expect(res.requiredHourlyRateCents).toBe(Math.ceil(res.requiredRevenueCents / 1600));
    const tax = estimateIncomeTax({ profitCents: res.requiredProfitCents, urencriteriumMet: true });
    expect(res.incomeTaxCents).toBe(tax.totalCents);
    expect(res.effectiveRateBps).toBe(tax.effectiveRateBps);
  });

  it("een hoger netto-doel vraagt een hoger uurtarief (monotoon)", () => {
    const low = requiredHourlyRate({ targetNetAnnualCents: 3_000_000, billableHoursPerYear: 1400 });
    const high = requiredHourlyRate({
      targetNetAnnualCents: 5_000_000,
      billableHoursPerYear: 1400,
    });
    expect(high.requiredHourlyRateCents).toBeGreaterThan(low.requiredHourlyRateCents);
  });

  it("meer declarabele uren verlagen het benodigde uurtarief", () => {
    const few = requiredHourlyRate({ targetNetAnnualCents: 4_000_000, billableHoursPerYear: 1000 });
    const many = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1800,
    });
    expect(many.requiredHourlyRateCents).toBeLessThan(few.requiredHourlyRateCents);
  });

  it("zakelijke kosten verhogen de benodigde omzet en het uurtarief", () => {
    const zonder = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1400,
    });
    const met = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1400,
      annualCostsCents: 600_000, // € 6.000 kosten
    });
    // Winst (grondslag) is gelijk — kosten drukken alleen door in omzet/uurtarief.
    expect(met.requiredProfitCents).toBe(zonder.requiredProfitCents);
    expect(met.requiredRevenueCents).toBe(zonder.requiredRevenueCents + 600_000);
    expect(met.requiredHourlyRateCents).toBeGreaterThan(zonder.requiredHourlyRateCents);
  });

  it("leidt het urencriterium af uit de declarabele uren wanneer niet opgegeven", () => {
    const onder = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: URENCRITERIUM_HOURS - 1,
    });
    const boven = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: URENCRITERIUM_HOURS + 1,
    });
    expect(onder.urencriteriumMet).toBe(false);
    expect(boven.urencriteriumMet).toBe(true);
    // Zonder ondernemersaftrek is de winst (bij gelijk doel) hoger.
    const onderGelijk = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1400,
      urencriteriumMet: false,
    });
    const bovenGelijk = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1400,
      urencriteriumMet: true,
    });
    expect(onderGelijk.requiredProfitCents).toBeGreaterThan(bovenGelijk.requiredProfitCents);
  });

  it("startersaftrek verlaagt de benodigde winst bij gelijk doel", () => {
    const zonder = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1400,
      urencriteriumMet: true,
    });
    const met = requiredHourlyRate({
      targetNetAnnualCents: 4_000_000,
      billableHoursPerYear: 1400,
      urencriteriumMet: true,
      starter: true,
    });
    expect(met.requiredProfitCents).toBeLessThan(zonder.requiredProfitCents);
  });

  it("hanteert een laag doel waar de heffing na aftrek nul is (winst = doel)", () => {
    const res = requiredHourlyRate({
      targetNetAnnualCents: 100_000, // € 1.000 — valt binnen de aftrek → geen heffing
      billableHoursPerYear: 1400,
      urencriteriumMet: true,
    });
    expect(res.ok).toBe(true);
    expect(res.incomeTaxCents).toBe(0);
    expect(res.requiredProfitCents).toBe(100_000);
  });
});
