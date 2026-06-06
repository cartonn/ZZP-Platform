import { describe, expect, it } from "vitest";
import { planPastDue, type PastDueCandidate } from "@/lib/past-due";

const now = new Date("2026-06-20T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

const cand = (o: Partial<PastDueCandidate> & { id: string }): PastDueCandidate => ({
  userId: `u-${o.id}`,
  pastDueAt: daysAgo(1),
  updatedAt: daysAgo(1),
  ...o,
});

describe("planPastDue", () => {
  it("herinnert op exact dag 1, 3 en 7", () => {
    const plan = planPastDue(
      [
        cand({ id: "d1", pastDueAt: daysAgo(1) }),
        cand({ id: "d3", pastDueAt: daysAgo(3) }),
        cand({ id: "d7", pastDueAt: daysAgo(7) }),
      ],
      now,
    );
    expect(plan.reminders.map((r) => `${r.subscriptionId}:${r.day}`)).toEqual([
      "d1:1",
      "d3:3",
      "d7:7",
    ]);
    expect(plan.downgrades).toEqual([]);
  });

  it("herinnert niet op tussenliggende dagen (2, 4, 5, 6)", () => {
    const plan = planPastDue([cand({ id: "d2", pastDueAt: daysAgo(2) })], now);
    expect(plan.reminders).toEqual([]);
    expect(plan.downgrades).toEqual([]);
  });

  it("downgradet vanaf dag 8 (na de herinneringsladder)", () => {
    const plan = planPastDue([cand({ id: "old", pastDueAt: daysAgo(8) })], now);
    expect(plan.reminders).toEqual([]);
    expect(plan.downgrades.map((d) => d.subscriptionId)).toEqual(["old"]);
    expect(plan.downgrades[0]?.dedupeKey).toBe("subscription-downgrade-old");
  });

  it("valt terug op updatedAt als pastDueAt ontbreekt (oude rijen)", () => {
    const plan = planPastDue([cand({ id: "legacy", pastDueAt: null, updatedAt: daysAgo(3) })], now);
    expect(plan.reminders.map((r) => r.day)).toEqual([3]);
  });

  it("gebruikt stabiele dedup-sleutels per dag", () => {
    const plan = planPastDue([cand({ id: "x", pastDueAt: daysAgo(1) })], now);
    expect(plan.reminders[0]?.dedupeKey).toBe("subscription-past-due-x-day-1");
  });
});
