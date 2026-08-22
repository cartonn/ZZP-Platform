import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock de gedeelde billing-aflever-heartbeat-writers zodat we het outcome→writer+kanaal-mappen kunnen
// verifiëren zonder DB. De webhook-auth-heartbeat is een dun laagje bovenop die writers met een eigen
// kanaalnaam — dit klinkt dat contract vast.
const success = vi.hoisted(() => vi.fn(async () => {}));
const failure = vi.hoisted(() => vi.fn(async () => {}));
const get = vi.hoisted(() => vi.fn(async () => ({}) as never));

vi.mock("@/lib/observability/billing-delivery-heartbeat", () => ({
  recordBillingDeliverySuccess: success,
  recordBillingDeliveryFailure: failure,
  getBillingDeliveryFreshness: get,
}));

import {
  PAYMENT_WEBHOOK_AUTH_CHANNEL,
  getWebhookAuthFreshness,
  recordWebhookAuthOutcome,
} from "@/lib/observability/billing-webhook-auth-heartbeat";

beforeEach(() => {
  success.mockClear();
  failure.mockClear();
  get.mockClear();
});

describe("recordWebhookAuthOutcome", () => {
  const now = new Date("2026-08-22T12:00:00Z");

  it("ok → registreert succes op het webhook-auth-kanaal, geen failure", async () => {
    await recordWebhookAuthOutcome("ok", "stripe", now);
    expect(success).toHaveBeenCalledWith("stripe", now, PAYMENT_WEBHOOK_AUTH_CHANNEL);
    expect(failure).not.toHaveBeenCalled();
  });

  it("invalid → registreert een mislukking op het webhook-auth-kanaal, geen succes", async () => {
    await recordWebhookAuthOutcome("invalid", "stripe", now);
    expect(failure).toHaveBeenCalledWith("stripe", now, PAYMENT_WEBHOOK_AUTH_CHANNEL);
    expect(success).not.toHaveBeenCalled();
  });

  it("not-applicable → registreert helemaal niets (ongetekend kanaal)", async () => {
    await recordWebhookAuthOutcome("not-applicable", "mollie", now);
    expect(success).not.toHaveBeenCalled();
    expect(failure).not.toHaveBeenCalled();
  });

  it("gebruikt een eigen kanaalnaam, los van het uitgaande betaalprovider-kanaal", () => {
    expect(PAYMENT_WEBHOOK_AUTH_CHANNEL).toBe("payment-webhook-auth");
  });
});

describe("getWebhookAuthFreshness", () => {
  it("leest de freshness op het webhook-auth-kanaal", async () => {
    const now = new Date("2026-08-22T12:00:00Z");
    await getWebhookAuthFreshness(now);
    expect(get).toHaveBeenCalledWith(now, PAYMENT_WEBHOOK_AUTH_CHANNEL);
  });
});
