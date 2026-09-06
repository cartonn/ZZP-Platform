// Generator + enige bron van waarheid voor het Grafana-dashboard van /api/metrics
// (docs/observability/grafana-dashboard.json). Completeert de observability-triade naast het
// scrape-/rules-bestand: /api/metrics exposeert de gauges (src/lib/observability/metrics.ts),
// alerts.yml vertaalt ze naar alerts, en dit dashboard visualiseert ze zodat een operator de
// dead-man's-switch-heartbeats, aflever-kanalen, cron-backlogs en AVG-retentie in één oogopslag ziet
// ZONDER op /admin/systeemstatus in te loggen.
//
// PUUR + deterministisch (geen Next/HTTP/DB): een declaratieve secties-spec → een Grafana-dashboard-
// object. De drift-gate-test (src/lib/observability/grafana-dashboard.test.ts) klinkt (a) de
// gecommitte JSON vast aan de uitvoer van deze generator (geen handmatige drift) en (b) de door de
// panelen gerefereerde `zzp_*`-namen aan de gauges die /api/metrics écht exposeert (buildMetrics),
// zodat een hernoemde/verwijderde gauge (dood paneel) of een nieuwe gauge zonder paneel de CI-poort
// breekt i.p.v. stil een gat in het dashboard te laten.
//
// Regenereren na een layout-wijziging:
//   node scripts/grafana-dashboard.mjs --write && npx prettier --write docs/observability/grafana-dashboard.json
// (de generator bepaalt de INHOUD; Prettier bepaalt de FORMATTING — de drift-test vergelijkt geparsede
// inhoud, de `prettier --check`-poort de bytes.)
//
// De gauges bevatten NOOIT persoonsgegevens — alleen geaggregeerde tellingen/leeftijden/vlaggen.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";

// Portable Prometheus-datasource-referentie: een dashboard-variabele zodat een import het aan de
// eigen Prometheus koppelt zonder een gehardcodeerde uid (Grafana-conventie).
const DS = { type: "prometheus", uid: "${datasource}" };

const GRID_W = 24; // Grafana-rasterbreedte (kolommen).

/**
 * Declaratieve dashboard-spec: rijen met panelen. Elk paneel benoemt de gauges die het toont; de
 * generator plaatst ze en bouwt de PromQL-targets. Eén gauge hoort in precies één inhoudelijk paneel
 * (de coverage-gate eist dat élke geëxposeerde gauge hier voorkomt).
 *
 * paneltypes:
 *  - "stat"       : momentopname-vlaggen (0/1) of kleine tellingen, per gauge één waarde.
 *  - "timeseries" : verloop over tijd (leeftijden, oplopende backlogs).
 *  - "table"      : gelabelde families / build-info (labels als kolommen).
 */
