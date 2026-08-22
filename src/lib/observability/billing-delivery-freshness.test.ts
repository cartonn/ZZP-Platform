import { describe, it, expect } from "vitest";
import {
  evaluateBillingDeliveryFreshness,
  billingDeliveryStatusItem,
  type BillingDeliveryHeartbeatFields,
} from "./billing-delivery-freshness";

const NOW = new Date("2026-08-22T12:00:00.000Z");

function fields(
  overrides: Partial<BillingDeliveryHeartbeatFields> = {},
): BillingDeliveryHeartbeatFields {
  return {
    lastAttemptAt: new Date("2026-08-22T11:59:00.000Z"),
    lastOk: true,
    lastSuccessAt: new Date("2026-08-22T11:59:00.000Z"),
    lastFailureAt: null,
    consecutiveFailures: 0,
    driver: "stripe",
    ...overrides,
  };
}

describe("evaluateBillingDeliveryFreshness — event-gedreven operatie-oordeel", () => {
  it("null of geen laatste poging → never (neutraal gezond)", () => {
    expect(evaluateBillingDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluateBillingDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste operatie geslaagd → ok, teller 0", () => {
    const f = evaluateBillingDeliveryFreshness(fields(), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
    expect(f.driver).toBe("stripe");
  });

  it("laatste operatie mislukt → failing met opeenvolgende teller + failure-leeftijd", () => {
    const f = evaluateBillingDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-22T11:55:00.000Z"),
        consecutiveFailures: 4,
        driver: "mollie",
      }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(4);
    expect(f.failureAgeSeconds).toBe(300);
    expect(f.driver).toBe("mollie");
  });

  it("ok-oordeel dwingt de teller naar 0 ook als de rij een oude teller draagt", () => {
    const f = evaluateBillingDeliveryFreshness(fields({ consecutiveFailures: 9 }), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("robuust tegen klok-scheefstand: mislukking in de toekomst → leeftijd 0", () => {
    const f = evaluateBillingDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: new Date("2026-08-22T12:05:00.000Z") }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("robuust tegen niet-eindige/negatieve teller → 0", () => {
    const f = evaluateBillingDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: Number.NaN }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("billingDeliveryStatusItem — StatusItem-vertaling", () => {
  it("never → ok-niveau, neutrale tekst", () => {
    const item = billingDeliveryStatusItem(evaluateBillingDeliveryFreshness(null, NOW));
    expect(item.key).toBe("billing-delivery-heartbeat");
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("nog geen operatie");
  });

  it("ok → ok-niveau met driver-suffix", () => {
    const item = billingDeliveryStatusItem(evaluateBillingDeliveryFreshness(fields(), NOW));
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("operationeel");
    expect(item.mode).toContain("stripe");
  });

  it("failing → attention-niveau met mislukking-telling", () => {
    const item = billingDeliveryStatusItem(
      evaluateBillingDeliveryFreshness(
        fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: 3, driver: "mollie" }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toContain("wijst af");
    expect(item.detail).toContain("3 opeenvolgende");
  });
});
