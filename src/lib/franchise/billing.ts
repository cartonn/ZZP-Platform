// Data-access voor het tenant-facturatie-overzicht (ADR-0006 E). Tenant-scoped: een franchiser ziet
// alleen de cijfers van zijn eigen franchise. Read-only — de server aggregeert het abonnement + de
// geregistreerde fees tot het overzicht dat de werkplek toont.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { hasTenant } from "@/lib/tenancy";
import {
  type TenantSubscriptionStatus,
  type CollaborationFeeStatus,
  type TenantPlanKey,
} from "@/lib/enums";
import {
  buildTenantBillingOverview,
  type TenantBillingOverview,
} from "@/lib/tenant-billing/tenant-billing-overview";

/**
 * Het facturatie-overzicht voor de franchise van de actor. Geeft `null` als de actor geen franchise
 * heeft. Een ontbrekend abonnement valt binnen de aggregatie terug op het defaultplan (geen crash).
 */
export async function getTenantBillingOverview(
  actor: Actor,
  now: Date,
): Promise<TenantBillingOverview | null> {
  if (!hasTenant(actor)) return null;
  const tenantId = actor.tenantId;

  const [subscription, fees] = await Promise.all([
    prisma.tenantSubscription.findUnique({ where: { tenantId } }),
    prisma.collaborationFee.findMany({
      where: { tenantId },
      select: { feeCents: true, vatCents: true, status: true },
    }),
  ]);

  return buildTenantBillingOverview(
    subscription
      ? {
          planKey: subscription.planKey as TenantPlanKey,
          status: subscription.status as TenantSubscriptionStatus,
          billingCycleStartDay: subscription.billingCycleStartDay,
          currentPeriodEnd: subscription.currentPeriodEnd,
          pastDueAt: subscription.pastDueAt,
        }
      : null,
    fees.map((f) => ({
      feeCents: f.feeCents,
      vatCents: f.vatCents,
      status: f.status as CollaborationFeeStatus,
    })),
    now,
  );
}
