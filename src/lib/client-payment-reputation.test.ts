import { describe, expect, it } from "vitest";
import { paymentTermBenchmark, summarizePaymentReputation } from "@/lib/client-payment-reputation";
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

describe("paymentTermBenchmark", () => {
  it("markeert een snelle betaler als sneller dan de standaardtermijn (30 dagen)", () => {
    const b = paymentTermBenchmark(behavior({ tone: "good", avgDaysToPay: 12 }));
    expect(b).not.toBeNull();
    expect(b!.comparison).toBe("faster");
    expect(b!.standardDays).toBe(30);
    expect(b!.deltaDays).toBe(18);
    expect(b!.sentence).toMatch(/18 dagen sneller/i);
  });

  it("markeert een trage betaler als langzamer dan de standaardtermijn", () => {
    const b = paymentTermBenchmark(behavior({ tone: "warning", avgDaysToPay: 45, onTimePct: 40 }));
    expect(b!.comparison).toBe("slower");
    expect(b!.deltaDays).toBe(15);
    expect(b!.sentence).toMatch(/15 dagen langzamer/i);
  });

  it("toont binnen de marge (±3 dagen) 'rond de standaardtermijn'", () => {
    const b = paymentTermBenchmark(behavior({ tone: "neutral", avgDaysToPay: 31 }));
    expect(b!.comparison).toBe("around");
    expect(b!.sentence).toMatch(/rond de standaard betaaltermijn/i);
  });

  it("behandelt de marge-grens deterministisch: precies 3 dagen verschil is nog 'rond'", () => {
    expect(paymentTermBenchmark(behavior({ tone: "good", avgDaysToPay: 27 }))!.comparison).toBe(
      "around",
    );
    expect(paymentTermBenchmark(behavior({ tone: "warning", avgDaysToPay: 33 }))!.comparison).toBe(
      "around",
    );
    // Net buiten de marge (4 dagen) kantelt het naar faster/slower.
    expect(paymentTermBenchmark(behavior({ tone: "good", avgDaysToPay: 26 }))!.comparison).toBe(
      "faster",
    );
    expect(paymentTermBenchmark(behavior({ tone: "warning", avgDaysToPay: 34 }))!.comparison).toBe(
      "slower",
    );
  });

  it("geeft null zonder bruikbaar gemiddelde (unknown of ontbrekend)", () => {
    expect(paymentTermBenchmark(behavior({ tone: "unknown", avgDaysToPay: null }))).toBeNull();
    expect(paymentTermBenchmark(behavior({ avgDaysToPay: null }))).toBeNull();
  });
});
