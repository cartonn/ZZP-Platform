import { describe, it, expect } from "vitest";
import {
  isSubscriptionActive,
  planSubscriptionExpiry,
  SUBSCRIPTION_RENEWAL_REMINDER_DAYS,
  type SubscriptionExpiryCandidate,
} from "@/lib/subscription-lifecycle";

const NOW = new Date("2026-07-04T12:00:00.000Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe("isSubscriptionActive", () => {
  it("is actief bij ACTIVE zonder periode-einde (gratis/demo-perpetueel)", () => {
    expect(isSubscriptionActive({ status: "ACTIVE", currentPeriodEnd: null }, NOW)).toBe(true);
  });

  it("is actief bij ACTIVE met een periode die nog loopt", () => {
    expect(isSubscriptionActive({ status: "ACTIVE", currentPeriodEnd: days(3) }, NOW)).toBe(true);
  });

  it("is NIET actief bij ACTIVE met een verlopen periode", () => {
    expect(isSubscriptionActive({ status: "ACTIVE", currentPeriodEnd: days(-1) }, NOW)).toBe(false);
  });

  it("behandelt exact-nu als verlopen (periode-einde is exclusief)", () => {
    expect(isSubscriptionActive({ status: "ACTIVE", currentPeriodEnd: new Date(NOW) }, NOW)).toBe(
      false,
    );
  });

  it("is NIET actief bij PENDING/PAST_DUE/CANCELLED, ongeacht de periode", () => {
    for (const status of ["PENDING", "PAST_DUE", "CANCELLED"]) {
      expect(isSubscriptionActive({ status, currentPeriodEnd: days(30) }, NOW)).toBe(false);
    }
  });
});

describe("planSubscriptionExpiry", () => {
  const cand = (id: string, end: Date): SubscriptionExpiryCandidate => ({
    id,
    userId: `u-${id}`,
    currentPeriodEnd: end,
  });

  it("plant verval voor een reeds verlopen periode (en géén herinnering meer)", () => {
    const plan = planSubscriptionExpiry([cand("a", days(-2))], NOW);
    expect(plan.expiries).toHaveLength(1);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.expiries[0]).toMatchObject({ subscriptionId: "a", userId: "u-a" });
  });

  it("plant verval wanneer de periode exact nu eindigt", () => {
    const plan = planSubscriptionExpiry([cand("a", new Date(NOW))], NOW);
    expect(plan.expiries).toHaveLength(1);
    expect(plan.reminders).toHaveLength(0);
  });

  it("plant een 7-daagse herinnering binnen 7 dagen vóór verval", () => {
    const plan = planSubscriptionExpiry([cand("a", days(5))], NOW);
    expect(plan.expiries).toHaveLength(0);
    expect(plan.reminders).toHaveLength(1);
    expect(plan.reminders[0]?.daysUntil).toBe(7);
  });

  it("kiest de strengste (1-daagse) bucket op de laatste dag", () => {
    const plan = planSubscriptionExpiry([cand("a", days(1))], NOW);
    expect(plan.reminders[0]?.daysUntil).toBe(1);
  });

  it("plant niets voor een periode die verder weg is dan de grootste drempel", () => {
    const plan = planSubscriptionExpiry([cand("a", days(30))], NOW);
    expect(plan.reminders).toHaveLength(0);
    expect(plan.expiries).toHaveLength(0);
  });

  it("gebruikt de periode-einddatum als per-periode-token in de dedupeKey", () => {
    const end = days(5);
    const plan = planSubscriptionExpiry([cand("a", end)], NOW);
    expect(plan.reminders[0]?.dedupeKey).toBe(`sub-renewal:a:${end.getTime()}:7`);
    const expired = planSubscriptionExpiry([cand("b", days(-1))], NOW);
    expect(expired.expiries[0]?.dedupeKey).toBe(`sub-expiry:b:${days(-1).getTime()}`);
  });

  it("verschuift de dedupeKey mee als de periode wordt verlengd (renewal → verse keys)", () => {
    const p1 = planSubscriptionExpiry([cand("a", days(5))], NOW);
    const p2 = planSubscriptionExpiry([cand("a", days(35))], days(30)); // verlengd, later gedraaid
    // Nieuwe periode ligt te ver weg → geen herinnering; maar de key-vorm verschilt hoe dan ook.
    expect(p2.reminders.map((r) => r.dedupeKey)).not.toContain(p1.reminders[0]?.dedupeKey);
  });

  it("verwerkt meerdere kandidaten onafhankelijk", () => {
    const plan = planSubscriptionExpiry(
      [cand("expired", days(-1)), cand("soon", days(1)), cand("far", days(20))],
      NOW,
    );
    expect(plan.expiries.map((e) => e.subscriptionId)).toEqual(["expired"]);
    expect(plan.reminders.map((r) => r.subscriptionId)).toEqual(["soon"]);
  });

  it("exporteert de drempels aflopend van grof naar fijn", () => {
    expect([...SUBSCRIPTION_RENEWAL_REMINDER_DAYS]).toEqual([7, 1]);
  });
});
