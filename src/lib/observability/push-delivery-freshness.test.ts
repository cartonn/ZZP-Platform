import { describe, it, expect } from "vitest";
import {
  evaluatePushDeliveryFreshness,
  pushDeliveryStatusItem,
  type PushDeliveryHeartbeatFields,
} from "./push-delivery-freshness";

const NOW = new Date("2026-08-17T12:00:00.000Z");

function fields(overrides: Partial<PushDeliveryHeartbeatFields> = {}): PushDeliveryHeartbeatFields {
  return {
    lastAttemptAt: new Date("2026-08-17T11:59:00.000Z"),
    lastOk: true,
    lastSuccessAt: new Date("2026-08-17T11:59:00.000Z"),
    lastFailureAt: null,
    consecutiveFailures: 0,
    ...overrides,
  };
}

describe("evaluatePushDeliveryFreshness — event-gedreven aflever-oordeel", () => {
  it("null of geen laatste poging → never (neutraal gezond)", () => {
    expect(evaluatePushDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluatePushDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste afleverronde geslaagd → ok, teller 0", () => {
    const f = evaluatePushDeliveryFreshness(fields(), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("laatste afleverronde mislukt → failing met opeenvolgende teller + failure-leeftijd", () => {
    const f = evaluatePushDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-17T11:55:00.000Z"),
        consecutiveFailures: 3,
      }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(3);
    expect(f.failureAgeSeconds).toBe(300); // 5 min
  });

  it("ok-status negeert een oude failure-teller (geen stale attributie)", () => {
    const f = evaluatePushDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9, lastFailureAt: new Date("2026-08-16") }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluatePushDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-17T12:05:00.000Z"),
        consecutiveFailures: 1,
      }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("robuust tegen een negatieve/niet-eindige teller → 0", () => {
    const f = evaluatePushDeliveryFreshness(
      fields({ lastOk: false, consecutiveFailures: -4, lastFailureAt: NOW }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("pushDeliveryStatusItem — StatusItem-vertaling", () => {
  it("never → ok-niveau, geen alarm", () => {
    const item = pushDeliveryStatusItem(evaluatePushDeliveryFreshness(null, NOW));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("push-delivery-heartbeat");
  });

  it("ok → ok-niveau", () => {
    const item = pushDeliveryStatusItem(evaluatePushDeliveryFreshness(fields(), NOW));
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("levert af");
  });

  it("failing → attention-niveau, noemt het aantal mislukkingen", () => {
    const item = pushDeliveryStatusItem(
      evaluatePushDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 3, lastFailureAt: NOW }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("3");
  });

  it("bevat nooit PII of secrets — alleen oordeel en teller", () => {
    const item = pushDeliveryStatusItem(
      evaluatePushDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 1, lastFailureAt: NOW }),
        NOW,
      ),
    );
    const text = `${item.label} ${item.mode} ${item.detail}`;
    expect(text).not.toMatch(/@/); // geen adres/subject
    expect(text).not.toMatch(/BEl|key|token/i);
  });
});
