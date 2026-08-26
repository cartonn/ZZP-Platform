// Error-monitoring-aflever-heartbeat / dead-man's-switch: PURE, testbare logica die beoordeelt of de
// externe error-monitoring (Sentry, SENTRY_DSN gezet) op dit moment gezond fouten AFLEVERT. De
// error-reporter (src/lib/observability/report.ts) stuurt elke onafgevangen server-/taakfout naar Sentry,
// maar is bewust FAIL-OPEN — kan de fout niet naar de externe monitor (pakket @sentry/nextjs niet
// geïnstalleerd, of captureException/init werpt), dan valt 'ie STIL terug op console-loggen zodat het
// rapporteren zelf nooit een request laat falen. Juist voor één blip, maar bij een AANHOUDENDE storing
// (niet-geïnstalleerd/verwijderd pakket, kapotte DSN, geblokkeerde uitgaande route) mist élke fout de
// externe monitoring zonder dat iets dat toont — de operator denkt dat 'ie fouten in Sentry ziet terwijl
// ze alleen in de host-logs belanden. Deze module levert het oordeel als StatusItem; de opslag/DB-kant zit
// in error-monitoring-delivery-heartbeat.ts.
//
// BELANGRIJK — waarom geen staleness-op-leeftijd zoals cron/back-up: error-captures zijn event-gedreven
// (per fout), niet schema-gedreven. Een rustige periode zonder server-fouten is GEZOND, geen storing. We
// beoordelen daarom de UITKOMST van de laatste échte operatie, niet hoe lang geleden die was. Een monitor
// paget pas bij OPEENVOLGENDE mislukkingen (systematische storing), niet bij één transiënte fout.
//
// BELANGRIJK — "aflevering" = dispatch naar het live transport, niet server-side ontvangstbevestiging.
// captureException is fire-and-forget (async transport); een geslaagde dispatch bewijst dat het pakket
// aanwezig is en het transport de gebeurtenis accepteerde, niet dat Sentry hem serverzijdig opsloeg. Het
// definitieve transport-bewijs (flush) levert de point-in-time Error-monitoring-zelftest. Deze heartbeat
// vangt de dóórlopende dispatch-storing af: een niet-geïnstalleerd pakket (de gedocumenteerde valkuil:
// "SENTRY_DSN gezet maar @sentry/nextjs niet geïnstalleerd") en een werpende init/capture — precies wat de
// zelftest alleen op een menselijke klik ziet.
//
// GEEN Next/HTTP/DB-afhankelijkheden hier — alleen (velden, now) → oordeel.

import type { StatusItem } from "@/lib/system-status";

/**
 * - `never`   : nog geen enkele capture via de Sentry-reporter geregistreerd. Neutraal (ok): een vers
 *               geconfigureerde monitor die nog geen fout hoefde te melden is gezond, niet stuk.
 * - `ok`      : de laatste capture werd naar het live Sentry-transport gedispatched — de monitoring werkt.
 * - `failing` : de laatste capture kon NIET naar de externe monitor (pakket ontbreekt of capture/init wierp)
 *               en viel fail-open terug op console. `consecutiveFailures` geeft de ernst (blip vs. storing).
 */
export type ErrorMonitoringDeliveryStatus = "never" | "ok" | "failing";

/** Ruwe heartbeat-velden (of null-vorm als er nog nooit een operatie was). */
export interface ErrorMonitoringDeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** error-monitoring-modus bij de laatste poging ("sentry"), of null. */
  driver: string | null;
}

export interface ErrorMonitoringDeliveryFreshness {
  status: ErrorMonitoringDeliveryStatus;
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
 * Beoordeelt de error-monitoring-aflever-heartbeat puur. Robuust tegen klok-scheefstand (een mislukking
 * "in de toekomst" → leeftijd 0) en tegen een negatief/niet-eindig `consecutiveFailures` (→ 0).
 */
export function evaluateErrorMonitoringDeliveryFreshness(
  fields: ErrorMonitoringDeliveryHeartbeatFields | null,
  now: Date,
): ErrorMonitoringDeliveryFreshness {
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

  const status: ErrorMonitoringDeliveryStatus = fields.lastOk === false ? "failing" : "ok";

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

const LABEL = "Error-monitoring (laatste operatie)";

/**
 * Vertaalt de freshness naar een `StatusItem` in dezelfde taal als de overige systeemstatus-items, zodat
 * de admin-kaart de bestaande badge-/detail-conventies hergebruikt. Bevat nooit de DSN, secrets of
 * foutinhoud — alleen tijdstippen, de driver-modus en het oordeel.
 */
export function errorMonitoringDeliveryStatusItem(
  freshness: ErrorMonitoringDeliveryFreshness,
): StatusItem {
  const { status, consecutiveFailures, driver } = freshness;
  const driverSuffix = driver ? ` (${driver})` : "";

  if (status === "never") {
    return {
      key: "error-monitoring-delivery-heartbeat",
      label: LABEL,
      mode: "nog geen operatie",
      level: "ok",
      detail:
        "Er is via de externe error-monitoring (SENTRY_DSN) nog geen capture geregistreerd. Zodra een " +
        "server- of taakfout optreedt verschijnt hier of Sentry de gebeurtenis accepteerde. Zonder externe " +
        "monitoring (geen SENTRY_DSN) is er niets te bewaken — fouten worden alleen gestructureerd gelogd.",
    };
  }

  if (status === "failing") {
    const count =
      consecutiveFailures > 0
        ? `${consecutiveFailures} opeenvolgende ${consecutiveFailures === 1 ? "mislukking" : "mislukkingen"}`
        : "de laatste operatie mislukte";
    return {
      key: "error-monitoring-delivery-heartbeat",
      label: LABEL,
      mode: `levert niet af${driverSuffix}`,
      level: "attention",
      detail:
        `De externe error-monitoring levert niet meer af (${count}). Het rapporteren fail-opent: fouten ` +
        "worden alleen nog gestructureerd naar de host-logs geschreven en bereiken Sentry NIET — de " +
        "externe monitoring is stil weggevallen terwijl SENTRY_DSN gezet is. Meestal ontbreekt het pakket " +
        "(installeer `@sentry/nextjs` en deploy opnieuw) of is de DSN/uitgaande route kapot. Draai daarna " +
        "de Error-monitoring-zelftest om herstel te bevestigen.",
    };
  }

  return {
    key: "error-monitoring-delivery-heartbeat",
    label: LABEL,
    mode: `operationeel${driverSuffix}`,
    level: "ok",
    detail:
      "De laatste server-/taakfout werd naar het externe error-monitoring-transport (Sentry) " +
      "gedispatched — onafgevangen fouten worden extern zichtbaar gemaakt.",
  };
}
