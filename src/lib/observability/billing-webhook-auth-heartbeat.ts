// Opslag-kant van de betaal-webhook-handtekening-heartbeat (dead-man's-switch op stille
// handtekening-mislukkingen van inkomende Stripe-webhooks). Hergebruikt de bestaande, per-`channel`
// gesleutelde `BillingDeliveryHeartbeat`-tabel via de gedeelde writers/lezer uit
// billing-delivery-heartbeat.ts — een eigen kanaalnaam volstaat, geen schema-wijziging.
//
// De pure beoordeling (event-gedreven, klok-scheefstand-robuust) deelt exact
// `evaluateBillingDeliveryFreshness`; de webhook-specifieke presentatie zit in
// billing-webhook-auth-status.ts. De registratie is fail-open: instrumentatie van het webhook-kanaal
// mag de webhook-verwerking (die altijd 200 antwoordt) nooit laten falen.

import type { WebhookAuthOutcome } from "@/lib/billing/provider";
import type { BillingDeliveryFreshness } from "@/lib/observability/billing-delivery-freshness";
import {
  getBillingDeliveryFreshness,
  recordBillingDeliveryFailure,
  recordBillingDeliverySuccess,
} from "@/lib/observability/billing-delivery-heartbeat";

/** Canonieke kanaalnaam (aparte singleton-rij náást `payment-provider`). */
export const PAYMENT_WEBHOOK_AUTH_CHANNEL = "payment-webhook-auth";

/**
 * Registreert de handtekening-uitkomst van één inkomende webhook. Alleen een getekend kanaal wordt
 * bewaakt: `"not-applicable"` (noop/Mollie/ontbrekend secret) registreert bewust NIETS — er valt niets
 * te verifiëren, dus geen vals "never→ok"-signaal. `"ok"` reset de teller; `"invalid"` telt de
 * opeenvolgende-mislukkingen-teller op. Fail-open (de onderliggende writers slikken hun eigen fouten).
 */
export async function recordWebhookAuthOutcome(
  outcome: WebhookAuthOutcome,
  driver: string,
  now: Date = new Date(),
): Promise<void> {
  if (outcome === "not-applicable") return;
  if (outcome === "ok") {
    await recordBillingDeliverySuccess(driver, now, PAYMENT_WEBHOOK_AUTH_CHANNEL);
    return;
  }
  await recordBillingDeliveryFailure(driver, now, PAYMENT_WEBHOOK_AUTH_CHANNEL);
}

/**
 * Leest de webhook-handtekening-heartbeat en beoordeelt de freshness. Faalt nooit naar buiten (bij een
 * leesfout → "never", neutraal) — gedeeld met de billing-aflever-lezer.
 */
export function getWebhookAuthFreshness(now: Date = new Date()): Promise<BillingDeliveryFreshness> {
  return getBillingDeliveryFreshness(now, PAYMENT_WEBHOOK_AUTH_CHANNEL);
}
