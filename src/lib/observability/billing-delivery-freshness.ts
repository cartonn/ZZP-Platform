// Billing-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of het uitgaande
// betaalprovider-kanaal (Stripe/Mollie, BILLING_PROVIDER=stripe|mollie) momenteel gezond opereert. De
// betaalprovider is een productie-kernkanaal (abonnement-checkout + statuscontrole), maar had — anders dan
// storage/mail/push — geen doorlopend afleversignaal: een systematisch falende backend (verlopen/ingetrokken
// API-sleutel, geschorst account, provider-storing) laat élke startCheckout/paymentStatus stil mislukken. De
// abonnement-actie en de webhook-/reconcile-route vangen de fout af en tonen/negeren 'm, dus zonder deze
// detector merkt niemand een AANHOUDENDE storing tot een gebruiker klaagt dat betalen niet lukt of een
// checkout eeuwig op PENDING blijft hangen. Deze module levert het oordeel als StatusItem; de opslag/DB-kant
// zit in billing-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: betaal-operaties zijn event-gedreven,
// niet schema-gedreven. Een rustige periode zonder nieuwe abonnementen/statuschecks is normaal, geen storing.
// We beoordelen daarom de UITKOMST van de laatste échte operatie, niet hoe lang geleden die was. Een monitor
// paget pas bij OPEENVOLGENDE mislukkingen (systematische storing), niet bij één transiënte fout.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele operatie via de echte provider geregistreerd. Neutraal (ok): een vers
 *               geconfigureerde provider die nog geen checkout/statuscontrole hoefde te doen is gezond.
 * - `ok`      : de laatste operatie slaagde — de provider accepteert onze calls.
 * - `failing` : de laatste operatie mislukte — de provider wijst af. `consecutiveFailures` geeft de ernst
 *               (één blip vs. een aanhoudende storing).
 */
export type BillingDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface BillingDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** BILLING_PROVIDER-modus bij de laatste poging ("mollie" | "stripe"), of null. */
  driver: string | null;
}

export interface BillingDeliveryFreshness {
  status: BillingDeliveryStatus;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  /** Aantal opeenvolgende mislukkingen sinds de laatste geslaagde operatie (0 als ok/never). */
  consecutiveFailures: number;
  /** Leeftijd van de laatste mislukking in hele seconden (afgerond), of null als er nooit één was. */
  failureAgeSeconds: number | null;
  driver: string | null;
}

/**
 * Beoordeelt de billing-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking "in de
 * toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateBillingDeliveryFreshness(
  fields: BillingDeliveryHeartbeatFields | null,
  now: Date,
): BillingDeliveryFreshness {
  if (!fields || !fields.lastAttemptAt) {
    return {
      status: "never",
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      consecutiveFailures: 0,
      failureAgeSeconds: null,
      driver: fields?.driver ?? null,
    };
  }

  const consecutiveFailures =
    Number.isFinite(fields.consecutiveFailures) && fields.consecutiveFailures > 0
      ? Math.floor(fields.consecutiveFailures)
      : 0;

  const status: BillingDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

  let failureAgeSeconds: number | null = null;
  if (fields.lastFailureAt) {
    const rawMs = now.getTime() - fields.lastFailureAt.getTime();
    failureAgeSeconds = Math.floor((rawMs > 0 ? rawMs : 0) / 1000);
  }

  return {
    status,
    lastAttemptAt: fields.lastAttemptAt,
    lastSuccessAt: fields.lastSuccessAt,
    lastFailureAt: fields.lastFailureAt,
    consecutiveFailures: status === "failing" ? consecutiveFailures : 0,
    failureAgeSeconds,
    driver: fields.driver ?? null,
  };
}

const LABEL = "Betaalprovider (laatste operatie)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items, zodat
 * de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen of PII — alleen
 * tijdstippen, de driver-modus en het oordeel.
 */
export function billingDeliveryStatusItem(freshness: BillingDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "billing-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen operatie",
      level: "ok",
      detail:
        "Er is via de betaalprovider (BILLING_PROVIDER=stripe|mollie) nog geen operatie geregistreerd. " +
        "Zodra het platform de eerste abonnement-checkout start of een betaalstatus opvraagt verschijnt " +
        "hier of de provider onze calls accepteert. Zonder geconfigureerde provider (mock/gratis) is er " +
        "niets te bewaken.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste operatie mislukte";
    return {
      key: "billing-delivery-heartbeat",
      label: LABEL,
      mode: `wijst af${driverSuffix}`,
      level: "attention",
      detail:
        `De betaalprovider wijst af (${count}). Abonnement-checkouts kunnen vermoedelijk niet worden ` +
        "gestart of statussen niet worden opgehaald — een checkout blijft dan op PENDING hangen. " +
        "Controleer de provider-credentials (verlopen/ingetrokken API-sleutel, geschorst account) en het " +
        "server-logboek (of Sentry) op het foutdetail. Draai daarna de Betaalprovider-zelftest om herstel " +
        "te bevestigen.",
    };
  }

  return {
    key: "billing-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste operatie tegen de geconfigureerde betaalprovider slaagde. Checkouts worden gestart en " +
      "betaalstatussen opgehaald.",
  };
}
