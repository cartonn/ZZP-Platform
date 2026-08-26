import { describe, expect, it } from "vitest";

import {
  evaluateErrorMonitoringDeliveryFreshness,
  errorMonitoringDeliveryStatusItem,
  type ErrorMonitoringDeliveryHeartbeatFields,
} from "@/lib/observability/error-monitoring-delivery-freshness";

const NOW = new Date("2026-08-26T12:00:00.000Z");
const at = (msOffset: number) => new Date(NOW.getTime() + msOffset);

const fields = (
  override: Partial<ErrorMonitoringDeliveryHeartbeatFields>,
): ErrorMonitoringDeliveryHeartbeatFields => ({
  lastAttemptAt: NOW,
  lastOk: true,
  lastSuccessAt: NOW,
  lastFailureAt: null,
  consecutiveFailures: 0,
  driver: "sentry",
  ...override,
});

describe("evaluateErrorMonitoringDeliveryFreshness", () => {
  it("null of geen poging → never (neutraal gezond)", () => {
    expect(evaluateErrorMonitoringDeliveryFreshness(null, NOW).status).toBe("never");
    expect(
      evaluateErrorMonitoringDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status,
    ).toBe("never");
  });

  it("laatste operatie geslaagd → ok, teller 0", () => {
    const f = evaluateErrorMonitoringDeliveryFreshness(fields({ lastOk: true }), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("laatste operatie mislukt → failing met teller en leeftijd", () => {
    const f = evaluateErrorMonitoringDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(-45_000), consecutiveFailures: 5 }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(5);
    expect(f.failureAgeSeconds).toBe(45);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluateErrorMonitoringDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(60_000), consecutiveFailures: 1 }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("negatieve/niet-eindige teller wordt 0", () => {
    const f = evaluateErrorMonitoringDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: -3 }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });

  it("een geslaagde laatste operatie nult de teller ook al stond die hoog", () => {
    const f = evaluateErrorMonitoringDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9 }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("errorMonitoringDeliveryStatusItem", () => {
  it("never → ok-niveau, verwijst naar de env-variabele (geen secret-waarde)", () => {
    const item = errorMonitoringDeliveryStatusItem(
      evaluateErrorMonitoringDeliveryFreshness(null, NOW),
    );
    expect(item.level).toBe("ok");
    expect(item.key).toBe("error-monitoring-delivery-heartbeat");
    // De uitleg noemt de env-VARIABELENAAM (config-hint), nooit een concrete DSN-URL/token.
    expect(item.detail).toContain("SENTRY_DSN");
  });

  it("failing → attention-niveau met driver in de modus + herstel-hint", () => {
    const item = errorMonitoringDeliveryStatusItem(
      evaluateErrorMonitoringDeliveryFreshness(
        fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: 3 }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toContain("sentry");
    expect(item.detail).toContain("@sentry/nextjs");
  });

  it("ok → ok-niveau, operationeel", () => {
    const item = errorMonitoringDeliveryStatusItem(
      evaluateErrorMonitoringDeliveryFreshness(fields({ lastOk: true }), NOW),
    );
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("operationeel");
  });
});