const SECTIONS = [
  {
    row: "Overzicht & beschikbaarheid",
    panels: [
      {
        title: "Applicatie & database",
        type: "stat",
        w: 12,
        gauges: [
          ["zzp_up", "App verwerkt scrape"],
          ["zzp_db_reachable", "Database bereikbaar"],
          ["zzp_metrics_collection_complete", "Scrape compleet"],
        ],
      },
      {
        title: "Modus & degradatie",
        type: "stat",
        w: 12,
        gauges: [
          ["zzp_maintenance_mode", "Onderhoudsmodus"],
          ["zzp_semantic_matcher_degraded", "Matching gedegradeerd"],
        ],
      },
      {
        title: "Draaiende build",
        type: "table",
        w: 24,
        gauges: [["zzp_build_info", "Build"]],
      },
    ],
  },
  {
    row: "Dead-man's-switch — cron & back-up",
    panels: [
      {
        title: "Cron-heartbeat",
        type: "stat",
        w: 8,
        gauges: [
          ["zzp_cron_heartbeat_ok", "Laatste run ok"],
          ["zzp_cron_heartbeat_stale", "Stale (buiten venster)"],
        ],
      },
      {
        title: "Back-up-heartbeat",
        type: "stat",
        w: 8,
        gauges: [
          ["zzp_backup_heartbeat_ok", "Laatste back-up ok"],
          ["zzp_backup_heartbeat_stale", "Stale (buiten venster)"],
        ],
      },
      {
        title: "Gefaalde cron-taken",
        type: "table",
        w: 8,
        gauges: [["zzp_cron_task_failed", "{{task}}"]],
      },
      {
        title: "Heartbeat-leeftijd (s)",
        type: "timeseries",
        w: 24,
        unit: "s",
        gauges: [
          ["zzp_cron_heartbeat_age_seconds", "Cron"],
          ["zzp_backup_heartbeat_age_seconds", "Back-up"],
        ],
      },
    ],
  },
  {
    row: "Aflever-kanalen (dead-man's-switch)",
    panels: [
      {
        title: "Kanaal levert af (1 = ok)",
        type: "stat",
        w: 24,
        gauges: [
          ["zzp_mail_delivery_ok", "E-mail"],
          ["zzp_push_delivery_ok", "Web-push"],
          ["zzp_storage_delivery_ok", "Object-opslag"],
          ["zzp_billing_delivery_ok", "Betaalprovider"],
          ["zzp_billing_webhook_auth_ok", "Betaal-webhook-auth"],
          ["zzp_verification_delivery_ok", "Verificatie-registers"],
          ["zzp_ratelimit_delivery_ok", "Rate-limit-store"],
          ["zzp_password_breach_delivery_ok", "Gelekt-wachtwoord"],
          ["zzp_error_monitoring_delivery_ok", "Error-monitoring"],
          ["zzp_upload_scan_delivery_ok", "Malware-scan"],
          ["zzp_routing_delivery_ok", "Reistijd-routing"],
        ],
      },
      {
        title: "Opeenvolgende mislukkingen per kanaal",
        type: "timeseries",
        w: 24,
        gauges: [
          ["zzp_mail_consecutive_failures", "E-mail"],
          ["zzp_push_consecutive_failures", "Web-push"],
          ["zzp_storage_consecutive_failures", "Object-opslag"],
          ["zzp_billing_consecutive_failures", "Betaalprovider"],
          ["zzp_billing_webhook_auth_consecutive_failures", "Betaal-webhook-auth"],
          ["zzp_verification_consecutive_failures", "Verificatie-registers"],
          ["zzp_ratelimit_consecutive_failures", "Rate-limit-store"],
          ["zzp_password_breach_consecutive_failures", "Gelekt-wachtwoord"],
          ["zzp_error_monitoring_consecutive_failures", "Error-monitoring"],
          ["zzp_upload_scan_consecutive_failures", "Malware-scan"],
          ["zzp_routing_consecutive_failures", "Reistijd-routing"],
        ],
      },
      {
        title: "Leeftijd laatste mislukking per kanaal (s)",
        type: "timeseries",
        w: 24,
        unit: "s",
        gauges: [
          ["zzp_mail_last_failure_age_seconds", "E-mail"],
          ["zzp_push_last_failure_age_seconds", "Web-push"],
          ["zzp_storage_last_failure_age_seconds", "Object-opslag"],
          ["zzp_billing_last_failure_age_seconds", "Betaalprovider"],
          ["zzp_billing_webhook_auth_last_failure_age_seconds", "Betaal-webhook-auth"],
          ["zzp_verification_last_failure_age_seconds", "Verificatie-registers"],
          ["zzp_ratelimit_last_failure_age_seconds", "Rate-limit-store"],
          ["zzp_password_breach_last_failure_age_seconds", "Gelekt-wachtwoord"],
          ["zzp_error_monitoring_last_failure_age_seconds", "Error-monitoring"],
          ["zzp_upload_scan_last_failure_age_seconds", "Malware-scan"],
          ["zzp_routing_last_failure_age_seconds", "Reistijd-routing"],
        ],
      },
    ],
  },
  {
    row: "Verificatie-wachtrij (SLA — kern-differentiator)",
    panels: [
      {
        title: "Openstaande inzendingen",
        type: "stat",
        w: 8,
        gauges: [["zzp_verification_queue", "Wachtrijdiepte"]],
      },
      {
        title: "Leeftijd oudste inzending (s)",
        type: "timeseries",
        w: 16,
        unit: "s",
        gauges: [["zzp_verification_queue_oldest_age_seconds", "Oudste wachttijd"]],
      },
    ],
  },
  {
    row: "Vastgelopen-pijplijn — cron-backlogs",
    panels: [
      {
        title: "Onverwerkte overgangen (aantal)",
        type: "timeseries",
        w: 24,
        gauges: [
          ["zzp_credentials_overdue_expiry", "Certificaten → EXPIRED"],
          ["zzp_subscriptions_overdue_expiry", "Abonnementen → CANCELLED"],
          ["zzp_subscriptions_stale_pending", "Abonnementen PENDING (stil-kapotte-webhook)"],
          ["zzp_subscriptions_past_due_overdue_downgrade", "PAST_DUE → downgrade"],
          ["zzp_invoices_overdue_unflipped", "Facturen → OVERDUE"],
          ["zzp_reviews_overdue_reveal", "Beoordelingen → reveal"],
          ["zzp_performances_overdue_grace", "Prestaties → auto-goedkeur"],
          ["zzp_disputes_overdue_escalation", "Disputen → escalatie"],
          ["zzp_membership_unbilled_active", "Lidmaatschap ongefactureerd"],
        ],
      },
    ],
  },
  {
    row: "Beveiligingsincidenten (eigen bewakingsmotor)",
    panels: [
      {
        title: "Open incidenten",
        type: "stat",
        w: 24,
        gauges: [
          ["zzp_health_incidents_open_critical", "CRITICAL (open)"],
          ["zzp_health_incidents_open_warn", "WARN (open)"],
        ],
      },
    ],
  },
  {
    row: "AVG-retentie-backlogs (dataminimalisatie)",
    panels: [
      {
        title: "Onverwerkte snoei-/redactie-backlog (aantal)",
        type: "timeseries",
        w: 24,
        gauges: [
          ["zzp_audit_retention_backlog", "Auditlog"],
          ["zzp_applications_retention_backlog", "Reacties"],
          ["zzp_notifications_retention_backlog", "Notificaties"],
          ["zzp_leads_retention_backlog", "Leads"],
          ["zzp_health_incidents_ip_retention_backlog", "Incident-IP-redactie"],
          ["zzp_messages_retention_backlog", "Berichten"],
          ["zzp_support_tickets_retention_backlog", "Support-tickets"],
          ["zzp_webhook_events_retention_backlog", "Webhook-ledger (geen PII)"],
          ["zzp_routing_cache_retention_backlog", "Routing-cache"],
          ["zzp_mail_intake_retention_backlog", "Mail-intake"],
        ],
      },
    ],
  },
];

