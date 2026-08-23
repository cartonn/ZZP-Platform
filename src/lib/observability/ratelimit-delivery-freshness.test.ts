import { describe, it, expect } from "vitest";
import {
  evaluateRateLimitDeliveryFreshness,
  rateLimitDeliveryStatusItem,
  type RateLimitDeliveryHeartbeatFields,
} from "./ratelimit-delivery-freshness";

const NOW = new Date("2026-08-23T12:00:00.000Z");

function fields(
  overrides: Partial<RateLimitDeliveryHeartbeatFields> = {},
): RateLimitDeliveryHeartbeatFields {
  return {
    lastAttemptAt: new Date("2026-08-23T11:59:00.000Z"),
    lastOk: true,
    lastSuccessAt: new Date("2026-08-23T11:59:00.000Z"),
    lastFailureAt: null,
    consecutiveFailures: 0,
    driver: "upstash",
    ...overrides,
  };
}

describe("evaluateRateLimitDeliveryFreshness — event-gedreven operatie-oordeel", () => {
  it("null of geen laatste poging → never (neutraal gezond)", () => {
    expect(evaluateRateLimitDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluateRateLimitDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste operatie geslaagd → ok, teller 0", () => {
    const f = evaluateRateLimitDeliveryFreshness(fields(), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
    expect(f.driver).toBe("upstash");
  });

  it("laatste operatie mislukt → failing met opeenvolgende teller + failure-leeftijd", () => {
    const f = evaluateRateLimitDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-23T11:55:00.000Z"),
        consecutiveFailures: 3,
      }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(3);
    expect(f.failureAgeSeconds).toBe(300); // 5 min
  });

  it("ok-status negeert een oude failure-teller (geen stale attributie)", () => {
    const f = evaluateRateLimitDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9, lastFailureAt: new Date("2026-08-22") }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluateRateLimitDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-23T12:05:00.000Z"),
        consecutiveFailures: 1,
      }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("robuust tegen een negatieve/niet-eindige teller → 0", () => {
    const f = evaluateRateLimitDeliveryFreshness(
      fields({ lastOk: false, consecutiveFailures: -4, lastFailureAt: NOW }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("rateLimitDeliveryStatusItem — StatusItem-vertaling", () => {
  it("never → ok-niveau, geen alarm", () => {
    const item = rateLimitDeliveryStatusItem(evaluateRateLimitDeliveryFreshness(null, NOW));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("ratelimit-delivery-heartbeat");
  });

  it("ok → ok-niveau met driver in de mode", () => {
    const item = rateLimitDeliveryStatusItem(evaluateRateLimitDeliveryFreshness(fields(), NOW));
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("upstash");
  });

  it("failing → attention-niveau, noemt het aantal mislukkingen + de fail-open-implicatie", () => {
    const item = rateLimitDeliveryStatusItem(
      evaluateRateLimitDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 3, lastFailureAt: NOW }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("3");
    expect(item.detail.toLowerCase()).toContain("fail-open");
  });

  it("bevat nooit een rate-limit-key of secret — alleen driver-modus en oordeel", () => {
    const item = rateLimitDeliveryStatusItem(
      evaluateRateLimitDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 1, lastFailureAt: NOW }),
        NOW,
      ),
    );
    const text = `${item.label} ${item.mode} ${item.detail}`;
    // Geen genamespacete rate-limit-key ("rl:...") en geen Upstash-REST-token/URL.
    expect(text).not.toMatch(/rl:/);
    expect(text).not.toMatch(/https?:\/\//);
  });
});
