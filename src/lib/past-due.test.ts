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
    const since = daysAgo(8);
    const plan = planPastDue([cand({ id: "old", pastDueAt: since })], now);
    expect(plan.reminders).toEqual([]);
    expect(plan.downgrades.map((d) => d.subscriptionId)).toEqual(["old"]);
    expect(plan.downgrades[0]?.dedupeKey).toBe(`subscription-downgrade-old-${since.getTime()}`);
  });

  it("valt terug op updatedAt als pastDueAt ontbreekt (oude rijen)", () => {
    const plan = planPastDue([cand({ id: "legacy", pastDueAt: null, updatedAt: daysAgo(3) })], now);
    expect(plan.reminders.map((r) => r.day)).toEqual([3]);
  });

  it("gebruikt stabiele dedup-sleutels per dag, met cyclus-discriminator", () => {
    const since = daysAgo(1);
    const plan = planPastDue([cand({ id: "x", pastDueAt: since })], now);
    expect(plan.reminders[0]?.dedupeKey).toBe(`subscription-past-due-x-${since.getTime()}-day-1`);
  });

  it("vuurt een verse ladder bij een tweede PAST_DUE-episode op dezelfde abonnement-rij", () => {
    // Een abonnement-rij wordt hergebruikt (uniek per userId): na her-aanmelding kan een latere
    // betaling opnieuw mislukken met een verse pastDueAt. De dedupeKeys moeten dan verschillen van
    // de eerste episode, anders filtert de runner ze als "al gevuurd" weg en mist de klant elke
    // herinnering + de downgrade.
    const firstEpisode = planPastDue([cand({ id: "sub", pastDueAt: daysAgo(1) })], now);
    // Tweede episode: zelfde id, maar een nieuwe pastDueAt (verse mislukking, één dag oud t.o.v. later).
    const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const secondPastDue = new Date(later.getTime() - 1 * 24 * 60 * 60 * 1000);
    const secondEpisode = planPastDue([cand({ id: "sub", pastDueAt: secondPastDue })], later);

    const firstKey = firstEpisode.reminders[0]?.dedupeKey;
    const secondKey = secondEpisode.reminders[0]?.dedupeKey;
    expect(firstKey).toBeDefined();
    expect(secondKey).toBeDefined();
    expect(secondKey).not.toBe(firstKey);
  });
});
