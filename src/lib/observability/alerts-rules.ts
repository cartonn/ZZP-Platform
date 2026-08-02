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
 * - `zzp_up`: is altijd 1 in een geslaagde scrape; afwezigheid vang je met een `up == 0`/absent-alert
 *   op de scrape zelf (targetniveau), niet op deze waarde.
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
]);

/**
 * Een representatieve, volledige `MetricsInput` zodat `buildMetrics` élke gauge-naam produceert. De
 * concrete waarden doen niet ter zake — we lezen alleen de namen (de vorm van de expositie), niet de
 * waarden. Blijft `buildMetrics` de enige bron van gauge-namen, dan kan deze lijst niet driften.
 */
const SAMPLE_INPUT: MetricsInput = {
  dbReachable: true,
  cronAgeSeconds: 0,
  cronOk: true,
  cronStale: false,
  backupAgeSeconds: 0,
  backupOk: true,
  backupStale: false,
  verificationQueue: 0,
  verificationQueueOldestAgeSeconds: null,
  maintenanceMode: false,
  overdueExpiryCredentials: 0,
  overdueExpirySubscriptions: 0,
  overdueUnflippedInvoices: 0,
  auditRetentionBacklog: 0,
  applicationsRetentionBacklog: 0,
  notificationsRetentionBacklog: 0,
  leadsRetentionBacklog: 0,
  healthIncidentsIpRetentionBacklog: 0,
  messagesRetentionBacklog: 0,
  webhookEventsRetentionBacklog: 0,
  routingCacheRetentionBacklog: 0,
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
