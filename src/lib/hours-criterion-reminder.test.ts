import { describe, it, expect } from "vitest";
import {
  hoursCriterionCheckpoint,
  planHoursCriterionReminders,
  HOURS_REMINDER_MIN_PROJECTED_BPS,
} from "@/lib/hours-criterion-reminder";

// Halverwege het jaar: elapsed = 182 dagen, totalDays = 364 → prognose = 2× de huidige uren.
// Dat maakt de projectie in deze tests exact voorspelbaar.
const NOW_H2 = new Date("2026-07-02T12:00:00.000Z");
const NOW_Q4 = new Date("2026-10-02T12:00:00.000Z");
const NOW_EARLY = new Date("2026-03-01T12:00:00.000Z");

describe("hoursCriterionCheckpoint", () => {
  it("jan–jun → null (te vroeg)", () => {
    expect(hoursCriterionCheckpoint(new Date("2026-01-15T00:00:00Z"))).toBeNull();
    expect(hoursCriterionCheckpoint(new Date("2026-06-30T00:00:00Z"))).toBeNull();
  });
  it("jul–sep → H2", () => {
    expect(hoursCriterionCheckpoint(new Date("2026-07-01T00:00:00Z"))).toBe("H2");
    expect(hoursCriterionCheckpoint(new Date("2026-09-30T00:00:00Z"))).toBe("H2");
  });
  it("okt–dec → Q4", () => {
    expect(hoursCriterionCheckpoint(new Date("2026-10-01T00:00:00Z"))).toBe("Q4");
    expect(hoursCriterionCheckpoint(new Date("2026-12-31T00:00:00Z"))).toBe("Q4");
  });
});

describe("planHoursCriterionReminders", () => {
  it("vóór het venster → geen herinneringen, ongeacht de uren", () => {
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 500, indirectHours: 0 }],
      NOW_EARLY,
    );
    expect(plan.reminders).toEqual([]);
  });

  it("op koers (prognose ≥ 1.225) → geen herinnering", () => {
    // 700u halverwege → prognose ~1400 → projectedMet → geen nudge.
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 700, indirectHours: 0 }],
      NOW_H2,
    );
    expect(plan.reminders).toEqual([]);
  });

  it("criterium al gehaald → geen herinnering", () => {
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 1300, indirectHours: 0 }],
      NOW_H2,
    );
    expect(plan.reminders).toEqual([]);
  });

  it("geen geregistreerde uren → geen herinnering (ruis vermijden)", () => {
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 0, indirectHours: 0 }],
      NOW_H2,
    );
    expect(plan.reminders).toEqual([]);
  });

  it("buiten realistisch bereik (prognose < 60% van 1.225) → geen herinnering", () => {
    // 200u halverwege → prognose ~400 → projectedBps ~3265 < drempel → ontmoedigende nudge vermeden.
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 200, indirectHours: 0 }],
      NOW_H2,
    );
    expect(plan.reminders).toEqual([]);
  });

  it("achterlopend maar binnen bereik → herinnering met resterende uren + dedupeKey", () => {
    // 500u halverwege → prognose ~1000 (< 1225, ≥ 735) → nudge. remaining = 1225 - 500 = 725.
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 300, indirectHours: 200 }],
      NOW_H2,
    );
    expect(plan.reminders).toHaveLength(1);
    const r = plan.reminders[0]!;
    expect(r.userId).toBe("u-1");
    expect(r.year).toBe(2026);
    expect(r.checkpoint).toBe("H2");
    expect(r.remainingHours).toBe(725);
    expect(r.notificationType).toBe("HOURS_CRITERION_REMINDER");
    expect(r.dedupeKey).toBe("hours-criterion-reminder-u-1-2026-H2");
    expect(r.title).toContain("725 uur");
  });

  it("Q4-checkpoint → aparte dedupeKey + jaar-loopt-af tekst", () => {
    // Later in het jaar projecteert dezelfde koers lager; 700u begin okt → prognose ~927 (binnen bereik).
    const plan = planHoursCriterionReminders(
      [{ userId: "u-1", directHours: 700, indirectHours: 0 }],
      NOW_Q4,
    );
    expect(plan.reminders).toHaveLength(1);
    const r = plan.reminders[0]!;
    expect(r.checkpoint).toBe("Q4");
    expect(r.dedupeKey).toBe("hours-criterion-reminder-u-1-2026-Q4");
    expect(r.body).toContain("Het jaar loopt af");
  });

  it("meerdere kandidaten → alleen de achterlopende-maar-haalbare krijgt een nudge", () => {
    const plan = planHoursCriterionReminders(
      [
        { userId: "on-track", directHours: 700, indirectHours: 0 },
        { userId: "at-risk", directHours: 500, indirectHours: 0 },
        { userId: "hopeless", directHours: 100, indirectHours: 0 },
        { userId: "idle", directHours: 0, indirectHours: 0 },
      ],
      NOW_H2,
    );
    expect(plan.reminders.map((r) => r.userId)).toEqual(["at-risk"]);
  });

  it("de drempel is een geëxporteerde, uitlegbare constante", () => {
    expect(HOURS_REMINDER_MIN_PROJECTED_BPS).toBe(6000);
  });
});
