// Mail-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of het
// e-mailkanaal momenteel gezond aflevert. E-mail is een productie-kernkanaal (§2: certificaat
// goedgekeurd, wachtwoordherstel, herinneringen), maar — anders dan opslag/DB/cron/back-up — was er
// geen doorlopend afleversignaal: een systematisch afwijzende provider (verlopen sleutel, gede-
// verifieerd domein, geschorst account, harde rate-limit) laat élke mail stil mislukken. De verzendcode
// vangt de fout PII-veilig af (logMailFailure) en gaat door, dus zonder deze detector merkt niemand het
// tot een gebruiker klaagt. Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit in
// mail-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: e-mail is event-gedreven, niet
// schema-gedreven. Een rustige periode zonder verzendingen is normaal, geen storing. We beoordelen
// daarom de UITKOMST van de laatste échte verzending, niet hoe lang geleden die was. Een monitor paget
// pas bij OPEENVOLGENDE mislukkingen (systematische afwijzing), niet bij één transiënte bounce.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele verzending via een echt kanaal geregistreerd. Neutraal (ok): een vers
 *               geconfigureerd kanaal dat nog niets hoefde te versturen is gezond, niet stuk.
 * - `ok`      : de laatste verzending slaagde — het kanaal levert af.
 * - `failing` : de laatste verzending mislukte — het kanaal wijst af. `consecutiveFailures` geeft de
 *               ernst (één blip vs. een aanhoudende storing).
 */
export type MailDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een verzending was). */
export interface MailDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** EMAIL_DRIVER-modus bij de laatste poging ("smtp"/"resend"/"postmark"/"ses"), of null. */
  driver: string | null;
}

export interface MailDeliveryFreshness {
  status: MailDeliveryStatus;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  /** Aantal opeenvolgende mislukkingen sinds de laatste geslaagde verzending (0 als ok/never). */
  consecutiveFailures: number;
  /** Leeftijd van de laatste mislukking in hele seconden (afgerond), of null als er nooit één was. */
  failureAgeSeconds: number | null;
  driver: string | null;
}

/**
 * Beoordeelt de mail-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking "in de
 * toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateMailDeliveryFreshness(
  fields: MailDeliveryHeartbeatFields | null,
  now: Date,
): MailDeliveryFreshness {
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

  const status: MailDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

const LABEL = "E-mailkanaal (laatste verzending)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items,
 * zodat de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit geheimen of PII —
 * alleen tijdstippen, de driver-modus en het oordeel.
 */
export function mailDeliveryStatusItem(freshness: MailDeliveryFreshness): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "mail-delivery-heartbeat",
      label: LABEL,
      mode: "nog niets verzonden",
      level: "ok",
      detail:
        "Er is via een echt e-mailkanaal nog geen verzending geregistreerd. Zodra het platform de " +
        "eerste mail verstuurt (notificatie, wachtwoordherstel, herinnering) verschijnt hier of het " +
        "kanaal aflevert. Zonder geconfigureerd kanaal (EMAIL_DRIVER=noop) worden alleen in-app " +
        "meldingen getoond en is er niets te bewaken.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste verzending mislukte";
    return {
      key: "mail-delivery-heartbeat",
      label: LABEL,
      mode: `afwijzend${driverSuffix}`,
      level: "attention",
      detail:
        `Het e-mailkanaal wijst af (${count}). Notificaties, wachtwoordherstel en herinneringen komen ` +
        "vermoedelijk niet aan. Controleer de provider-sleutel/domeinverificatie (verlopen sleutel, " +
        "gede-verifieerd domein, geschorst account, rate-limit) en het server-logboek (of Sentry) op " +
        "het foutdetail. Draai daarna de E-mail-zelftest om herstel te bevestigen.",
    };
  }

  return {
    key: "mail-delivery-heartbeat",
    label: LABEL,
    mode: `levert af${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste e-mailverzending via het geconfigureerde kanaal slaagde. Notificaties, " +
      "wachtwoordherstel en herinneringen worden afgeleverd.",
  };
}
