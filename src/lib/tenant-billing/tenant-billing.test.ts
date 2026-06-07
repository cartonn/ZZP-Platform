import { describe, expect, it } from "vitest";
import { type TenantBillingConfig } from "@/lib/config";
import {
  calculateCollaborationFee,
  collaborationFeeSubtotalCents,
  planCollaborationFeeRecord,
} from "@/lib/tenant-billing/collaboration-fee";
import { tenantPlan, nextBillingDate, daysBetween } from "@/lib/tenant-billing/tenant-plan";
import { buildTenantBillingOverview } from "@/lib/tenant-billing/tenant-billing-overview";

// Een ingeschakelde config met echte bedragen — los van de (uitgeschakelde) productie-default.
const enabled: TenantBillingConfig = {
  enabled: true,
  vatRegime: "STANDARD_HIGH", // 21%
  defaultPlanKey: "FREE",
  plans: {
    FREE: { key: "FREE", label: "Gratis", monthlyPriceCents: 0, feePercentageBps: 0, feeFixedCents: 0 }, // prettier-ignore
    GROEI: { key: "GROEI", label: "Groei", monthlyPriceCents: 4900, feePercentageBps: 250, feeFixedCents: 0 }, // prettier-ignore
    PRO: { key: "PRO", label: "Pro", monthlyPriceCents: 9900, feePercentageBps: 0, feeFixedCents: 500 }, // prettier-ignore
  },
};
const disabled: TenantBillingConfig = { ...enabled, enabled: false };

describe("tenantPlan", () => {
  it("valt bij een onbekende sleutel terug op het defaultplan", () => {
    expect(tenantPlan("ONZIN", enabled).key).toBe("FREE");
    expect(tenantPlan(null, enabled).key).toBe("FREE");
  });
  it("geeft het juiste plan bij een geldige sleutel", () => {
    expect(tenantPlan("GROEI", enabled).monthlyPriceCents).toBe(4900);
  });
});

describe("collaborationFeeSubtotalCents", () => {
  it("rekent een percentage van de samenwerkingswaarde", () => {
    // 2,5% van € 1.000 = € 25
    expect(collaborationFeeSubtotalCents(100_000, "GROEI", enabled)).toBe(2500);
  });
  it("geeft het vaste bedrag voorrang boven een percentage", () => {
    expect(collaborationFeeSubtotalCents(100_000, "PRO", enabled)).toBe(500);
  });
  it("is 0 voor het gratis plan", () => {
    expect(collaborationFeeSubtotalCents(100_000, "FREE", enabled)).toBe(0);
  });
});

describe("calculateCollaborationFee", () => {
  it("is niet van toepassing als billing uit staat", () => {
    const r = calculateCollaborationFee(100_000, "GROEI", disabled);
    expect(r.applicable).toBe(false);
    expect(r.totalCents).toBe(0);
  });
  it("berekent fee + 21% BTW bij een percentage-plan", () => {
    const r = calculateCollaborationFee(100_000, "GROEI", enabled);
    expect(r.applicable).toBe(true);
    expect(r.subtotalCents).toBe(2500);
    expect(r.vatCents).toBe(525); // 21% van 2500
    expect(r.totalCents).toBe(3025);
  });
  it("berekent fee + BTW bij een vast bedrag", () => {
    const r = calculateCollaborationFee(100_000, "PRO", enabled);
    expect(r.subtotalCents).toBe(500);
    expect(r.vatCents).toBe(105);
    expect(r.totalCents).toBe(605);
  });
  it("is niet van toepassing bij een nul-fee (gratis plan)", () => {
    expect(calculateCollaborationFee(100_000, "FREE", enabled).applicable).toBe(false);
  });
});

describe("planCollaborationFeeRecord", () => {
  const base = { collaborationId: "c1", tenantId: "t1", valueCents: 100_000, planKey: "GROEI" };
  it("geeft null voor een niet-tenant-samenwerking", () => {
    expect(planCollaborationFeeRecord({ ...base, tenantId: null }, enabled)).toBeNull();
  });
  it("geeft null als billing uit staat", () => {
    expect(planCollaborationFeeRecord(base, disabled)).toBeNull();
  });
  it("levert een PENDING-record met de berekende bedragen", () => {
    const rec = planCollaborationFeeRecord(base, enabled);
    expect(rec).toEqual({
      collaborationId: "c1",
      tenantId: "t1",
      planKey: "GROEI",
      feeCents: 2500,
      vatCents: 525,
      status: "PENDING",
    });
  });
});

