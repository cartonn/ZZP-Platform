import { describe, expect, it } from "vitest";
import { summarizePaymentReputation } from "@/lib/client-payment-reputation";
import { type PaymentBehavior } from "@/lib/payment-behavior";

function behavior(overrides: Partial<PaymentBehavior> = {}): PaymentBehavior {
  return {
    sampleSize: 5,
    avgDaysToPay: 10,
    onTimePct: 95,
    tone: "good",
    ...overrides,
  };
}

describe("summarizePaymentReputation", () => {
  it("prijst een betrouwbare betaler (good) en toont cijfers", () => {
    const r = summarizePaymentReputation(behavior({ tone: "good" }));
    expect(r.tone).toBe("good");
    expect(r.hasStats).toBe(true);
    expect(r.headline).toMatch(/betrouwbare betaler/i);
    expect(r.tip.length).toBeGreaterThan(0);
  });

  it("nudget een neutrale betaler richting op-tijd betalen", () => {
    const r = summarizePaymentReputation(behavior({ tone: "neutral" }));
    expect(r.tone).toBe("neutral");
    expect(r.hasStats).toBe(true);
    expect(r.tip).toMatch(/vervaldatum|14 dagen/i);
  });

  it("waarschuwt een trage betaler dat het zijn reacties drukt", () => {
    const r = summarizePaymentReputation(
      behavior({ tone: "warning", avgDaysToPay: 45, onTimePct: 40 }),
    );
    expect(r.tone).toBe("warning");
    expect(r.hasStats).toBe(true);
    expect(r.headline).toMatch(/laat betaalt/i);
  });

  it("geeft bij te weinig historie (unknown) een opbouwende boodschap zonder cijfers", () => {
    const r = summarizePaymentReputation(
      behavior({ tone: "unknown", sampleSize: 1, avgDaysToPay: null, onTimePct: null }),
    );
    expect(r.tone).toBe("unknown");
    expect(r.hasStats).toBe(false);
    expect(r.headline).toMatch(/nog geen/i);
    expect(r.tip).toMatch(/eerste facturen/i);
  });
});
