import { describe, expect, it } from "vitest";

import {
  evaluatePasswordBreachDeliveryFreshness,
  passwordBreachDeliveryStatusItem,
  type PasswordBreachDeliveryHeartbeatFields,
} from "@/lib/observability/password-breach-delivery-freshness";

const NOW = new Date("2026-08-25T12:00:00.000Z");
const at = (msOffset: number) => new Date(NOW.getTime() + msOffset);

const fields = (
  override: Partial<PasswordBreachDeliveryHeartbeatFields>,
): PasswordBreachDeliveryHeartbeatFields => ({
  lastAttemptAt: NOW,
  lastOk: true,
  lastSuccessAt: NOW,
  lastFailureAt: null,
  consecutiveFailures: 0,
  driver: "hibp",
  ...override,
});

describe("evaluatePasswordBreachDeliveryFreshness", () => {
  it("null of geen poging → never (neutraal gezond)", () => {
    expect(evaluatePasswordBreachDeliveryFreshness(null, NOW).status).toBe("never");
    expect(
      evaluatePasswordBreachDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status,
    ).toBe("never");
  });

  it("laatste operatie geslaagd → ok, teller 0", () => {
    const f = evaluatePasswordBreachDeliveryFreshness(fields({ lastOk: true }), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("laatste operatie mislukt → failing met teller en leeftijd", () => {
    const f = evaluatePasswordBreachDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: at(-30_000),
        consecutiveFailures: 4,
      }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(4);
    expect(f.failureAgeSeconds).toBe(30);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluatePasswordBreachDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(60_000), consecutiveFailures: 1 }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("negatieve/niet-eindige teller wordt 0", () => {
    const f = evaluatePasswordBreachDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: -3 }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("passwordBreachDeliveryStatusItem", () => {
  it("never → ok-niveau, uitleg zonder secrets", () => {
    const item = passwordBreachDeliveryStatusItem(
      evaluatePasswordBreachDeliveryFreshness(null, NOW),
    );
    expect(item.level).toBe("ok");
    expect(item.key).toBe("password-breach-delivery-heartbeat");
  });

  it("failing → attention-niveau met driver in de modus", () => {
    const item = passwordBreachDeliveryStatusItem(
      evaluatePasswordBreachDeliveryFreshness(
        fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: 3 }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toContain("hibp");
    expect(item.detail).toMatch(/credential-stuffing/i);
  });

  it("ok → ok-niveau, operationeel", () => {
    const item = passwordBreachDeliveryStatusItem(
      evaluatePasswordBreachDeliveryFreshness(fields({ lastOk: true }), NOW),
    );
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("operationeel");
  });
});
