// Push-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of het
// web-push-kanaal momenteel gezond aflevert. Web-push is — net als e-mail — een gebruikersgericht
// productie-afleverkanaal (VAPID/PWA-pushmeldingen), maar had geen doorlopend afleversignaal: een
// systematisch afwijzend kanaal (geroteerde/verlopen VAPID-sleutels, provider-storing) laat élke
// push stil mislukken. De delivery-taak (push-delivery-task.ts) markeert elke behandelde notificatie
// best-effort als gepusht (geen retry) en gaat door, dus zonder deze detector merkt niemand het tot
// een gebruiker klaagt. Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit in
// push-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: push is event-gedreven, niet
// schema-gedreven. Een rustige periode zonder verzendingen is normaal, geen storing. We beoordelen
// daarom de UITKOMST van de laatste échte afleverronde, niet hoe lang geleden die was. Een monitor
// paget pas bij OPEENVOLGENDE mislukkingen (systematische afwijzing), niet bij één transiënte fout.
//
// BELANGRIJK — wat telt als mislukking: een verlopen abonnement (404/410 → opruimen) is normale churn,
// GEEN kanaalstoring. De delivery-taak registreert daarom alleen een mislukking als een afleverronde
// écht probeerde af te leveren (niet-verlopen endpoints) en niets aankwam; een ronde met ≥1 geslaagde
// aflevering geldt als gezond.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele afleverronde met een echte poging geregistreerd. Neutraal (ok): een
 *               kanaal dat nog niets hoefde af te leveren (of geen VAPID-config heeft) is gezond, niet stuk.
 * - `ok`      : de laatste afleverronde leverde af — het kanaal werkt.
 * - `failing` : de laatste afleverronde probeerde af te leveren maar niets kwam aan — het kanaal wijst af.
 *               `consecutiveFailures` geeft de ernst (één blip vs. een aanhoudende storing).
 */
export type PushDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een echte afleverronde was). */
export interface PushDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
}

export interface PushDeliveryFreshness {
  status: PushDeliveryStatus;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  /** Aantal opeenvolgende mislukte afleverrondes sinds de laatste geslaagde (0 als ok/never). */
  consecutiveFailures: number;
  /** Leeftijd van de laatste mislukking in hele seconden (afgerond), of null als er nooit één was. */
  failureAgeSeconds: number | null;
}

/**
 * Beoordeelt de push-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking "in de
 * toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluatePushDeliveryFreshness(
  fields: PushDeliveryHeartbeatFields | null,
  now: Date,
): PushDeliveryFreshness {
  if (!fields || !fields.lastAttemptAt) {
    return {
      status: "never",
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      consecutiveFailures: 0,
      failureAgeSeconds: null,
    };
  }

  const consecutiveFailures =
    Number.isFinite(fields.consecutiveFailures) && fields.consecutiveFailures > 0
      ? Math.floor(fields.consecutiveFailures)
      : 0;

  const status: PushDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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
  };
}

const LABEL = "Push-kanaal (laatste afleverronde)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items,
 * zodat de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen of PII —
 * alleen tijdstippen, de teller en het oordeel.
 */
export function pushDeliveryStatusItem(freshness: PushDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures } = freshness;

  if (status === "never") {
    return {
      key: "push-delivery-heartbeat",
      label: LABEL,
      mode: "nog niets afgeleverd",
      level: "ok",
      detail:
        "Er is via web-push nog geen afleverronde met een echte poging geregistreerd. Zodra het " +
        "platform de eerste pushmelding aflevert verschijnt hier of het kanaal aankomt. Zonder " +
        "geconfigureerde VAPID-sleutels (web-push staat uit) worden alleen in-app meldingen getoond " +
        "en is er niets te bewaken.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "afleverronde" : "afleverrondes"}`
        : "de laatste afleverronde";
    return {
      key: "push-delivery-heartbeat",
      label: LABEL,
      mode: "afwijzend",
      level: "attention",
      detail:
        `Het push-kanaal wijst af (${count} zonder enige geslaagde aflevering). Pushmeldingen komen ` +
        "vermoedelijk niet aan. Controleer de VAPID-sleutels (geroteerd/verlopen), het VAPID-subject " +
        "en het server-logboek (of Sentry) op het foutdetail. Verlopen abonnementen (churn) tellen " +
        "hier niet mee — dit betekent dat echte, actieve endpoints niets ontvingen.",
    };
  }

  return {
    key: "push-delivery-heartbeat",
    label: LABEL,
    mode: "levert af",
    level: "ok",
    detail:
      "De laatste web-push-afleverronde leverde af aan minstens één actief abonnement. " +
      "Pushmeldingen worden afgeleverd.",
  };
}
