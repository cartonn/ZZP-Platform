import { describe, it, expect } from "vitest";
import { TENANT_BILLING } from "@/lib/config";
import { planCollaborationFeeRecord } from "@/lib/tenant-billing/collaboration-fee";

// Pint de LIVE tenant-billing-config (de echte aangezette waarden), los van de pure-math-tests die
// hun eigen config meegeven. Vangt een onbedoelde regressie van prijzen/percentages.
describe("TENANT_BILLING live-config", () => {
  it("staat aan met de hybride staffel", () => {
    expect(TENANT_BILLING.enabled).toBe(true);
    expect(TENANT_BILLING.vatRegime).toBe("STANDARD_HIGH");
    expect(TENANT_BILLING.plans.FREE?.feePercentageBps).toBe(250);
    expect(TENANT_BILLING.plans.GROEI?.monthlyPriceCents).toBe(9900);
    expect(TENANT_BILLING.plans.GROEI?.feePercentageBps).toBe(175);
    expect(TENANT_BILLING.plans.PRO?.monthlyPriceCents).toBe(19900);
    expect(TENANT_BILLING.plans.PRO?.feePercentageBps).toBe(100);
  });

  it.each([
    ["FREE", 2500],
    ["GROEI", 1750],
    ["PRO", 1000],
  ] as const)("rekent de live fee voor %s over EUR 1.000 (excl. btw)", (planKey, expectedFee) => {
    const rec = planCollaborationFeeRecord({
      collaborationId: "c",
      tenantId: "t",
      valueCents: 100_000,
      planKey,
    });
    expect(rec).not.toBeNull();
    expect(rec!.feeCents).toBe(expectedFee);
    expect(rec!.vatCents).toBeGreaterThan(0);
  });

  it("registreert geen fee voor een platform-samenwerking (geen tenant)", () => {
    expect(
      planCollaborationFeeRecord({
        collaborationId: "c",
        tenantId: null,
        valueCents: 100_000,
        planKey: "GROEI",
      }),
    ).toBeNull();
  });
});
