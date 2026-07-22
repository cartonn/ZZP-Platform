import { describe, expect, it } from "vitest";
import { hoursCriterion } from "@/lib/tax/hours-criterion";

describe("hoursCriterion", () => {
  it("telt directe + indirecte uren en berekent resterend tot 1.225", () => {
    const r = hoursCriterion({
      directHours: 400,
      indirectHours: 100,
      now: new Date("2026-06-01T12:00:00Z"),
    });
    expect(r.totalHours).toBe(500);
    expect(r.targetHours).toBe(1225);
    expect(r.remainingHours).toBe(725);
    expect(r.met).toBe(false);
  });

  it("gehaald criterium: met=true, remaining=0, progress gecapt op 100%", () => {
    const r = hoursCriterion({
      directHours: 1200,
      indirectHours: 100,
      now: new Date("2026-10-01T12:00:00Z"),
    });
    expect(r.met).toBe(true);
    expect(r.remainingHours).toBe(0);
    expect(r.progressBps).toBe(10000);
  });

  it("prognose: lineaire extrapolatie naar jaareinde", () => {
    // Halverwege het jaar 600 uur → prognose ~1.200 (net niet gehaald)
    const r = hoursCriterion({
      directHours: 600,
      indirectHours: 0,
      now: new Date("2026-07-02T12:00:00Z"),
    });
    expect(r.projectedTotal).toBeGreaterThan(1100);
    expect(r.projectedTotal).toBeLessThan(1300);
  });

  it("op koers: weinig tijd verstreken, veel uren → projectedMet=true", () => {
    const r = hoursCriterion({
      directHours: 400,
      indirectHours: 0,
      now: new Date("2026-02-01T12:00:00Z"),
    });
    expect(r.projectedMet).toBe(true);
  });

  it("negatieve invoer wordt op nul gezet", () => {
    const r = hoursCriterion({
      directHours: -10,
      indirectHours: -5,
      now: new Date("2026-06-01T12:00:00Z"),
    });
    expect(r.totalHours).toBe(0);
  });

  it("berekent resterende weken en benodigd weektempo bij achterstand", () => {
    // Begin juli, 600 uur → 625 uur te gaan, ~26 weken tot 31 dec.
    const r = hoursCriterion({
      directHours: 600,
      indirectHours: 0,
      now: new Date("2026-07-02T12:00:00Z"),
    });
    expect(r.weeksRemaining).toBeGreaterThanOrEqual(25);
    expect(r.weeksRemaining).toBeLessThanOrEqual(27);
    // Benodigd tempo = resterende uren / exacte resterende weken, naar boven afgerond.
    expect(r.hoursPerWeekNeeded).toBeGreaterThan(0);
    expect(r.hoursPerWeekNeeded).toBeGreaterThanOrEqual(Math.ceil(625 / 27));
    expect(r.hoursPerWeekNeeded).toBeLessThanOrEqual(Math.ceil(625 / 25));
  });

  it("gehaald criterium: geen benodigd weektempo meer", () => {
    const r = hoursCriterion({
      directHours: 1300,
      indirectHours: 0,
      now: new Date("2026-07-02T12:00:00Z"),
    });
    expect(r.met).toBe(true);
    expect(r.hoursPerWeekNeeded).toBe(0);
  });

  it("vlak voor het jaareinde met grote achterstand: onhaalbaar hoog tempo, 0 hele weken", () => {
    const r = hoursCriterion({
      directHours: 200,
      indirectHours: 0,
      now: new Date("2026-12-28T12:00:00Z"),
    });
    expect(r.weeksRemaining).toBe(0);
    expect(r.hoursPerWeekNeeded).toBeGreaterThan(40);
  });
});
