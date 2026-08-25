// Gelekt-wachtwoord-controle-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die
// beoordeelt of de externe HIBP-controle (Have I Been Pwned "Pwned Passwords", PASSWORD_BREACH_CHECK=hibp)
// momenteel gezond opereert. De controle weigert wachtwoorden die in bekende datalekken voorkomen
// (NIST 800-63B §5.1.1.2 / OWASP ASVS 2.1.7) op registratie, wachtwoordherstel en wachtwoordwijziging.
// De adapter is bewust FAIL-OPEN — kan de controle niet draaien (netwerkfout, time-out, niet-ok respons,
// parsefout), dan laat de caller het wachtwoord TOE (beschikbaarheid boven een best-effort extra check).
// Juist voor één blip, maar een AANHOUDENDE storing (HIBP-outage, verkeerde/geblokkeerde base-URL,
// DNS-storing) zet de credential-stuffing-bescherming dan STIL uit — gelekte wachtwoorden passeren
// zonder dat iets dat toont. Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit in
// password-breach-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: breach-controles zijn event-gedreven
// (per registratie/wachtwoordwijziging), niet schema-gedreven. Een rustige periode zonder nieuwe
// wachtwoorden is normaal, geen storing. We beoordelen daarom de UITKOMST van de laatste échte operatie,
// niet hoe lang geleden die was. Een monitor paget pas bij OPEENVOLGENDE mislukkingen (systematische
// storing), niet bij één transiënte fout.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele controle via de echte HIBP-adapter geregistreerd. Neutraal (ok): een vers
 *               geconfigureerde controle die nog geen wachtwoord hoefde te toetsen is gezond, niet stuk.
 * - `ok`      : de laatste controle slaagde — HIBP accepteert onze range-verzoeken, de check werkt.
 * - `failing` : de laatste controle mislukte — HIBP wees af/was onbereikbaar en de check fail-opende.
 *               `consecutiveFailures` geeft de ernst (één blip vs. een aanhoudende storing).
 */
export type PasswordBreachDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface PasswordBreachDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** PASSWORD_BREACH_CHECK-modus bij de laatste poging ("hibp"), of null. */
  driver: string | null;
}

export interface PasswordBreachDeliveryFreshness {
  status: PasswordBreachDeliveryStatus;
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
 * Beoordeelt de gelekt-wachtwoord-controle-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een
 * mislukking "in de toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluatePasswordBreachDeliveryFreshness(
  fields: PasswordBreachDeliveryHeartbeatFields | null,
  now: Date,
): PasswordBreachDeliveryFreshness {
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

  const status: PasswordBreachDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

const LABEL = "Gelekt-wachtwoord-controle (laatste operatie)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items, zodat
 * de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen of PII — alleen
 * tijdstippen, de driver-modus en het oordeel.
 */
export function passwordBreachDeliveryStatusItem(
  freshness: PasswordBreachDeliveryFreshness,
): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "password-breach-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen operatie",
      level: "ok",
      detail:
        "Er is via de externe gelekt-wachtwoord-controle (PASSWORD_BREACH_CHECK=hibp) nog geen " +
        "operatie geregistreerd. Zodra iemand een wachtwoord kiest (registratie, wachtwoordherstel, " +
        "wachtwoord wijzigen) verschijnt hier of HIBP onze range-verzoeken accepteert. Zonder externe " +
        "controle (noop-default) is er niets te bewaken — elk wachtwoord passeert de lek-check.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste operatie mislukte";
    return {
      key: "password-breach-delivery-heartbeat",
      label: LABEL,
      mode: `wijst af${driverSuffix}`,
      level: "attention",
      detail:
        `De externe gelekt-wachtwoord-controle levert niet meer (${count}). De check fail-opent: ` +
        "wachtwoorden worden toegelaten zonder toetsing tegen bekende datalekken, dus de " +
        "credential-stuffing-bescherming op registratie, wachtwoordherstel en wachtwoord wijzigen is nu " +
        "vermoedelijk NIET actief. Controleer de HIBP-bereikbaarheid (verkeerde/geblokkeerde base-URL, " +
        "DNS-/netwerkstoring, uitgaande firewall) en het server-logboek (of Sentry). Draai daarna de " +
        "Gelekt-wachtwoord-zelftest om herstel te bevestigen.",
    };
  }

  return {
    key: "password-breach-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste controle tegen de externe gelekt-wachtwoord-lijst slaagde. Gekozen wachtwoorden " +
      "worden getoetst tegen bekende datalekken — credential-stuffing-bescherming actief.",
  };
}
