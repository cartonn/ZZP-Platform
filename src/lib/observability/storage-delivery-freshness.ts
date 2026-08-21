// Opslag-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of het
// object-opslagkanaal (S3/S3-compatibel, STORAGE_DRIVER=s3) momenteel gezond opereert. Document-opslag
// is een productie-kernkanaal (VOG/diploma/verzekering upload+download), maar — anders dan mail/push —
// was er geen doorlopend afleversignaal: een systematisch falende backend (verlopen AWS-sleutel,
// ingetrokken IAM, verwijderde/verkeerde bucket, regio-storing) laat élke put/get/delete/exists stil
// mislukken. De upload-code vangt de fout af en toont een generieke melding, dus zonder deze detector
// merkt niemand een AANHOUDENDE storing tot een gebruiker klaagt. Deze module levert het oordeel als
// StatusItem; de opslag/DB-kant zit in storage-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: opslag-operaties zijn event-gedreven,
// niet schema-gedreven. Een rustige periode zonder uploads/downloads is normaal, geen storing. We
// beoordelen daarom de UITKOMST van de laatste échte operatie, niet hoe lang geleden die was. Een monitor
// paget pas bij OPEENVOLGENDE mislukkingen (systematische storing), niet bij één transiënte fout.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele operatie via de echte driver geregistreerd. Neutraal (ok): een vers
 *               geconfigureerde opslag die nog niets hoefde op te slaan/op te halen is gezond, niet stuk.
 * - `ok`      : de laatste operatie slaagde — de backend accepteert onze operaties.
 * - `failing` : de laatste operatie mislukte — de backend wijst af. `consecutiveFailures` geeft de
 *               ernst (één blip vs. een aanhoudende storing).
 */
export type StorageDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface StorageDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** STORAGE_DRIVER-modus bij de laatste poging ("s3"), of null. */
  driver: string | null;
}

export interface StorageDeliveryFreshness {
  status: StorageDeliveryStatus;
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
 * Beoordeelt de opslag-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking "in de
 * toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateStorageDeliveryFreshness(
  fields: StorageDeliveryHeartbeatFields | null,
  now: Date,
): StorageDeliveryFreshness {
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

  const status: StorageDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

const LABEL = "Object-opslag (laatste operatie)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items,
 * zodat de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen of PII —
 * alleen tijdstippen, de driver-modus en het oordeel.
 */
export function storageDeliveryStatusItem(freshness: StorageDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "storage-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen operatie",
      level: "ok",
      detail:
        "Er is via de object-opslag (STORAGE_DRIVER=s3) nog geen operatie geregistreerd. Zodra het " +
        "platform het eerste document opslaat of ophaalt verschijnt hier of de backend onze operaties " +
        "accepteert. Zonder geconfigureerde object-opslag (lokale disk-fallback) is er niets te bewaken.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste operatie mislukte";
    return {
      key: "storage-delivery-heartbeat",
      label: LABEL,
      mode: `wijst af${driverSuffix}`,
      level: "attention",
      detail:
        `De object-opslag wijst af (${count}). Documenten (VOG, diploma's, verzekering) kunnen ` +
        "vermoedelijk niet worden opgeslagen of opgehaald. Controleer de opslag-credentials/bucket " +
        "(verlopen AWS-sleutel, ingetrokken IAM-rechten, verwijderde/verkeerde bucket, regio-storing) " +
        "en het server-logboek (of Sentry) op het foutdetail. Draai daarna de Opslag-zelftest om " +
        "herstel te bevestigen.",
    };
  }

  return {
    key: "storage-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste operatie tegen de geconfigureerde object-opslag slaagde. Documenten worden " +
      "opgeslagen en opgehaald.",
  };
}