describe("nextBillingDate", () => {
  it("kiest de startdag in dezelfde maand als die nog niet voorbij is", () => {
    const r = nextBillingDate(15, new Date("2026-06-10T00:00:00Z"));
    expect(r.toISOString().slice(0, 10)).toBe("2026-06-15");
  });
  it("rolt naar de volgende maand als de startdag al (ge)passeerd is", () => {
    const r = nextBillingDate(15, new Date("2026-06-15T12:00:00Z"));
    expect(r.toISOString().slice(0, 10)).toBe("2026-07-15");
  });
  it("overschrijdt de jaargrens correct", () => {
    const r = nextBillingDate(1, new Date("2026-12-20T00:00:00Z"));
    expect(r.toISOString().slice(0, 10)).toBe("2027-01-01");
  });
  it("klemt de startdag tussen 1 en 28", () => {
    expect(nextBillingDate(99, new Date("2026-06-10T00:00:00Z")).getUTCDate()).toBe(28);
    expect(nextBillingDate(0, new Date("2026-06-10T00:00:00Z")).getUTCDate()).toBe(1);
  });
});

describe("daysBetween", () => {
  it("telt hele dagen en is nooit negatief", () => {
    expect(daysBetween(new Date("2026-06-01T00:00:00Z"), new Date("2026-06-08T00:00:00Z"))).toBe(7);
    expect(daysBetween(new Date("2026-06-08T00:00:00Z"), new Date("2026-06-01T00:00:00Z"))).toBe(0);
  });
});

describe("buildTenantBillingOverview", () => {
  const now = new Date("2026-06-10T00:00:00Z");

  it("valt zonder abonnement terug op FREE/ACTIVE zonder te crashen", () => {
    const o = buildTenantBillingOverview(null, [], now, enabled);
    expect(o.planKey).toBe("FREE");
    expect(o.status).toBe("ACTIVE");
    expect(o.totalDueCents).toBe(0);
  });

  it("aggregeert openstaande vs. gefactureerde fees en het abonnement", () => {
    const o = buildTenantBillingOverview(
      {
        planKey: "GROEI",
        status: "ACTIVE",
        billingCycleStartDay: 1,
        currentPeriodEnd: null,
        pastDueAt: null,
      },
      [
        { feeCents: 2500, vatCents: 525, status: "PENDING" },
        { feeCents: 1000, vatCents: 210, status: "PENDING" },
        { feeCents: 800, vatCents: 168, status: "INVOICED" },
      ],
      now,
      enabled,
    );
    expect(o.openFeesCents).toBe(3500);
    expect(o.openFeesCount).toBe(2);
    expect(o.invoicedFeesCents).toBe(800);
    expect(o.monthlyPriceCents).toBe(4900);
    expect(o.totalDueCents).toBe(4900 + 3500);
  });

  it("toont bedrag 0 als billing uit staat, ook bij een betaald plan", () => {
    const o = buildTenantBillingOverview(
      {
        planKey: "GROEI",
        status: "ACTIVE",
        billingCycleStartDay: 1,
        currentPeriodEnd: null,
        pastDueAt: null,
      },
      [],
      now,
      disabled,
    );
    expect(o.billingEnabled).toBe(false);
    expect(o.monthlyPriceCents).toBe(0);
  });

  it("telt de achterstallige dagen vanaf pastDueAt", () => {
    const o = buildTenantBillingOverview(
      {
        planKey: "GROEI",
        status: "PAST_DUE",
        billingCycleStartDay: 1,
        currentPeriodEnd: null,
        pastDueAt: new Date("2026-06-01T00:00:00Z"),
      },
      [],
      now,
      enabled,
    );
    expect(o.daysOverdue).toBe(9);
  });
});
