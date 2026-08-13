import { describe, expect, it } from "vitest";
import { hoursCriterion } from "@/lib/tax/hours-criterion";
import {
  hoursCriterionHint,
  hoursCriterionNeedsAction,
  hoursPaceFeasibility,
  hoursProgressPercent,
  type HoursCriterionSummary,
} from "@/lib/tax/hours-criterion-summary";

const NOW = new Date("2026-07-01T12:00:00Z");

/** Bouwt een `HoursCriterionSummary` zoals `getHoursCriterionSummary` dat doet (zonder DB). */
function buildSummary(
  directHours: number,
  indirectHours: number,
  now: Date,
): HoursCriterionSummary {
  const criterion = hoursCriterion({ directHours, indirectHours, now });
  return {
    ...criterion,
    year: now.getUTCFullYear(),
    noActivity: directHours + indirectHours === 0,
    feasibility: hoursPaceFeasibility(criterion),
    hint: hoursCriterionHint(criterion),
  };
}

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

  it("noemt bij achterstand de resterende uren, het benodigde weektempo en de indirecte-uren-actie", () => {
    const behind = hoursCriterion({ directHours: 100, indirectHours: 0, now: NOW });
    expect(behind.met).toBe(false);
    expect(behind.projectedMet).toBe(false);
    const hint = hoursCriterionHint(behind);
    expect(hint).toContain(String(behind.remainingHours));
    expect(hint).toContain(`${behind.hoursPerWeekNeeded} uur/week`);
    expect(hint).toContain("indirecte uren");
  });

  it("meldt bij een onhaalbaar tempo dat het dit jaar niet meer lukt", () => {
    // Vlak voor het jaareinde met grote achterstand → onhaalbaar.
    const late = hoursCriterion({
      directHours: 200,
      indirectHours: 0,
      now: new Date("2026-12-28T12:00:00Z"),
    });
    expect(hoursPaceFeasibility(late)).toBe("onhaalbaar");
    expect(hoursCriterionHint(late)).toContain("niet meer te halen");
  });
});

describe("hoursPaceFeasibility", () => {
  it("gehaald zodra het criterium bereikt is", () => {
    const done = hoursCriterion({ directHours: 1225, indirectHours: 0, now: NOW });
    expect(hoursPaceFeasibility(done)).toBe("gehaald");
  });

  it("op-koers wanneer de lineaire prognose de grens haalt", () => {
    const onTrack = hoursCriterion({ directHours: 700, indirectHours: 0, now: NOW });
    expect(onTrack.projectedMet).toBe(true);
    expect(hoursPaceFeasibility(onTrack)).toBe("op-koers");
  });

  it("haalbaar bij een rustig benodigd weektempo (≤25 u/week)", () => {
    // Begin juli, 600 uur → prognose ~1.200 (net niet) en ~25 u/week nog nodig: rustig in te lopen.
    const behind = hoursCriterion({
      directHours: 600,
      indirectHours: 0,
      now: new Date("2026-07-02T12:00:00Z"),
    });
    expect(behind.projectedMet).toBe(false);
    expect(behind.hoursPerWeekNeeded).toBeLessThanOrEqual(25);
    expect(hoursPaceFeasibility(behind)).toBe("haalbaar");
  });

  it("ambitieus bij een fors benodigd weektempo (26–40 u/week)", () => {
    // Begin oktober met flinke achterstand → hoger, maar nog net haalbaar tempo.
    const behind = hoursCriterion({
      directHours: 800,
      indirectHours: 0,
      now: new Date("2026-10-08T12:00:00Z"),
    });
    expect(behind.projectedMet).toBe(false);
    expect(behind.hoursPerWeekNeeded).toBeGreaterThan(25);
    expect(behind.hoursPerWeekNeeded).toBeLessThanOrEqual(40);
    expect(hoursPaceFeasibility(behind)).toBe("ambitieus");
  });
});

describe("hoursCriterionNeedsAction", () => {
  it("nudget in het seizoen (H2) bij een achterstand met een rustig tempo (haalbaar)", () => {
    const s = buildSummary(600, 0, new Date("2026-07-02T12:00:00Z"));
    expect(s.feasibility).toBe("haalbaar");
    expect(hoursCriterionNeedsAction(s, new Date("2026-07-02T12:00:00Z"))).toBe(true);
  });

  it("nudget in Q4 bij een fors maar nog haalbaar tempo (ambitieus)", () => {
    const now = new Date("2026-10-08T12:00:00Z");
    const s = buildSummary(800, 0, now);
    expect(s.feasibility).toBe("ambitieus");
    expect(hoursCriterionNeedsAction(s, now)).toBe(true);
  });

  it("nudget NIET buiten het seizoen (jan–jun), ook al is er achterstand", () => {
    const now = new Date("2026-03-15T12:00:00Z");
    const s = buildSummary(200, 0, now);
    expect(hoursCriterionNeedsAction(s, now)).toBe(false);
  });

  it("nudget NIET zonder activiteit (geen enkel geboekt uur)", () => {
    const s = buildSummary(0, 0, NOW);
    expect(s.noActivity).toBe(true);
    expect(hoursCriterionNeedsAction(s, NOW)).toBe(false);
  });

  it("nudget NIET wanneer het criterium al gehaald is", () => {
    const s = buildSummary(1225, 0, NOW);
    expect(s.met).toBe(true);
    expect(hoursCriterionNeedsAction(s, NOW)).toBe(false);
  });

  it("nudget NIET wanneer de ZZP'er op koers ligt (prognose haalt de grens)", () => {
    const s = buildSummary(700, 0, NOW);
    expect(s.projectedMet).toBe(true);
    expect(hoursCriterionNeedsAction(s, NOW)).toBe(false);
  });

  it("nudget NIET wanneer het dit jaar realistisch niet meer haalbaar is (onhaalbaar) — ontmoedigt zonder handelingsperspectief", () => {
    const now = new Date("2026-12-28T12:00:00Z");
    const s = buildSummary(200, 0, now);
    expect(s.feasibility).toBe("onhaalbaar");
    expect(hoursCriterionNeedsAction(s, now)).toBe(false);
  });
});
