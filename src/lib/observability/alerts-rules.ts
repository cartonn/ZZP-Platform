// Drift-gate voor het Prometheus alerting-rules-bestand (docs/observability/alerts.yml).
//
// Het metrics-endpoint (/api/metrics) exposeert een set gauges (src/lib/observability/metrics.ts).
// Het alerting-rules-bestand vertaalt die gauges naar concrete alerts met drempels en `for:`-duur.
// Zonder een poort zou dat bestand stil kunnen driften: een hernoemde/verwijderde gauge laat een
// alert-expressie achter die NOOIT meer vuurt (stille monitoring-blinde-vlek — precies de faalmodus
// die het metrics-werk juist wil dichten), en een NIEUW toegevoegde gauge zou zonder alert de deur uit
// gaan zonder dat iemand het merkt.
//
// Deze module is PUUR (geen Next/HTTP/DB): ze leidt de canonieke gauge-namen rechtstreeks af uit
// `buildMetrics` (één bron van waarheid) en extraheert de door het regels-bestand gerefereerde
// namen. De test (`alerts-rules.test.ts`) klinkt beide aan elkaar vast:
//   1) elke in het regels-bestand gerefereerde `zzp_*`-naam bestaat écht als gauge (geen dode alert);
//   2) elke geëxposeerde gauge is óf gedekt door een alert, óf staat expliciet in INFO_ONLY_METRICS
//      (info-gauge waarop je bewust niet paget) — zodat een toekomstige gauge de gate breekt tot er
//      een alert of een bewuste info-markering bij komt.

import { buildMetrics, type MetricsInput } from "./metrics";

/**
 * Gauges waarop je bewust NIET met een aparte alert-expressie paget — ze dragen context, geen
 * page-conditie op zich:
 * - `zzp_up`: is altijd 1 in een geslaagde scrape; de alarmeerbare conditie is de *afwezigheid*, niet
 *   de waarde. Die wordt gedekt door de target-niveau deadman in alerts.yml: `ZzpTargetDown`
 *   (`up == 0`, scrape faalt) en `ZzpMetricsAbsent` (`absent(zzp_up)`, gauges ontbreken). zzp_up staat
 *   dus in INFO_ONLY (geen waarde-drempel-alert), maar wordt wél door `absent(zzp_up)` gerefereerd.
 * - `zzp_*_heartbeat_age_seconds`: rauwe leeftijd; de alarmeerbare conditie zit in de bijbehorende
 *   `_stale`-gauge (server-side tegen het venster berekend), niet in de kale leeftijd.
 *
 * `zzp_maintenance_mode` staat hier bewust NIET in: het regels-bestand geeft die gauge een eigen
 * info-alert (zichtbaarheid van een per ongeluk aan-gelaten onderhoudsmodus) én gebruikt 'm als
 * inhibitie-bron — dus 'ie is via een echte expressie gedekt.
 */
export const INFO_ONLY_METRICS: ReadonlySet<string> = new Set([
  "zzp_up",
  "zzp_cron_heartbeat_age_seconds",
  "zzp_backup_heartbeat_age_seconds",
  // Rauwe leeftijd van de laatste mail-mislukking; de alarmeerbare conditie zit in
  // zzp_mail_consecutive_failures / zzp_mail_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_mail_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste push-mislukking; de alarmeerbare conditie zit in
  // zzp_push_consecutive_failures / zzp_push_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_push_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste opslag-mislukking; de alarmeerbare conditie zit in
  // zzp_storage_consecutive_failures / zzp_storage_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_storage_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste betaalprovider-mislukking; de alarmeerbare conditie zit in
  // zzp_billing_consecutive_failures / zzp_billing_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_billing_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste ongeldig-getekende betaal-webhook; de alarmeerbare conditie zit in
  // zzp_billing_webhook_auth_consecutive_failures / zzp_billing_webhook_auth_ok (event-gedreven).
  "zzp_billing_webhook_auth_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste verificatie-register-mislukking; de alarmeerbare conditie zit in
  // zzp_verification_consecutive_failures / zzp_verification_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_verification_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste rate-limit-store-mislukking; de alarmeerbare conditie zit in
  // zzp_ratelimit_consecutive_failures / zzp_ratelimit_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_ratelimit_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste gelekt-wachtwoord-controle-mislukking; de alarmeerbare conditie zit in
  // zzp_password_breach_consecutive_failures / zzp_password_breach_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_password_breach_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste error-monitoring-dispatch-mislukking; de alarmeerbare conditie zit in
  // zzp_error_monitoring_consecutive_failures / zzp_error_monitoring_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_error_monitoring_last_failure_age_seconds",
  // Rauwe leeftijd van de laatste upload-scan-mislukking; de alarmeerbare conditie zit in
  // zzp_upload_scan_consecutive_failures / zzp_upload_scan_delivery_ok (event-gedreven, geen staleness-op-leeftijd).
  "zzp_upload_scan_last_failure_age_seconds",
]);

