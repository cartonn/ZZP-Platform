import { describe, expect, it } from "vitest";
import {
  MEANINGFUL_ONE_WAY_MINUTES,
  WORK_HOURS_PER_DAY,
  representativeRateEuros,
  summarizeEffectiveRate,
} from "@/lib/effective-rate";

describe("representativeRateEuros", () => {
  it("neemt het midden van een volledige band", () => {
    expect(representativeRateEuros(40, 60)).toBe(50);
  });

  it("rondt het midden af", () => {
    expect(representativeRateEuros(40, 45)).toBe(43); // 42.5 → 43
  });

  it("gebruikt de enige vermelde grens", () => {
    expect(representativeRateEuros(40, null)).toBe(40);
    expect(representativeRateEuros(null, 60)).toBe(60);
  });

  it("geeft null zonder tarief", () => {
    expect(representativeRateEuros(null, null)).toBeNull();
  });

  it("negeert niet-positieve of niet-eindige grenzen defensief", () => {
    expect(representativeRateEuros(0, 60)).toBe(60);
    expect(representativeRateEuros(-10, 60)).toBe(60);
    expect(representativeRateEuros(Number.NaN, 60)).toBe(60);
    expect(representativeRateEuros(Number.POSITIVE_INFINITY, null)).toBeNull();
  });
});

describe("summarizeEffectiveRate", () => {
  it("corrigeert het tarief voor de retour-reistijd", () => {
    // 45 €/u, 45 min enkele reis → 1,5 u retour; 45*8/(8+1,5)=37,89 → 38
    const s = summarizeEffectiveRate({
      rateMinEuros: 45,
      rateMaxEuros: 45,
      oneWayTravelMinutes: 45,
    });
    expect(s).not.toBeNull();
    expect(s!.headlineRateEuros).toBe(45);
    expect(s!.effectiveHourlyEuros).toBe(38);
    expect(s!.roundTripMinutes).toBe(90);
    expect(s!.unpaidTravelHoursPerDay).toBe(1.5);
    expect(s!.workHoursPerDay).toBe(WORK_HOURS_PER_DAY);
    // drag: 1,5/(8+1,5)=15,8% → 16
    expect(s!.dragPct).toBe(16);
  });

  it("gebruikt het bandmidden als vertrekpunt", () => {
    const s = summarizeEffectiveRate({
      rateMinEuros: 40,
      rateMaxEuros: 60,
      oneWayTravelMinutes: 30,
    });
    expect(s!.headlineRateEuros).toBe(50);
    // 50*8/(8+1)=44,4 → 44
    expect(s!.effectiveHourlyEuros).toBe(44);
  });

  it("geeft null zonder tarief", () => {
    expect(
      summarizeEffectiveRate({ rateMinEuros: null, rateMaxEuros: null, oneWayTravelMinutes: 40 }),
    ).toBeNull();
  });

  it("geeft null bij onbekende reistijd", () => {
    expect(
      summarizeEffectiveRate({ rateMinEuros: 45, rateMaxEuros: 45, oneWayTravelMinutes: null }),
    ).toBeNull();
  });

  it("geeft null onder de betekenisdrempel", () => {
    expect(
      summarizeEffectiveRate({
        rateMinEuros: 45,
        rateMaxEuros: 45,
        oneWayTravelMinutes: MEANINGFUL_ONE_WAY_MINUTES - 1,
      }),
    ).toBeNull();
  });

  it("toont vanaf precies de betekenisdrempel", () => {
    const s = summarizeEffectiveRate({
      rateMinEuros: 45,
      rateMaxEuros: 45,
      oneWayTravelMinutes: MEANINGFUL_ONE_WAY_MINUTES,
    });
    expect(s).not.toBeNull();
    // 10 min enkele reis → 20 min retour → 1/3 u; 45*8/(8+0,333)=43,2 → 43
    expect(s!.effectiveHourlyEuros).toBe(43);
  });

  it("respecteert een aangepaste werkdag (kortere dag = zwaardere drag)", () => {
    const s4 = summarizeEffectiveRate({
      rateMinEuros: 45,
      rateMaxEuros: 45,
      oneWayTravelMinutes: 45,
      workHoursPerDay: 4,
    });
    // 45*4/(4+1,5)=32,7 → 33; drag 1,5/5,5=27,3 → 27
    expect(s4!.effectiveHourlyEuros).toBe(33);
    expect(s4!.dragPct).toBe(27);
    expect(s4!.workHoursPerDay).toBe(4);
  });

  it("valt terug op de standaardwerkdag bij een ongeldige waarde", () => {
    const s = summarizeEffectiveRate({
      rateMinEuros: 45,
      rateMaxEuros: 45,
      oneWayTravelMinutes: 45,
      workHoursPerDay: 0,
    });
    expect(s!.workHoursPerDay).toBe(WORK_HOURS_PER_DAY);
  });

  it("effectief tarief is nooit hoger dan het gepubliceerde tarief", () => {
    for (const oneWay of [10, 25, 60, 120]) {
      const s = summarizeEffectiveRate({
        rateMinEuros: 50,
        rateMaxEuros: 50,
        oneWayTravelMinutes: oneWay,
      });
      expect(s!.effectiveHourlyEuros).toBeLessThanOrEqual(50);
      expect(s!.dragPct).toBeGreaterThan(0);
    }
  });
});
