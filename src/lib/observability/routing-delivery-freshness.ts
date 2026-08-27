// Routing-provider-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de
// externe routing-provider (ROUTING_PROVIDER=geoapify) op dit moment gezond AFLEVERT. De routing-grens
// (src/lib/services/routing.ts, estimateTravelMinutesWithRouting) vraagt bij elke reistijd-lookup een
// echte gerouteerde reistijd op bij de provider; faalt die lookup, dan valt de matching STIL terug op de
// deterministische offline haversine-schatting (estimateTravelMinutes). Precies die stille terugval is de
// faalmodus die deze heartbeat afvangt: match-reistijden worden dan onnauwkeuriger zonder dat iets dat
// toont. Bovendien telt een provider die wél antwoordt maar met een onbruikbaar/onleesbaar antwoord als
// een niet-afleverend kanaal: de lookup levert dan geen echte gerouteerde reistijd.
//
// Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit in
// routing-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: reistijd-lookups zijn event-gedreven
// (per match/berekening), niet schema-gedreven. Een rustige periode zonder lookups is GEZOND, geen
// storing. We beoordelen daarom de UITKOMST van de laatste échte lookup, niet hoe lang geleden die was.
// Een monitor paget pas bij OPEENVOLGENDE mislukkingen (systematische storing), niet bij één transiënte
// fout.
//
// BELANGRIJK — "aflevering" = de provider ANTWOORDDE bruikbaar, ook als er geen geocode-match voor een
// adres was (een leeg maar geldig antwoord telt als aflevering: de provider was bereikbaar én
// operationeel). Een geworpen lookup (onbereikbaar/time-out) of een non-2xx/onleesbare respons (verkeerde/
// verlopen/ingetrokken GEOAPIFY_API_KEY, HTTP 401/403/429/5xx) telt als een mislukking. Het point-in-time
// bewijs dat de provider echt routeert blijft de Routing-zelftest op /admin/systeemstatus; deze heartbeat
// vangt de dóórlopende afleverstoring af die de zelftest alleen op een menselijke klik ziet.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele reistijd-lookup via de externe routing-provider geregistreerd. Neutraal
 *               (ok): zonder actieve provider (offline) is er niets te bewaken — matching gebruikt dan de
 *               deterministische offline schatting.
 * - `ok`      : de laatste lookup werd door de provider beantwoord — matching gebruikt echte gerouteerde
 *               reistijden.
 * - `failing` : de laatste lookup kon de provider niet bereiken (geworpen/time-out) of kreeg een
 *               onbruikbare respons (non-2xx/onleesbaar). `consecutiveFailures` geeft de ernst.
 */
export type RoutingDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface RoutingDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** provider-modus bij de laatste poging ("geoapify"), of null. */
  driver: string | null;
}

export interface RoutingDeliveryFreshness {
  status: RoutingDeliveryStatus;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  /** Aantal opeenvolgende mislukkingen sinds de laatste geslaagde lookup (0 als ok/never). */
  consecutiveFailures: number;
  /** Leeftijd van de laatste mislukking in hele seconden (afgerond), of null als er nooit één was. */
  failureAgeSeconds: number | null;
  driver: string | null;
}

/**
 * Beoordeelt de routing-provider-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking
 * "in de toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateRoutingDeliveryFreshness(
  fields: RoutingDeliveryHeartbeatFields | null,
  now: Date,
): RoutingDeliveryFreshness {
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

  const status: RoutingDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

const LABEL = "Routing-provider (laatste lookup)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items, zodat
 * de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit secrets of de aanroep-URL
 * (die de API-sleutel bevat) — alleen tijdstippen, de driver-modus en het oordeel.
 */
export function routingDeliveryStatusItem(freshness: RoutingDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "routing-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen lookup",
      level: "ok",
      detail:
        "Er is via de externe routing-provider (ROUTING_PROVIDER=geoapify) nog geen reistijd-lookup " +
        "gedaan. Zodra een match een reistijd berekent verschijnt hier of de provider antwoordde. Zonder " +
        "actieve provider (offline) is er niets te bewaken — matching gebruikt dan de deterministische " +
        "offline schatting.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste lookup mislukte";
    return {
      key: "routing-delivery-heartbeat",
      label: LABEL,
      mode: `levert niet af${driverSuffix}`,
      level: "attention",
      detail:
        `De routing-provider levert geen bruikbaar antwoord meer (${count}). De provider is onbereikbaar ` +
        "(netwerk/time-out) of weigert het verzoek (verkeerde/verlopen/ingetrokken GEOAPIFY_API_KEY, HTTP " +
        "401/403/429/5xx). Élke reistijd-lookup valt nu STIL terug op de offline haversine-schatting → " +
        "match-reistijden worden onnauwkeuriger. Controleer de GEOAPIFY_API_KEY en draai de " +
        "Routing-zelftest op /admin/systeemstatus.",
    };
  }

  return {
    key: "routing-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste reistijd-lookups werden door de provider beantwoord — matching gebruikt echte " +
      "gerouteerde reistijden.",
  };
}
