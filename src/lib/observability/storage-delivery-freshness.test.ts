import { describe, it, expect } from "vitest";
import {
  evaluateStorageDeliveryFreshness,
  storageDeliveryStatusItem,
  type StorageDeliveryHeartbeatFields,
} from "./storage-delivery-freshness";

const NOW = new Date("2026-08-21T12:00:00.000Z");

function fields(
  overrides: Partial<StorageDeliveryHeartbeatFields> = {},
): StorageDeliveryHeartbeatFields {
  return {
    lastAttemptAt: new Date("2026-08-21T11:59:00.000Z"),
    lastOk: true,
    lastSuccessAt: new Date("2026-08-21T11:59:00.000Z"),
    lastFailureAt: null,
    consecutiveFailures: 0,
    driver: "s3",
    ...overrides,
  };
}

describe("evaluateStorageDeliveryFreshness — event-gedreven operatie-oordeel", () => {
  it("null of geen laatste poging → never (neutraal gezond)", () => {
    expect(evaluateStorageDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluateStorageDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste operatie geslaagd → ok, teller 0", () => {
    const f = evaluateStorageDeliveryFreshness(fields(), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
    expect(f.driver).toBe("s3");
  });

  it("laatste operatie mislukt → failing met opeenvolgende teller + failure-leeftijd", () => {
    const f = evaluateStorageDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-21T11:55:00.000Z"),
        consecutiveFailures: 3,
      }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(3);
    expect(f.failureAgeSeconds).toBe(300); // 5 min
  });

  it("ok-status negeert een oude failure-teller (geen stale attributie)", () => {
    const f = evaluateStorageDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9, lastFailureAt: new Date("2026-08-20") }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluateStorageDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-21T12:05:00.000Z"),
        consecutiveFailures: 1,
      }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("robuust tegen een negatieve/niet-eindige teller → 0", () => {
    const f = evaluateStorageDeliveryFreshness(
      fields({ lastOk: false, consecutiveFailures: -4, lastFailureAt: NOW }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("storageDeliveryStatusItem — StatusItem-vertaling", () => {
  it("never → ok-niveau, geen alarm", () => {
    const item = storageDeliveryStatusItem(evaluateStorageDeliveryFreshness(null, NOW));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("storage-delivery-heartbeat");
  });

  it("ok → ok-niveau met driver in de mode", () => {
    const item = storageDeliveryStatusItem(evaluateStorageDeliveryFreshness(fields(), NOW));
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("s3");
  });

  it("failing → attention-niveau, noemt het aantal mislukkingen", () => {
    const item = storageDeliveryStatusItem(
      evaluateStorageDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 3, lastFailureAt: NOW }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("3");
  });

  it("bevat nooit een storage-key/pad — alleen driver-modus en oordeel", () => {
    const item = storageDeliveryStatusItem(
      evaluateStorageDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 1, lastFailureAt: NOW }),
        NOW,
      ),
    );
    const text = `${item.label} ${item.mode} ${item.detail}`;
    // Geen jaar/uuid-achtige storage-key (generateStorageKey → "<jaar>/<uuid>.<ext>").
    expect(text).not.toMatch(/\b\d{4}\/[0-9a-f-]{8,}/);
  });
});