/** Bouwt één paneel-object op de gegeven rasterpositie. */
function buildPanel(spec, id, x, y) {
  const targets = spec.gauges.map(([expr, legend], i) => ({
    datasource: DS,
    expr,
    legendFormat: legend,
    refId: String.fromCharCode(65 + i), // A, B, C, ...
  }));

  const base = {
    id,
    type: spec.type,
    title: spec.title,
    datasource: DS,
    gridPos: { x, y, w: spec.w, h: spec.type === "stat" ? 5 : 8 },
    targets,
  };

  if (spec.type === "stat") {
    base.options = {
      colorMode: "value",
      graphMode: "area",
      justifyMode: "auto",
      textMode: "value_and_name",
      reduceOptions: { calc: "lastNotNull", fields: "", values: false },
    };
    base.fieldConfig = { defaults: { unit: spec.unit ?? "none" }, overrides: [] };
  } else if (spec.type === "timeseries") {
    base.options = {
      legend: { displayMode: "table", placement: "bottom", calcs: ["lastNotNull"] },
    };
    base.fieldConfig = {
      defaults: {
        unit: spec.unit ?? "none",
        custom: { drawStyle: "line", lineWidth: 1, fillOpacity: 8, showPoints: "never" },
      },
      overrides: [],
    };
  } else {
    // table (gelabelde families / build-info): toon de laatste waarde met de labels als kolommen.
    base.options = { showHeader: true };
    base.fieldConfig = { defaults: { unit: spec.unit ?? "none" }, overrides: [] };
    base.transformations = [{ id: "labelsToFields", options: {} }];
    base.targets = spec.gauges.map(([expr, legend], i) => ({
      datasource: DS,
      expr,
      legendFormat: legend,
      refId: String.fromCharCode(65 + i),
      format: "table",
      instant: true,
    }));
  }

  return base;
}

/** Bouwt het volledige Grafana-dashboard-object uit de declaratieve secties-spec. */
export function buildDashboard() {
  const panels = [];
  let id = 1;
  let y = 0;

  for (const section of SECTIONS) {
    panels.push({
      id: id++,
      type: "row",
      title: section.row,
      collapsed: false,
      gridPos: { x: 0, y, w: GRID_W, h: 1 },
      panels: [],
    });
    y += 1;

    let x = 0;
    let rowH = 0;
    for (const panelSpec of section.panels) {
      if (x + panelSpec.w > GRID_W) {
        x = 0;
        y += rowH;
        rowH = 0;
      }
      const panel = buildPanel(panelSpec, id++, x, y);
      panels.push(panel);
      x += panelSpec.w;
      rowH = Math.max(rowH, panel.gridPos.h);
    }
    y += rowH;
  }

  return {
    __inputs: [],
    __requires: [],
    annotations: { list: [] },
    editable: true,
    fiscalYearStartMonth: 0,
    graphTooltip: 1,
    links: [],
    liveNow: false,
    panels,
    refresh: "1m",
    schemaVersion: 39,
    tags: ["zzp-platform", "observability"],
    templating: {
      list: [
        {
          name: "datasource",
          type: "datasource",
          query: "prometheus",
          label: "Prometheus",
          hide: 0,
          refresh: 1,
          regex: "",
          current: {},
          options: [],
        },
      ],
    },
    time: { from: "now-6h", to: "now" },
    timepicker: {},
    timezone: "browser",
    title: "ZZP Platform — operationele gezondheid",
    uid: "zzp-platform-ops",
    version: 1,
    weekStart: "",
  };
}

/** Deterministische, prettier-compatibele JSON-serialisatie (2-spaties, afsluitende newline). */
export function renderDashboardJson() {
  return JSON.stringify(buildDashboard(), null, 2) + "\n";
}

const OUTPUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "observability",
  "grafana-dashboard.json",
);

// CLI: `node scripts/grafana-dashboard.mjs --write` schrijft de gecommitte JSON opnieuw.
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--write")) {
  writeFileSync(OUTPUT_PATH, renderDashboardJson());
  console.log(`grafana-dashboard.json geschreven (${OUTPUT_PATH})`);
}
