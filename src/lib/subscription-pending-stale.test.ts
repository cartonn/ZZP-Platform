import { describe, expect, it } from "vitest";
import {
  parseSubscriptionPendingStaleHours,
  SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT,
  SUBSCRIPTION_PENDING_STALE_HOURS_MIN,
  SUBSCRIPTION_PENDING_STALE_HOURS_MAX,
} from "./config";
import { pendingStaleCutoff, stalePendingSubscriptionWhere } from "./subscription-pending-stale";

describe("parseSubscriptionPendingStaleHours", () => {
  it("valt terug op de default (24u) zonder waarde", () => {
    expect(parseSubscriptionPendingStaleHours(undefined)).toBe(
      SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT,
    );
    expect(parseSubscriptionPendingStaleHours("")).toBe(SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT);
    expect(parseSubscriptionPendingStaleHours("   ")).toBe(
      SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT,
    );
    expect(SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT).toBe(24);
  });

  it("valt terug op de default bij onzin/negatief/nul", () => {
    expect(parseSubscriptionPendingStaleHours("abc")).toBe(
      SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT,
    );
    expect(parseSubscriptionPendingStaleHours("0")).toBe(SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT);
    expect(parseSubscriptionPendingStaleHours("-3")).toBe(SUBSCRIPTION_PENDING_STALE_HOURS_DEFAULT);
  });

  it("neemt een geldige waarde over (afgekapt naar heel getal)", () => {
    expect(parseSubscriptionPendingStaleHours("48")).toBe(48);
    expect(parseSubscriptionPendingStaleHours("36.7")).toBe(36);
  });

  it("klemt binnen de veilige bandbreedte", () => {
    expect(parseSubscriptionPendingStaleHours("0.5")).toBe(SUBSCRIPTION_PENDING_STALE_HOURS_MIN);
    expect(parseSubscriptionPendingStaleHours("100000")).toBe(SUBSCRIPTION_PENDING_STALE_HOURS_MAX);
  });
});

describe("pendingStaleCutoff", () => {
  it("trekt het venster (in uren) van `now` af", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    expect(pendingStaleCutoff(24, now).toISOString()).toBe("2026-08-17T12:00:00.000Z");
    expect(pendingStaleCutoff(1, now).toISOString()).toBe("2026-08-18T11:00:00.000Z");
  });

  it("een groter venster levert een verder terugliggende cutoff", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    expect(pendingStaleCutoff(48, now).getTime()).toBeLessThan(
      pendingStaleCutoff(24, now).getTime(),
    );
  });
});

describe("stalePendingSubscriptionWhere", () => {
  it("filtert op status PENDING en updatedAt vóór de cutoff", () => {
    const cutoff = new Date("2026-08-17T12:00:00.000Z");
    expect(stalePendingSubscriptionWhere(cutoff)).toEqual({
      status: "PENDING",
      updatedAt: { lt: cutoff },
    });
  });

  it("gebruikt updatedAt (niet createdAt) zodat een verse checkout-poging de wachtklok reset", () => {
    const cutoff = new Date("2026-08-17T12:00:00.000Z");
    const where = stalePendingSubscriptionWhere(cutoff);
    expect(where).not.toHaveProperty("createdAt");
    expect(where).toHaveProperty("updatedAt");
  });
});
