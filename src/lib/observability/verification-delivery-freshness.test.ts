import { describe, it, expect } from "vitest";
import {
  aggregateVerificationDelivery,
  evaluateVerificationDeliveryFreshness,
  verificationDeliveryStatusItem,
  type VerificationAdapterFreshness,
} from "./verification-delivery-freshness";

const NOW = new Date("2026-08-23T12:00:00.000Z");

function adapter(
  key: string,
  label: string,
  fields: Parameters<typeof evaluateVerificationDeliveryFreshness>[0],
): VerificationAdapterFreshness {
  return { key, label, freshness: evaluateVerificationDeliveryFreshness(fields, NOW) };
}

describe("evaluateVerificationDeliveryFreshness", () => {
  it("geeft 'never' zonder heartbeat (neutraal gezond)", () => {
    const f = evaluateVerificationDeliveryFreshness(null, NOW);
    expect(f.status).toBe("never");
    expect(f.consecutiveFailures).toBe(0);
    expect(f.failureAgeSeconds).toBeNull();
  });

  it("geeft 'ok' wanneer de laatste operatie slaagde", () => {
    const f = evaluateVerificationDeliveryFreshness(
      {
        lastAttemptAt: new Date(NOW.getTime() - 60_000),
        lastOk: true,
        lastSuccessAt: new Date(NOW.getTime() - 60_000),
        lastFailureAt: null,
        consecutiveFailures: 0,
        driver: "duo",
      },
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
    expect(f.driver).toBe("duo");
  });

  it("geeft 'failing' met teller + leeftijd wanneer de laatste operatie mislukte", () => {
    const f = evaluateVerificationDeliveryFreshness(
      {
        lastAttemptAt: new Date(NOW.getTime() - 30_000),
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: new Date(NOW.getTime() - 30_000),
        consecutiveFailures: 4,
        driver: "bigregister",
      },
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(4);
    expect(f.failureAgeSeconds).toBe(30);
  });

  it("is robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0) en negatieve teller", () => {
    const f = evaluateVerificationDeliveryFreshness(
      {
        lastAttemptAt: new Date(NOW.getTime() + 5_000),
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: new Date(NOW.getTime() + 5_000),
        consecutiveFailures: -3,
        driver: "idin",
      },
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("aggregateVerificationDelivery", () => {
  it("geeft 'never' wanneer geen enkel register ooit een operatie deed", () => {
    const agg = aggregateVerificationDelivery([
      adapter("diploma", "DUO", null),
      adapter("big", "BIG", null),
    ]);
    expect(agg.status).toBe("never");
    expect(agg.failingLabels).toEqual([]);
  });

  it("geeft 'ok' wanneer minstens één register slaagde en geen enkel register faalt", () => {
    const agg = aggregateVerificationDelivery([
      adapter("diploma", "DUO", {
        lastAttemptAt: NOW,
        lastOk: true,
        lastSuccessAt: NOW,
        lastFailureAt: null,
        consecutiveFailures: 0,
        driver: "duo",
      }),
      adapter("big", "BIG", null),
    ]);
    expect(agg.status).toBe("ok");
  });

  it("aggregeert pessimistisch: één falend register maskeert nooit → status 'failing'", () => {
    const agg = aggregateVerificationDelivery([
      adapter("diploma", "DUO — diploma's", {
        lastAttemptAt: NOW,
        lastOk: true,
        lastSuccessAt: NOW,
        lastFailureAt: null,
        consecutiveFailures: 0,
        driver: "duo",
      }),
      adapter("big", "BIG-register", {
        lastAttemptAt: new Date(NOW.getTime() - 10_000),
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: new Date(NOW.getTime() - 10_000),
        consecutiveFailures: 5,
        driver: "bigregister",
      }),
    ]);
    expect(agg.status).toBe("failing");
    expect(agg.consecutiveFailures).toBe(5);
    expect(agg.failureAgeSeconds).toBe(10);
    expect(agg.failingLabels).toEqual(["BIG-register"]);
  });

  it("neemt de hoogste teller en de meest recente mislukking over meerdere falende registers", () => {
    const agg = aggregateVerificationDelivery([
      adapter("diploma", "DUO", {
        lastAttemptAt: new Date(NOW.getTime() - 100_000),
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: new Date(NOW.getTime() - 100_000),
        consecutiveFailures: 2,
        driver: "duo",
      }),
      adapter("big", "BIG", {
        lastAttemptAt: new Date(NOW.getTime() - 20_000),
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: new Date(NOW.getTime() - 20_000),
        consecutiveFailures: 9,
        driver: "bigregister",
      }),
    ]);
    expect(agg.consecutiveFailures).toBe(9);
    expect(agg.failureAgeSeconds).toBe(20);
    expect(agg.failingLabels).toEqual(["DUO", "BIG"]);
  });
});

describe("verificationDeliveryStatusItem", () => {
  it("'never' → level ok, geen vals groen", () => {
    const item = verificationDeliveryStatusItem({
      status: "never",
      consecutiveFailures: 0,
      failureAgeSeconds: null,
      failingLabels: [],
    });
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("nog geen operatie");
  });

  it("'failing' → level attention en noemt de falende registers", () => {
    const item = verificationDeliveryStatusItem({
      status: "failing",
      consecutiveFailures: 3,
      failureAgeSeconds: 10,
      failingLabels: ["BIG-register"],
    });
    expect(item.level).toBe("attention");
    expect(item.mode).toContain("BIG-register");
    expect(item.detail).toContain("3 opeenvolgende");
  });

  it("'ok' → level ok", () => {
    const item = verificationDeliveryStatusItem({
      status: "ok",
      consecutiveFailures: 0,
      failureAgeSeconds: null,
      failingLabels: [],
    });
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("operationeel");
  });
});
