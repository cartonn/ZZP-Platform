// PURE presentatie voor de betaal-webhook-handtekening-heartbeat (dead-man's-switch op stille
// handtekening-mislukkingen). Vertaalt de freshness naar een StatusItem in dezelfde taal als de
// overige systeemstatus-items. Bevat nooit geheimen of PII — alleen tijdstippen, de driver-modus en
// het oordeel.
//
// ACHTERGROND — waarom een aparte detector náást de billing-aflever-heartbeat: die bewaakt UITGAANDE
// provider-calls (startCheckout/paymentStatus). Deze bewaakt het INKOMENDE webhook-kanaal. Stripe
// ondertekent elke webhook; een verkeerd/geroteerd STRIPE_WEBHOOK_SECRET laat élke inkomende webhook
// stil de handtekeningverificatie falen (`resolveWebhookRef` geeft dan dezelfde `null` als voor een
// irrelevant event → onzichtbaar). Gevolg: een geslaagde betaling activeert het abonnement niet; het
// blijft op PENDING hangen tot de reconcile-cron het veel later redt. Deze detector maakt die
// systematische verificatie-faal direct zichtbaar.
//
// De freshness-vorm en de pure evaluatie worden gedeeld met de billing-aflever-heartbeat
// (billing-delivery-freshness.ts): event-gedreven (oordeel op de laatste uitkomst, geen
// staleness-op-leeftijd), robuust tegen klok-scheefstand.

import type { BillingDeliveryFreshness } from "@/lib/observability/billing-delivery-freshness";
import type { StatusItem } from "@/lib/system-status";

const KEY = "billing-webhook-auth-heartbeat";
const LABEL = "Betaal-webhook (handtekening)";

/**
 * Vertaalt de webhook-handtekening-freshness naar een `StatusItem`. `never` = neutraal ok (er is nog
 * geen getekende webhook binnengekomen, of het kanaal ondertekent niet — noop/Mollie). `failing` =
 * aandacht (opeenvolgende ongeldige handtekeningen: vermoedelijk een verkeerd webhook-secret).
 */
export function billingWebhookAuthStatusItem(freshness: BillingDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures } = freshness;

  if (status === "never") {
    return {
      key: KEY,
      label: LABEL,
      mode: "nog geen getekende webhook",
      level: "ok",
      detail:
        "Er is nog geen getekende betaal-webhook geverifieerd. Zodra Stripe " +
        "(BILLING_PROVIDER=stripe) de eerste webhook aflevert verschijnt hier of de handtekening " +
        "klopt. Zonder getekend kanaal (mock/gratis default, of Mollie — dat ondertekent niet) is " +
        "er niets te bewaken.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ongeldige ${
            consecutiveFailures === 1 ? "handtekening" : "handtekeningen"
          }`
        : "de laatste webhook had een ongeldige handtekening";
    return {
      key: KEY,
      label: LABEL,
      mode: "handtekening ongeldig",
      level: "attention",
      detail:
        `Inkomende betaal-webhooks falen de handtekeningverificatie (${count}). Vermoedelijk staat ` +
        "STRIPE_WEBHOOK_SECRET verkeerd of is hij geroteerd zonder de env bij te werken — dan wordt " +
        "élke webhook genegeerd en blijven betaalde abonnementen op PENDING hangen tot de " +
        "reconcile-cron ze redt. Controleer het webhook-secret in de Stripe-dashboard-endpoint tegen " +
        "de env-secret. (Kan ook duiden op vervalste webhook-pings tegen het publieke endpoint.)",
    };
  }

  return {
    key: KEY,
    label: LABEL,
    mode: "handtekening geldig",
    level: "ok",
    detail:
      "De laatste inkomende betaal-webhook had een geldige handtekening — het webhook-secret is " +
      "correct gewired en authentieke webhooks worden geaccepteerd.",
  };
}
