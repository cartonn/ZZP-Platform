// Read-only facturatie-overzicht per tenant (ADR-0006 E). Pure aggregatie: vat een abonnement +
// de geregistreerde fees samen tot wat de franchiser ziet. Geen I/O — de server levert de rijen.

import { TENANT_BILLING, type TenantBillingConfig } from "@/lib/config";
import { type TenantSubscriptionStatus, type CollaborationFeeStatus } from "@/lib/enums";
import { tenantPlan, nextBillingDate, daysBetween } from "@/lib/tenant-billing/tenant-plan";

export interface TenantSubscriptionInput {
  planKey: string;
  status: TenantSubscriptionStatus;
  billingCycleStartDay: number;
  currentPeriodEnd: Date | null;
  pastDueAt: Date | null;
}

export interface TenantFeeInput {
  feeCents: number;
  vatCents: number;
  status: CollaborationFeeStatus;
}

export interface TenantBillingOverview {
  billingEnabled: boolean;
  planKey: string;
  planLabel: string;
  monthlyPriceCents: number;
  status: TenantSubscriptionStatus;
  /** Som van de nog niet gefactureerde fees (excl. BTW). */
  openFeesCents: number;
  openFeesCount: number;
  /** Som van de al gefactureerde fees (excl. BTW). */
  invoicedFeesCents: number;
  /** Totaal verschuldigd nu: abonnement + openstaande fees (excl. BTW). */
  totalDueCents: number;
  nextBillingDate: Date;
  /** Dagen achterstallig t.o.v. `pastDueAt` (0 als niet achterstallig). */
  daysOverdue: number;
}

/**
 * Bouwt het facturatie-overzicht voor één tenant. Een ontbrekend abonnement valt terug op het
 * defaultplan (FREE) met status ACTIVE — geen crash. Bedragen in integer-centen.
 */
export function buildTenantBillingOverview(
  subscription: TenantSubscriptionInput | null,
  fees: readonly TenantFeeInput[],
  now: Date,
  config: TenantBillingConfig = TENANT_BILLING,
): TenantBillingOverview {
  const sub: TenantSubscriptionInput = subscription ?? {
    planKey: config.defaultPlanKey,
    status: "ACTIVE",
    billingCycleStartDay: 1,
    currentPeriodEnd: null,
    pastDueAt: null,
  };
  const plan = tenantPlan(sub.planKey, config);

  let openFeesCents = 0;
  let openFeesCount = 0;
  let invoicedFeesCents = 0;
  for (const f of fees) {
    if (f.status === "PENDING") {
      openFeesCents += f.feeCents;
      openFeesCount += 1;
    } else {
      invoicedFeesCents += f.feeCents;
    }
  }

  const monthlyPriceCents = config.enabled ? plan.monthlyPriceCents : 0;
  return {
    billingEnabled: config.enabled,
    planKey: plan.key,
    planLabel: plan.label,
    monthlyPriceCents,
    status: sub.status,
    openFeesCents,
    openFeesCount,
    invoicedFeesCents,
    totalDueCents: monthlyPriceCents + openFeesCents,
    nextBillingDate: nextBillingDate(sub.billingCycleStartDay, now),
    daysOverdue: sub.pastDueAt ? daysBetween(sub.pastDueAt, now) : 0,
  };
}
