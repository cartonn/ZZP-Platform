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
});
