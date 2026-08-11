import { describe, it, expect } from "vitest";
import {
  evaluateMailDeliveryFreshness,
  mailDeliveryStatusItem,
  type MailDeliveryHeartbeatFields,
} from "./mail-delivery-freshness";

const NOW = new Date("2026-08-11T12:00:00.000Z");

function fields(overrides: Partial<MailDeliveryHeartbeatFields> = {}): MailDeliveryHeartbeatFields {
  return {
    lastAttemptAt: new Date("2026-08-11T11:59:00.000Z"),
    lastOk: true,
    lastSuccessAt: new Date("2026-08-11T11:59:00.000Z"),
    lastFailureAt: null,
    consecutiveFailures: 0,
    driver: "resend",
    ...overrides,
  };
}

describe("evaluateMailDeliveryFreshness — event-gedreven aflever-oordeel", () => {
  it("null of geen laatste poging → never (neutraal gezond)", () => {
    expect(evaluateMailDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluateMailDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste verzending geslaagd → ok, teller 0", () => {
    const f = evaluateMailDeliveryFreshness(fields(), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
    expect(f.driver).toBe("resend");
  });

  it("laatste verzending mislukt → failing met opeenvolgende teller + failure-leeftijd", () => {
    const f = evaluateMailDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-11T11:55:00.000Z"),
        consecutiveFailures: 3,
      }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(3);
    expect(f.failureAgeSeconds).toBe(300); // 5 min
  });

  it("ok-status negeert een oude failure-teller (geen stale attributie)", () => {
    const f = evaluateMailDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9, lastFailureAt: new Date("2026-08-10") }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluateMailDeliveryFreshness(
      fields({
        lastOk: false,
        lastFailureAt: new Date("2026-08-11T12:05:00.000Z"),
        consecutiveFailures: 1,
      }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("robuust tegen een negatieve/niet-eindige teller → 0", () => {
    const f = evaluateMailDeliveryFreshness(
      fields({ lastOk: false, consecutiveFailures: -4, lastFailureAt: NOW }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("mailDeliveryStatusItem — StatusItem-vertaling", () => {
  it("never → ok-niveau, geen alarm", () => {
    const item = mailDeliveryStatusItem(evaluateMailDeliveryFreshness(null, NOW));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("mail-delivery-heartbeat");
  });

  it("ok → ok-niveau met driver in de mode", () => {
    const item = mailDeliveryStatusItem(evaluateMailDeliveryFreshness(fields(), NOW));
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("resend");
  });

  it("failing → attention-niveau, noemt het aantal mislukkingen", () => {
    const item = mailDeliveryStatusItem(
      evaluateMailDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 3, lastFailureAt: NOW }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.detail).toContain("3");
  });

  it("bevat nooit PII (adres/onderwerp) — alleen driver-modus en oordeel", () => {
    const item = mailDeliveryStatusItem(
      evaluateMailDeliveryFreshness(
        fields({ lastOk: false, consecutiveFailures: 1, lastFailureAt: NOW }),
        NOW,
      ),
    );
    const text = `${item.label} ${item.mode} ${item.detail}`;
    expect(text).not.toMatch(/@/); // geen e-mailadres
  });
});
