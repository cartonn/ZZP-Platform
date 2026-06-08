import { describe, it, expect } from "vitest";
import {
  PLATFORM_BILLING_TRANSITIONS,
  canTransitionPlatformBilling,
  assertPlatformBillingTransition,
  PlatformBillingTransitionError,
  formatPlatformInvoiceNumber,
  summarizeBillingLines,
} from "@/lib/platform-billing/billing";
import { PLATFORM_BILLING_STATUSES } from "@/lib/enums";

describe("platform-billing transitions", () => {
  it("staat DRAFT→SENT→PAID en annuleren toe", () => {
    expect(canTransitionPlatformBilling("DRAFT", "SENT")).toBe(true);
    expect(canTransitionPlatformBilling("SENT", "PAID")).toBe(true);
    expect(canTransitionPlatformBilling("DRAFT", "CANCELLED")).toBe(true);
    expect(canTransitionPlatformBilling("SENT", "CANCELLED")).toBe(true);
  });

  it("weigert ongeldige overgangen", () => {
    expect(canTransitionPlatformBilling("DRAFT", "PAID")).toBe(false);
    expect(canTransitionPlatformBilling("PAID", "SENT")).toBe(false);
    expect(canTransitionPlatformBilling("CANCELLED", "SENT")).toBe(false);
    expect(() => assertPlatformBillingTransition("PAID", "SENT")).toThrow(
      PlatformBillingTransitionError,
    );
  });

  it("heeft voor elke status een (mogelijk lege) overgangslijst", () => {
    for (const s of PLATFORM_BILLING_STATUSES) {
      expect(Array.isArray(PLATFORM_BILLING_TRANSITIONS[s])).toBe(true);
    }
    expect(PLATFORM_BILLING_TRANSITIONS.PAID).toEqual([]);
  });
});

describe("formatPlatformInvoiceNumber", () => {
  it("nummert als PF-JAAR-NNNN", () => {
    expect(formatPlatformInvoiceNumber(2026, 7)).toBe("PF-2026-0007");
    expect(formatPlatformInvoiceNumber(2026, 1234)).toBe("PF-2026-1234");
  });
});

describe("summarizeBillingLines", () => {
  it("telt subtotaal + btw op tot het totaal", () => {
    const t = summarizeBillingLines([
      { subtotalCents: 2500, vatCents: 525 },
      { subtotalCents: 1750, vatCents: 368 },
    ]);
    expect(t.subtotalCents).toBe(4250);
    expect(t.vatCents).toBe(893);
    expect(t.totalCents).toBe(5143);
  });

  it("is 0 bij geen regels", () => {
    expect(summarizeBillingLines([])).toEqual({ subtotalCents: 0, vatCents: 0, totalCents: 0 });
  });
});
