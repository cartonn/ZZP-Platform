// Rate-limit-store-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de
// gedeelde rate-limit-store (Upstash Redis REST, RATE_LIMIT_STORE=upstash) momenteel gezond opereert. De
// rate-limiter beschermt login/registratie/wachtwoordherstel tegen brute-force; bij horizontale schaling
// moet die telling gedeeld zijn. De Upstash-store is bewust FAIL-OPEN — valt de Redis-call uit, dan laat
// consume() het verzoek door (beschikbaarheid boven een tijdelijk zwakkere limiet). Juist voor één blip,
// maar een AANHOUDENDE storing (verlopen/ingetrokken REST-token, verwijderde database, verkeerde URL,
// regio-storing) zet de rate-limiting dan STIL uit over alle instances — de brute-force-bescherming valt
// weg zonder dat iets dat toont. Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit in
// ratelimit-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: rate-limit-operaties zijn
// event-gedreven (per login/registratie/mutatie), niet schema-gedreven. Een rustige periode zonder
// verkeer is normaal, geen storing. We beoordelen daarom de UITKOMST van de laatste échte operatie, niet
// hoe lang geleden die was. Een monitor paget pas bij OPEENVOLGENDE mislukkingen (systematische storing),
// niet bij één transiënte fout.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele operatie via de echte store geregistreerd. Neutraal (ok): een vers
 *               geconfigureerde store die nog geen verkeer hoefde te tellen is gezond, niet stuk.
 * - `ok`      : de laatste operatie slaagde — de store accepteert onze operaties, de limieten gelden gedeeld.
 * - `failing` : de laatste operatie mislukte — de store wijst af en de limiter fail-opent. `consecutiveFailures`
 *               geeft de ernst (één blip vs. een aanhoudende storing).
 */
export type RateLimitDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface RateLimitDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** RATE_LIMIT_STORE-modus bij de laatste poging ("upstash"), of null. */
  driver: string | null;
}

export interface RateLimitDeliveryFreshness {
  status: RateLimitDeliveryStatus;
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
 * Beoordeelt de rate-limit-store-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking
 * "in de toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateRateLimitDeliveryFreshness(
  fields: RateLimitDeliveryHeartbeatFields | null,
  now: Date,
): RateLimitDeliveryFreshness {
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

  const status: RateLimitDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

const LABEL = "Rate-limit-store (laatste operatie)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items, zodat
 * de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen of PII — alleen
 * tijdstippen, de driver-modus en het oordeel.
 */
export function rateLimitDeliveryStatusItem(freshness: RateLimitDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "ratelimit-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen operatie",
      level: "ok",
      detail:
        "Er is via de gedeelde rate-limit-store (RATE_LIMIT_STORE=upstash) nog geen operatie " +
        "geregistreerd. Zodra het platform het eerste verzoek tegen een gelimiteerd eindpunt (login, " +
        "registratie, wachtwoordherstel) telt verschijnt hier of de store onze operaties accepteert. " +
        "Zonder gedeelde store (in-memory default) is er niets te bewaken — de limieten gelden dan per " +
        "instance.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste operatie mislukte";
    return {
      key: "ratelimit-delivery-heartbeat",
      label: LABEL,
      mode: `wijst af${driverSuffix}`,
      level: "attention",
      detail:
        `De gedeelde rate-limit-store wijst af (${count}). De limiter fail-opent: verzoeken worden ` +
        "toegelaten, dus de brute-force-/misbruikbescherming op login, registratie en wachtwoordherstel " +
        "geldt nu vermoedelijk NIET gedeeld over de instances. Controleer de Upstash-configuratie " +
        "(verlopen/ingetrokken REST-token, verwijderde database, verkeerde URL, regio-storing) en het " +
        "server-logboek (of Sentry). Draai daarna de Rate-limit-zelftest om herstel te bevestigen.",
    };
  }

  return {
    key: "ratelimit-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste operatie tegen de gedeelde rate-limit-store slaagde. De limieten worden gedeeld " +
      "geteld over alle instances — brute-force-bescherming actief.",
  };
}
