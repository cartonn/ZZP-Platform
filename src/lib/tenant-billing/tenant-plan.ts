// Tenant-abonnement: plan-opzoeking + cyclusberekening (ADR-0006 E). Pure functies, geen I/O.
// De prijzen zelf zijn mensenwerk (config TENANT_BILLING); deze helpers werken met wat daar staat.

import { TENANT_BILLING, type TenantBillingConfig, type TenantPlanConfig } from "@/lib/config";

// Harde terugval als zelfs het defaultplan ontbreekt in de config — gegarandeerd geen undefined.
const FREE_FALLBACK: TenantPlanConfig = {
  key: "FREE",
  label: "Gratis",
  monthlyPriceCents: 0,
  feePercentageBps: 0,
  feeFixedCents: 0,
};

/**
 * Het plan dat bij een sleutel hoort. Onbekende/lege sleutel → het defaultplan (FREE), zodat een
 * tenant zonder (geldig) abonnement nooit crasht maar terugvalt op gratis.
 */
export function tenantPlan(
  planKey: string | null | undefined,
  config: TenantBillingConfig = TENANT_BILLING,
): TenantPlanConfig {
  const direct = planKey ? config.plans[planKey] : undefined;
  return direct ?? config.plans[config.defaultPlanKey] ?? FREE_FALLBACK;
}

/**
 * De volgende factuurdatum vanaf `from`, gegeven de cyclus-startdag (1–28). Als `from` op of na de
 * startdag van de maand valt, is de volgende factuurdatum die dag in de volgende maand; anders die
 * dag in de huidige maand. Maand-/jaargrenzen worden correct overschreden. Pure: `from` komt binnen,
 * geen `Date.now()`.
 */
export function nextBillingDate(billingCycleStartDay: number, from: Date): Date {
  const day = Math.min(Math.max(Math.trunc(billingCycleStartDay), 1), 28);
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const candidate = new Date(Date.UTC(year, month, day));
  if (from.getUTCDate() < day) return candidate;
  // op of voorbij de startdag → volgende maand (Date normaliseert maand 12 → volgend jaar)
  return new Date(Date.UTC(year, month + 1, day));
}

/** Hele dagen dat `to` na `from` ligt (≥ 0). Voor achterstallig-tellingen. Pure. */
export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / 86_400_000);
}
