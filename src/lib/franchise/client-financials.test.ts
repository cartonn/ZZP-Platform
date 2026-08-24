import { describe, expect, it } from "vitest";
import {
  agingBucketBadgeVariant,
  buildClientFinancialRelation,
  paymentHistorySentence,
} from "./client-financials";
import { type ClientOutstanding } from "./client-outstanding";
import { type PaymentBehavior } from "@/lib/payment-behavior";

function behavior(over: Partial<PaymentBehavior> = {}): PaymentBehavior {
  return { sampleSize: 0, avgDaysToPay: null, onTimePct: null, tone: "unknown", ...over };
}

function outstanding(over: Partial<ClientOutstanding> = {}): ClientOutstanding {
  return { totalOpenCents: 0, overdueCents: 0, overdueCount: 0, worstBucket: "notDue", ...over };
}

describe("agingBucketBadgeVariant", () => {
  it("mapt de zwaarste buckets op danger", () => {
    expect(agingBucketBadgeVariant("d61_90")).toBe("danger");
    expect(agingBucketBadgeVariant("d90plus")).toBe("danger");
  });

  it("mapt de lichtere te-late buckets op warning", () => {
    expect(agingBucketBadgeVariant("d0_30")).toBe("warning");
    expect(agingBucketBadgeVariant("d31_60")).toBe("warning");
  });

  it("mapt niet-vervallen op muted", () => {
    expect(agingBucketBadgeVariant("notDue")).toBe("muted");
  });
});

describe("paymentHistorySentence", () => {
  it("geeft null bij een te kleine steekproef", () => {
    expect(
      paymentHistorySentence(behavior({ sampleSize: 2, avgDaysToPay: 10, onTimePct: 100 })),
    ).toBe(null);
  });

  it("geeft null wanneer er geen bruikbaar cijfer is ondanks genoeg rijen", () => {
    expect(paymentHistorySentence(behavior({ sampleSize: 5 }))).toBe(null);
  });

  it("combineert gemiddelde dagen en op-tijd-percentage met steekproefgrootte", () => {
    expect(
      paymentHistorySentence(
        behavior({ sampleSize: 8, avgDaysToPay: 12, onTimePct: 75, tone: "good" }),
      ),
    ).toBe("gemiddeld 12 dagen na factuurdatum betaald · 75% op tijd (over 8 facturen)");
  });

  it("gebruikt enkelvoud voor dag en factuur", () => {
    expect(
      paymentHistorySentence(behavior({ sampleSize: 1, avgDaysToPay: 1, onTimePct: 100 })),
    ).toBe(
      null, // sampleSize < min → geen zin, ook al is het enkelvoud
    );
    expect(
      paymentHistorySentence(behavior({ sampleSize: 3, avgDaysToPay: 1, onTimePct: null })),
    ).toBe("gemiddeld 1 dag na factuurdatum betaald (over 3 facturen)");
  });

  it("toont alleen het op-tijd-percentage wanneer het gemiddelde ontbreekt", () => {
    expect(
      paymentHistorySentence(behavior({ sampleSize: 4, avgDaysToPay: null, onTimePct: 90 })),
    ).toBe("90% op tijd (over 4 facturen)");
  });
});

describe("buildClientFinancialRelation", () => {
  it("is leeg (hasAny=false) voor een verse klant zonder facturen of historie", () => {
    const view = buildClientFinancialRelation(null, behavior());
    expect(view.hasAny).toBe(false);
    expect(view.hasOutstanding).toBe(false);
    expect(view.worstBucket).toBe(null);
    expect(view.paymentChip).toBe(null);
    expect(view.historySentence).toBe(null);
    expect(view.totalOpenCents).toBe(0);
  });

  it("toont de kaart zodra er geld openstaat, ook zonder betaalhistorie", () => {
    const view = buildClientFinancialRelation(
      outstanding({
        totalOpenCents: 5000,
        overdueCents: 5000,
        overdueCount: 1,
        worstBucket: "d31_60",
      }),
      behavior(),
    );
    expect(view.hasAny).toBe(true);
    expect(view.hasOutstanding).toBe(true);
    expect(view.worstBucket).toBe("d31_60");
    expect(view.overdueCents).toBe(5000);
  });

  it("negeert de worstBucket wanneer er niets openstaat (totaal 0)", () => {
    const view = buildClientFinancialRelation(
      outstanding({ totalOpenCents: 0, worstBucket: "d90plus" }),
      behavior({ sampleSize: 5, avgDaysToPay: 8, onTimePct: 100, tone: "good" }),
    );
    expect(view.hasOutstanding).toBe(false);
    expect(view.worstBucket).toBe(null);
    // maar de betaalhistorie maakt de kaart tóch zichtbaar
    expect(view.hasAny).toBe(true);
    expect(view.paymentChip?.tone).toBe("good");
    expect(view.historySentence).toContain("over 5 facturen");
  });

  it("neemt de reputatiechip mee bij een uitgesproken toon", () => {
    const late = buildClientFinancialRelation(
      null,
      behavior({ sampleSize: 6, avgDaysToPay: 40, onTimePct: 20, tone: "warning" }),
    );
    expect(late.paymentChip?.label).toBe("Betaalt vaak laat");
    expect(late.hasAny).toBe(true);
  });
});
