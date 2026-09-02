// Opslag-kant van de error-monitoring-aflever-heartbeat (dead-man's-switch). De DB-interactie + de
// write-coalescing zitten sinds de consolidatie in delivery-heartbeat.ts (één `DeliveryHeartbeat`-tabel met
// een `channel`-kolom); hier blijft alleen de kanaalbinding + de vertaling naar het monitoring-oordeel staan.
//
// De registratie wordt aangeroepen vanuit SentryErrorReporter.capture() (report.ts) — het échte externe
// kanaal (SENTRY_DSN gezet). De console-default (geen DSN) registreert bewust niet (geen extern kanaal).
//
// WAAROM COALESCING: de reporter zit op het fout-pad; bij een fout-storm (of een luidruchtige
// achtergrond-taak) zou één DB-upsert per capture extra DB-load genereren juist wanneer het systeem al in
// nood is. Daarom worden GESLAAGDE captures gecoalesceerd (ERROR_MONITORING_HEARTBEAT_COALESCE_MS, default
// 15s per proces); mislukkingen en herstel schrijven altijd meteen.
//
// KRITISCH — GEEN reportError() in het schrijfpad van DIT kanaal: reportError() routeert terug door de
// Sentry-reporter, die op zijn beurt deze heartbeat aanroept → oneindige recursie. Het kanaal staat daarom
// met `errorSink: "log"` in de registratie: delivery-heartbeat.ts logt een DB-schrijffout rechtstreeks via
// de logger (die redacteert PII zelf) en slikt 'm. De pure beoordeling zit in
// error-monitoring-delivery-freshness.ts.

import {
  __resetHeartbeatCoalescing,
  heartbeatChannelSpec,
  readHeartbeat,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";
import {
  evaluateErrorMonitoringDeliveryFreshness,
  type ErrorMonitoringDeliveryFreshness,
} from "@/lib/observability/error-monitoring-delivery-freshness";

const SPEC = heartbeatChannelSpec("error-monitoring");

/** Canonieke naam van het error-monitoring-kanaal (singleton-rij). */
export const ERROR_MONITORING_CHANNEL = SPEC.channel;

/** Driver-modus die de externe monitor aanduidt (de enige echte modus; console = geen kanaal). */
export const ERROR_MONITORING_DRIVER = "sentry";

/** Test-only: reset de per-proces coalescing-state zodat testcases onafhankelijk zijn. */
export function __resetErrorMonitoringHeartbeatCoalescingForTests(): void {
  __resetHeartbeatCoalescing();
}

/**
 * Registreert dat een capture via de externe monitor zojuist SLAAGDE: markeert het kanaal als operationeel
 * en zet de opeenvolgende-mislukkingen-teller terug op 0. Gecoalesceerd bij aanhoudend succes, maar altijd
 * meteen bij een herstel of de eerste operatie sinds boot. Faalt nooit naar buiten.
 */
export async function recordErrorMonitoringDeliverySuccess(
  now: Date = new Date(),
  channel: string = ERROR_MONITORING_CHANNEL,
): Promise<void> {
  await recordHeartbeatSuccess(SPEC, ERROR_MONITORING_DRIVER, now, channel);
}

/**
 * Registreert dat een capture via de externe monitor zojuist MISLUKTE: markeert het kanaal als afwijzend en
 * telt de opeenvolgende-mislukkingen-teller atomair op. Wordt altijd direct geschreven (nooit gecoalesceerd).
 * Bewaart nooit de DSN of de foutinhoud — alleen tijdstip, de teller en de driver-modus. Faalt nooit naar
 * buiten.
 */
export async function recordErrorMonitoringDeliveryFailure(
  now: Date = new Date(),
  channel: string = ERROR_MONITORING_CHANNEL,
): Promise<void> {
  await recordHeartbeatFailure(SPEC, ERROR_MONITORING_DRIVER, now, channel);
}

/**
 * Leest de heartbeat en beoordeelt de freshness (event-gedreven: uitkomst van de laatste capture, geen
 * staleness-op-leeftijd). Faalt nooit naar buiten: bij een leesfout wordt "never" teruggegeven (neutraal)
 * i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function getErrorMonitoringDeliveryFreshness(
  now: Date = new Date(),
  channel: string = ERROR_MONITORING_CHANNEL,
): Promise<ErrorMonitoringDeliveryFreshness> {
  return evaluateErrorMonitoringDeliveryFreshness(await readHeartbeat(SPEC, channel), now);
}
