import { describe, expect, it } from "vitest";
import type { BillingDeliveryFreshness } from "@/lib/observability/billing-delivery-freshness";
import { billingWebhookAuthStatusItem } from "@/lib/observability/billing-webhook-auth-status";

function freshness(over: Partial<BillingDeliveryFreshness>): BillingDeliveryFreshness {
  return {
    status: "never",
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    consecutiveFailures: 0,
    failureAgeSeconds: null,
    driver: null,
    ...over,
  };
}

describe("billingWebhookAuthStatusItem", () => {
  it("never → neutraal ok, meldt eerlijk dat er nog niets getekend binnenkwam", () => {
    const item = billingWebhookAuthStatusItem(freshness({ status: "never" }));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("billing-webhook-auth-heartbeat");
    expect(item.mode).toContain("nog geen");
  });

  it("ok → geldige handtekening", () => {
    const item = billingWebhookAuthStatusItem(freshness({ status: "ok" }));
    expect(item.level).toBe("ok");
    expect(item.mode).toBe("handtekening geldig");
  });

  it("failing → aandacht, noemt STRIPE_WEBHOOK_SECRET en telt de mislukkingen (meervoud)", () => {
    const item = billingWebhookAuthStatusItem(
      freshness({ status: "failing", consecutiveFailures: 4 }),
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toBe("handtekening ongeldig");
    expect(item.detail).toContain("STRIPE_WEBHOOK_SECRET");
    expect(item.detail).toContain("4 opeenvolgende ongeldige handtekeningen");
  });

  it("failing met één mislukking → enkelvoud", () => {
    const item = billingWebhookAuthStatusItem(
      freshness({ status: "failing", consecutiveFailures: 1 }),
    );
    expect(item.detail).toContain("1 opeenvolgende ongeldige handtekening");
    expect(item.detail).not.toContain("handtekeningen");
  });
});
