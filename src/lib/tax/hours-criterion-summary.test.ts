import { describe, expect, it } from "vitest";
import { hoursCriterion } from "@/lib/tax/hours-criterion";
import { hoursCriterionHint, hoursProgressPercent } from "@/lib/tax/hours-criterion-summary";

const NOW = new Date("2026-07-01T12:00:00Z");

describe("hoursProgressPercent", () => {
  it("zet basispunten om naar een afgerond percentage", () => {
    const half = hoursCriterion({ directHours: 500, indirectHours: 112, now: NOW }); // 612/1225 ≈ 49,96%
    expect(hoursProgressPercent(half)).toBe(50);
  });

  it("capt op 100% zodra het criterium gehaald is", () => {
    const done = hoursCriterion({ directHours: 1300, indirectHours: 0, now: NOW });
    expect(hoursProgressPercent(done)).toBe(100);
  });

  it("is 0% zonder geboekte uren", () => {
    const none = hoursCriterion({ directHours: 0, indirectHours: 0, now: NOW });
    expect(hoursProgressPercent(none)).toBe(0);
  });
});

describe("hoursCriterionHint", () => {
  it("meldt bij gehaald criterium dat de aftrek veiliggesteld is", () => {
    const done = hoursCriterion({ directHours: 1225, indirectHours: 0, now: NOW });
    expect(hoursCriterionHint(done)).toContain("veiliggesteld");
  });

  it("meldt bij op-koers de prognose én de resterende uren", () => {
    // Halverwege het jaar met 700 uur → lineaire prognose ~1.400 uur → op koers.
    const onTrack = hoursCriterion({ directHours: 700, indirectHours: 0, now: NOW });
    expect(onTrack.projectedMet).toBe(true);
    const hint = hoursCriterionHint(onTrack);
    expect(hint).toContain("koers");
    expect(hint).toContain(String(onTrack.remainingHours));
  });

  it("noemt bij achterstand de resterende uren en indirecte-uren-actie", () => {
    const behind = hoursCriterion({ directHours: 100, indirectHours: 0, now: NOW });
    expect(behind.met).toBe(false);
    expect(behind.projectedMet).toBe(false);
    const hint = hoursCriterionHint(behind);
    expect(hint).toContain(String(behind.remainingHours));
    expect(hint).toContain("indirecte uren");
  });
});