/**
 * Een representatieve, volledige `MetricsInput` zodat `buildMetrics` élke gauge-naam produceert. De
 * concrete waarden doen niet ter zake — we lezen alleen de namen (de vorm van de expositie), niet de
 * waarden. Blijft `buildMetrics` de enige bron van gauge-namen, dan kan deze lijst niet driften.
 */
const SAMPLE_INPUT: MetricsInput = {
  dbReachable: true,
  metricsCollectionComplete: true,
  cronAgeSeconds: 0,
  cronOk: true,
  cronStale: false,
  // Niet-lege lijst zodat buildMetrics de gelabelde familie `zzp_cron_task_failed` produceert en de
  // drift-gate die naam kent (de waarden doen niet ter zake — we lezen alleen de namen).
  cronFailedTasks: ["voorbeeld"],
  backupAgeSeconds: 0,
  backupOk: true,
  backupStale: false,
  verificationQueue: 0,
  verificationQueueOldestAgeSeconds: null,
  maintenanceMode: false,
  overdueExpiryCredentials: 0,
  overdueExpirySubscriptions: 0,
  stalePendingSubscriptions: 0,
  overduePastDueDowngrades: 0,
  overdueUnflippedInvoices: 0,
  overdueReviewReveals: 0,
  overduePerformanceGrace: 0,
  overdueDisputeEscalations: 0,
  auditRetentionBacklog: 0,
  applicationsRetentionBacklog: 0,
  notificationsRetentionBacklog: 0,
  leadsRetentionBacklog: 0,
  healthIncidentsIpRetentionBacklog: 0,
  openIncidentsCritical: 0,
  openIncidentsWarn: 0,
  messagesRetentionBacklog: 0,
  supportTicketsRetentionBacklog: 0,
  webhookEventsRetentionBacklog: 0,
  routingCacheRetentionBacklog: 0,
  membershipUnbilledActive: 0,
  mailDeliveryOk: true,
  mailDeliveryConsecutiveFailures: 0,
  mailDeliveryLastFailureAgeSeconds: null,
  pushDeliveryOk: true,
  pushDeliveryConsecutiveFailures: 0,
  pushDeliveryLastFailureAgeSeconds: null,
  storageDeliveryOk: true,
  storageDeliveryConsecutiveFailures: 0,
  storageDeliveryLastFailureAgeSeconds: null,
  billingDeliveryOk: true,
  billingDeliveryConsecutiveFailures: 0,
  billingDeliveryLastFailureAgeSeconds: null,
  billingWebhookAuthOk: true,
  billingWebhookAuthConsecutiveFailures: 0,
  billingWebhookAuthLastFailureAgeSeconds: null,
  verificationDeliveryOk: true,
  verificationDeliveryConsecutiveFailures: 0,
  verificationDeliveryLastFailureAgeSeconds: null,
  rateLimitDeliveryOk: true,
  rateLimitDeliveryConsecutiveFailures: 0,
  rateLimitDeliveryLastFailureAgeSeconds: null,
  passwordBreachDeliveryOk: true,
  passwordBreachDeliveryConsecutiveFailures: 0,
  passwordBreachDeliveryLastFailureAgeSeconds: null,
  errorMonitoringDeliveryOk: true,
  errorMonitoringDeliveryConsecutiveFailures: 0,
  errorMonitoringDeliveryLastFailureAgeSeconds: null,
  uploadScanDeliveryOk: true,
  uploadScanDeliveryConsecutiveFailures: 0,
  uploadScanDeliveryLastFailureAgeSeconds: null,
};

/** De canonieke set gauge-namen die /api/metrics daadwerkelijk exposeert (uit `buildMetrics`). */
export function knownMetricNames(): Set<string> {
  return new Set(buildMetrics(SAMPLE_INPUT).map((m) => m.name));
}

/**
 * Alle `zzp_*`-metricnamen waarnaar het regels-bestand verwijst. Bewust een simpele token-scan over de
 * rauwe tekst (geen YAML/PromQL-parser nodig): elke `zzp_...`-identifier — of die nu in een `expr`,
 * een annotatie of een comment staat — moet een echte gauge zijn. Zo blijft ook de begeleidende tekst
 * eerlijk. Duplicaten worden ontdubbeld.
 */
export function referencedMetricNames(rulesText: string): Set<string> {
  const matches = rulesText.match(/zzp_[a-z0-9_]+/g) ?? [];
  return new Set(matches);
}
