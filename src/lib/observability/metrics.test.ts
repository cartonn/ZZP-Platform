// Unit-tests voor de PURE metric-shaping/rendering (src/lib/observability/metrics.ts). Bewijst de
// deterministische mapping van operationele invoer → gauges, de heartbeat-sentinel (nog-nooit),
// de Prometheus-tekstexpositie en de JSON-vorm. Geen DB/HTTP.

import { describe, it, expect } from "vitest";
import {
  buildMetrics,
  metricsToJson,
  renderPrometheus,
  AGE_NEVER,
  type MetricsInput,
} from "./metrics";

const HEALTHY: MetricsInput = {
  dbReachable: true,
  metricsCollectionComplete: true,
  cronAgeSeconds: 3600,
  cronOk: true,
  cronStale: false,
  cronFailedTasks: [],
  backupAgeSeconds: 7200,
  backupOk: true,
  backupStale: false,
  verificationQueue: 4,
  verificationQueueOldestAgeSeconds: 1800,
  maintenanceMode: false,
  semanticMatcherDegraded: false,
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
  mailIntakeRetentionBacklog: 0,
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
  routingDeliveryOk: true,
  routingDeliveryConsecutiveFailures: 0,
  routingDeliveryLastFailureAgeSeconds: null,
  buildCommit: "abc1234",
  buildAt: "2026-01-01T00:00:00.000Z",
};

function valueOf(input: MetricsInput, name: string): number {
  const metric = buildMetrics(input).find((m) => m.name === name);
  if (!metric) throw new Error(`metric ${name} ontbreekt`);
  return metric.value;
}

describe("buildMetrics", () => {
  it("mapt een gezonde staat naar de verwachte gauges", () => {
    expect(valueOf(HEALTHY, "zzp_up")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_db_reachable")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_metrics_collection_complete")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_cron_heartbeat_age_seconds")).toBe(3600);
    expect(valueOf(HEALTHY, "zzp_cron_heartbeat_ok")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_cron_heartbeat_stale")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_backup_heartbeat_age_seconds")).toBe(7200);
    expect(valueOf(HEALTHY, "zzp_backup_heartbeat_ok")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_backup_heartbeat_stale")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_verification_queue")).toBe(4);
    expect(valueOf(HEALTHY, "zzp_verification_queue_oldest_age_seconds")).toBe(1800);
    expect(valueOf(HEALTHY, "zzp_maintenance_mode")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_semantic_matcher_degraded")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_credentials_overdue_expiry")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_subscriptions_overdue_expiry")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_subscriptions_stale_pending")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_invoices_overdue_unflipped")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_reviews_overdue_reveal")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_performances_overdue_grace")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_disputes_overdue_escalation")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_health_incidents_open_critical")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_health_incidents_open_warn")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_audit_retention_backlog")).toBe(0);
  });

  it("mapt onderhoudsmodus naar 1", () => {
    expect(valueOf({ ...HEALTHY, maintenanceMode: true }, "zzp_maintenance_mode")).toBe(1);
  });

  it("mapt semantische-matching-degradatie naar 1", () => {
    expect(
      valueOf({ ...HEALTHY, semanticMatcherDegraded: true }, "zzp_semantic_matcher_degraded"),
    ).toBe(1);
  });

  it("mapt de collectie-volledigheid-vlag naar 1 (compleet) en 0 (afgekapt)", () => {
    expect(
      valueOf({ ...HEALTHY, metricsCollectionComplete: true }, "zzp_metrics_collection_complete"),
    ).toBe(1);
    expect(
      valueOf({ ...HEALTHY, metricsCollectionComplete: false }, "zzp_metrics_collection_complete"),
    ).toBe(0);
  });

  it("plaatst zzp_metrics_collection_complete direct ná zzp_db_reachable", () => {
    const names = buildMetrics(HEALTHY).map((m) => m.name);
    const dbIdx = names.indexOf("zzp_db_reachable");
    expect(names[dbIdx + 1]).toBe("zzp_metrics_collection_complete");
  });

  it("exposeert zzp_build_info als constante 1-gauge met commit/built_at als labels", () => {
    const metric = buildMetrics({
      ...HEALTHY,
      buildCommit: "abc1234",
      buildAt: "2026-01-01T00:00:00.000Z",
    }).find((m) => m.name === "zzp_build_info");
    expect(metric).toBeDefined();
    expect(metric?.value).toBe(1);
    expect(metric?.labels).toEqual({ commit: "abc1234", built_at: "2026-01-01T00:00:00.000Z" });
  });

  it("valt terug op 'dev'/'onbekend' als de build-metadata leeg is", () => {
    const metric = buildMetrics({ ...HEALTHY, buildCommit: "", buildAt: "" }).find(
      (m) => m.name === "zzp_build_info",
    );
    expect(metric?.labels).toEqual({ commit: "dev", built_at: "onbekend" });
  });

  it("mapt de open-beveiligingsincidenten (CRITICAL/WARN) door als aparte gauges", () => {
    expect(
      valueOf({ ...HEALTHY, openIncidentsCritical: 2 }, "zzp_health_incidents_open_critical"),
    ).toBe(2);
    expect(valueOf({ ...HEALTHY, openIncidentsWarn: 5 }, "zzp_health_incidents_open_warn")).toBe(5);
  });

  it("klemt een negatieve/gebroken open-incidenten-teller veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, openIncidentsCritical: -1 }, "zzp_health_incidents_open_critical"),
    ).toBe(0);
    expect(valueOf({ ...HEALTHY, openIncidentsWarn: 4.8 }, "zzp_health_incidents_open_warn")).toBe(
      4,
    );
  });

  it("mapt de expiry-backlog (VERIFIED maar verlopen) door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, overdueExpiryCredentials: 7 }, "zzp_credentials_overdue_expiry"),
    ).toBe(7);
  });

  it("klemt een negatieve/gebroken expiry-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, overdueExpiryCredentials: -3 }, "zzp_credentials_overdue_expiry"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, overdueExpiryCredentials: 2.9 }, "zzp_credentials_overdue_expiry"),
    ).toBe(2);
  });

  it("mapt de abonnements-verval-backlog (ACTIVE maar verlopen) door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, overdueExpirySubscriptions: 5 }, "zzp_subscriptions_overdue_expiry"),
    ).toBe(5);
  });

  it("klemt een negatieve/gebroken abonnements-verval-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, overdueExpirySubscriptions: -4 }, "zzp_subscriptions_overdue_expiry"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, overdueExpirySubscriptions: 3.7 }, "zzp_subscriptions_overdue_expiry"),
    ).toBe(3);
  });

  it("mapt de vastgelopen-PENDING-abonnementen-detector door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, stalePendingSubscriptions: 9 }, "zzp_subscriptions_stale_pending"),
    ).toBe(9);
  });

  it("klemt een negatieve/gebroken vastgelopen-PENDING-teller veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, stalePendingSubscriptions: -2 }, "zzp_subscriptions_stale_pending"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, stalePendingSubscriptions: 4.8 }, "zzp_subscriptions_stale_pending"),
    ).toBe(4);
  });

  it("mapt de vastgelopen-PAST_DUE-downgrade-detector door als gauge", () => {
    expect(valueOf(HEALTHY, "zzp_subscriptions_past_due_overdue_downgrade")).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, overduePastDueDowngrades: 6 },
        "zzp_subscriptions_past_due_overdue_downgrade",
      ),
    ).toBe(6);
  });

  it("klemt een negatieve/gebroken PAST_DUE-downgrade-teller veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf(
        { ...HEALTHY, overduePastDueDowngrades: -5 },
        "zzp_subscriptions_past_due_overdue_downgrade",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, overduePastDueDowngrades: 2.9 },
        "zzp_subscriptions_past_due_overdue_downgrade",
      ),
    ).toBe(2);
  });

  it("mapt de betaal-verval-backlog (APPROVED maar verstreken) door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, overdueUnflippedInvoices: 6 }, "zzp_invoices_overdue_unflipped"),
    ).toBe(6);
  });

  it("klemt een negatieve/gebroken betaal-verval-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, overdueUnflippedInvoices: -2 }, "zzp_invoices_overdue_unflipped"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, overdueUnflippedInvoices: 4.8 }, "zzp_invoices_overdue_unflipped"),
    ).toBe(4);
  });

  it("mapt de reveal-backlog (PENDING_REVEAL maar venster verstreken) door als gauge", () => {
    expect(valueOf({ ...HEALTHY, overdueReviewReveals: 9 }, "zzp_reviews_overdue_reveal")).toBe(9);
  });

  it("klemt een negatieve/gebroken reveal-backlog veilig op een niet-negatief geheel getal", () => {
    expect(valueOf({ ...HEALTHY, overdueReviewReveals: -5 }, "zzp_reviews_overdue_reveal")).toBe(0);
    expect(valueOf({ ...HEALTHY, overdueReviewReveals: 3.6 }, "zzp_reviews_overdue_reveal")).toBe(
      3,
    );
  });

  it("mapt de dispute-escalatie-backlog (open disputen boven de drempel, niet-geëscaleerd) door als gauge", () => {
    expect(valueOf(HEALTHY, "zzp_disputes_overdue_escalation")).toBe(0);
    expect(
      valueOf({ ...HEALTHY, overdueDisputeEscalations: 4 }, "zzp_disputes_overdue_escalation"),
    ).toBe(4);
  });

  it("klemt een negatieve/gebroken dispute-escalatie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, overdueDisputeEscalations: -6 }, "zzp_disputes_overdue_escalation"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, overdueDisputeEscalations: 3.4 }, "zzp_disputes_overdue_escalation"),
    ).toBe(3);
  });

  it("mapt de audit-retentie-backlog (auditregels ouder dan het venster) door als gauge", () => {
    expect(valueOf({ ...HEALTHY, auditRetentionBacklog: 9 }, "zzp_audit_retention_backlog")).toBe(
      9,
    );
  });

  it("klemt een negatieve/gebroken audit-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(valueOf({ ...HEALTHY, auditRetentionBacklog: -7 }, "zzp_audit_retention_backlog")).toBe(
      0,
    );
    expect(valueOf({ ...HEALTHY, auditRetentionBacklog: 5.6 }, "zzp_audit_retention_backlog")).toBe(
      5,
    );
  });

  it("mapt de reactie-retentie-backlog (terminale reacties ouder dan het venster) door als gauge", () => {
    expect(
      valueOf(
        { ...HEALTHY, applicationsRetentionBacklog: 6 },
        "zzp_applications_retention_backlog",
      ),
    ).toBe(6);
  });

  it("klemt een negatieve/gebroken reactie-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf(
        { ...HEALTHY, applicationsRetentionBacklog: -3 },
        "zzp_applications_retention_backlog",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, applicationsRetentionBacklog: 4.9 },
        "zzp_applications_retention_backlog",
      ),
    ).toBe(4);
  });

  it("mapt de notificatie-retentie-backlog (notificaties ouder dan het venster) door als gauge", () => {
    expect(
      valueOf(
        { ...HEALTHY, notificationsRetentionBacklog: 8 },
        "zzp_notifications_retention_backlog",
      ),
    ).toBe(8);
  });

  it("klemt een negatieve/gebroken notificatie-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf(
        { ...HEALTHY, notificationsRetentionBacklog: -2 },
        "zzp_notifications_retention_backlog",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, notificationsRetentionBacklog: 3.7 },
        "zzp_notifications_retention_backlog",
      ),
    ).toBe(3);
  });

  it("mapt de lead-retentie-backlog (beslíste leads ouder dan het venster) door als gauge", () => {
    expect(valueOf({ ...HEALTHY, leadsRetentionBacklog: 5 }, "zzp_leads_retention_backlog")).toBe(
      5,
    );
  });

  it("klemt een negatieve/gebroken lead-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(valueOf({ ...HEALTHY, leadsRetentionBacklog: -4 }, "zzp_leads_retention_backlog")).toBe(
      0,
    );
    expect(valueOf({ ...HEALTHY, leadsRetentionBacklog: 6.2 }, "zzp_leads_retention_backlog")).toBe(
      6,
    );
  });

  it("mapt de incident-IP-retentie-backlog (incidenten ouder dan het venster) door als gauge", () => {
    expect(
      valueOf(
        { ...HEALTHY, healthIncidentsIpRetentionBacklog: 7 },
        "zzp_health_incidents_ip_retention_backlog",
      ),
    ).toBe(7);
  });

  it("klemt een negatieve/gebroken incident-IP-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf(
        { ...HEALTHY, healthIncidentsIpRetentionBacklog: -5 },
        "zzp_health_incidents_ip_retention_backlog",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, healthIncidentsIpRetentionBacklog: 2.8 },
        "zzp_health_incidents_ip_retention_backlog",
      ),
    ).toBe(2);
  });

  it("mapt de berichten-retentie-backlog (berichten ouder dan het venster) door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, messagesRetentionBacklog: 12 }, "zzp_messages_retention_backlog"),
    ).toBe(12);
  });

  it("klemt een negatieve/gebroken berichten-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, messagesRetentionBacklog: -5 }, "zzp_messages_retention_backlog"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, messagesRetentionBacklog: 2.8 }, "zzp_messages_retention_backlog"),
    ).toBe(2);
  });

  it("mapt de webhook-event-ledger-retentie-backlog (rijen ouder dan het venster) door als gauge", () => {
    expect(
      valueOf(
        { ...HEALTHY, webhookEventsRetentionBacklog: 20 },
        "zzp_webhook_events_retention_backlog",
      ),
    ).toBe(20);
  });

  it("klemt een negatieve/gebroken webhook-event-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf(
        { ...HEALTHY, webhookEventsRetentionBacklog: -5 },
        "zzp_webhook_events_retention_backlog",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, webhookEventsRetentionBacklog: 2.8 },
        "zzp_webhook_events_retention_backlog",
      ),
    ).toBe(2);
  });

  it("mapt de routing-cache-retentie-backlog (verlopen rijen over beide tabellen) door als gauge", () => {
    expect(
      valueOf(
        { ...HEALTHY, routingCacheRetentionBacklog: 33 },
        "zzp_routing_cache_retention_backlog",
      ),
    ).toBe(33);
  });

  it("klemt een negatieve/gebroken routing-cache-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf(
        { ...HEALTHY, routingCacheRetentionBacklog: -8 },
        "zzp_routing_cache_retention_backlog",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, routingCacheRetentionBacklog: 4.9 },
        "zzp_routing_cache_retention_backlog",
      ),
    ).toBe(4);
  });

  it("mapt de mail-intake-retentie-backlog (besliste, verlopen rijen) door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, mailIntakeRetentionBacklog: 22 }, "zzp_mail_intake_retention_backlog"),
    ).toBe(22);
  });

  it("klemt een negatieve/gebroken mail-intake-retentie-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, mailIntakeRetentionBacklog: -6 }, "zzp_mail_intake_retention_backlog"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, mailIntakeRetentionBacklog: 3.7 }, "zzp_mail_intake_retention_backlog"),
    ).toBe(3);
  });

  it("mapt de ongefactureerde-actieve-ZZP'ers-backlog door als gauge", () => {
    expect(
      valueOf({ ...HEALTHY, membershipUnbilledActive: 17 }, "zzp_membership_unbilled_active"),
    ).toBe(17);
  });

  it("klemt een negatieve/gebroken membership-backlog veilig op een niet-negatief geheel getal", () => {
    expect(
      valueOf({ ...HEALTHY, membershipUnbilledActive: -3 }, "zzp_membership_unbilled_active"),
    ).toBe(0);
    expect(
      valueOf({ ...HEALTHY, membershipUnbilledActive: 6.7 }, "zzp_membership_unbilled_active"),
    ).toBe(6);
  });

  it("gebruikt de AGE_NEVER-sentinel wanneer een heartbeat nog nooit draaide", () => {
    const input = { ...HEALTHY, cronAgeSeconds: null, backupAgeSeconds: null };
    expect(valueOf(input, "zzp_cron_heartbeat_age_seconds")).toBe(AGE_NEVER);
    expect(valueOf(input, "zzp_backup_heartbeat_age_seconds")).toBe(AGE_NEVER);
  });

  it("gebruikt de AGE_NEVER-sentinel voor de wachtrij-leeftijd wanneer de wachtrij leeg is", () => {
    expect(
      valueOf(
        { ...HEALTHY, verificationQueueOldestAgeSeconds: null },
        "zzp_verification_queue_oldest_age_seconds",
      ),
    ).toBe(AGE_NEVER);
  });

  it("klemt een negatieve/niet-hele wachtrij-leeftijd veilig", () => {
    expect(
      valueOf(
        { ...HEALTHY, verificationQueueOldestAgeSeconds: -10 },
        "zzp_verification_queue_oldest_age_seconds",
      ),
    ).toBe(0);
    expect(
      valueOf(
        { ...HEALTHY, verificationQueueOldestAgeSeconds: 90.7 },
        "zzp_verification_queue_oldest_age_seconds",
      ),
    ).toBe(90);
  });

  it("mapt een ongezonde staat naar 0-vlaggen en stale=1", () => {
    const input: MetricsInput = {
      dbReachable: false,
      metricsCollectionComplete: false,
      cronAgeSeconds: 999999,
      cronOk: false,
      cronStale: true,
      cronFailedTasks: ["payment-reminders", "expiry"],
      backupAgeSeconds: 999999,
      backupOk: null,
      backupStale: true,
      verificationQueue: 0,
      verificationQueueOldestAgeSeconds: null,
      maintenanceMode: true,
      semanticMatcherDegraded: true,
      overdueExpiryCredentials: 12,
      overdueExpirySubscriptions: 8,
      stalePendingSubscriptions: 16,
      overduePastDueDowngrades: 17,
      overdueUnflippedInvoices: 5,
      overdueReviewReveals: 10,
      overduePerformanceGrace: 13,
      overdueDisputeEscalations: 19,
      auditRetentionBacklog: 15,
      applicationsRetentionBacklog: 7,
      notificationsRetentionBacklog: 11,
      leadsRetentionBacklog: 4,
      healthIncidentsIpRetentionBacklog: 9,
      openIncidentsCritical: 2,
      openIncidentsWarn: 8,
      messagesRetentionBacklog: 3,
      supportTicketsRetentionBacklog: 5,
      webhookEventsRetentionBacklog: 6,
      routingCacheRetentionBacklog: 14,
      mailIntakeRetentionBacklog: 21,
      membershipUnbilledActive: 20,
      mailDeliveryOk: false,
      mailDeliveryConsecutiveFailures: 4,
      mailDeliveryLastFailureAgeSeconds: 300,
      pushDeliveryOk: false,
      pushDeliveryConsecutiveFailures: 5,
      pushDeliveryLastFailureAgeSeconds: 600,
      storageDeliveryOk: false,
      storageDeliveryConsecutiveFailures: 6,
      storageDeliveryLastFailureAgeSeconds: 900,
      billingDeliveryOk: false,
      billingDeliveryConsecutiveFailures: 7,
      billingDeliveryLastFailureAgeSeconds: 1200,
      billingWebhookAuthOk: false,
      billingWebhookAuthConsecutiveFailures: 9,
      billingWebhookAuthLastFailureAgeSeconds: 1500,
      verificationDeliveryOk: false,
      verificationDeliveryConsecutiveFailures: 8,
      verificationDeliveryLastFailureAgeSeconds: 1800,
      rateLimitDeliveryOk: false,
      rateLimitDeliveryConsecutiveFailures: 10,
      rateLimitDeliveryLastFailureAgeSeconds: 2100,
      passwordBreachDeliveryOk: false,
      passwordBreachDeliveryConsecutiveFailures: 11,
      passwordBreachDeliveryLastFailureAgeSeconds: 2400,
      errorMonitoringDeliveryOk: false,
      errorMonitoringDeliveryConsecutiveFailures: 12,
      errorMonitoringDeliveryLastFailureAgeSeconds: 2700,
      uploadScanDeliveryOk: false,
      uploadScanDeliveryConsecutiveFailures: 13,
      uploadScanDeliveryLastFailureAgeSeconds: 3000,
      routingDeliveryOk: false,
      routingDeliveryConsecutiveFailures: 14,
      routingDeliveryLastFailureAgeSeconds: 3300,
      buildCommit: "def5678",
      buildAt: "2026-02-02T00:00:00.000Z",
    };
    expect(valueOf(input, "zzp_db_reachable")).toBe(0);
    expect(valueOf(input, "zzp_metrics_collection_complete")).toBe(0);
    expect(valueOf(input, "zzp_mail_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_mail_consecutive_failures")).toBe(4);
    expect(valueOf(input, "zzp_mail_last_failure_age_seconds")).toBe(300);
    expect(valueOf(input, "zzp_push_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_push_consecutive_failures")).toBe(5);
    expect(valueOf(input, "zzp_push_last_failure_age_seconds")).toBe(600);
    expect(valueOf(input, "zzp_storage_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_storage_consecutive_failures")).toBe(6);
    expect(valueOf(input, "zzp_storage_last_failure_age_seconds")).toBe(900);
    expect(valueOf(input, "zzp_billing_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_billing_consecutive_failures")).toBe(7);
    expect(valueOf(input, "zzp_billing_last_failure_age_seconds")).toBe(1200);
    expect(valueOf(input, "zzp_billing_webhook_auth_ok")).toBe(0);
    expect(valueOf(input, "zzp_billing_webhook_auth_consecutive_failures")).toBe(9);
    expect(valueOf(input, "zzp_billing_webhook_auth_last_failure_age_seconds")).toBe(1500);
    expect(valueOf(input, "zzp_verification_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_verification_consecutive_failures")).toBe(8);
    expect(valueOf(input, "zzp_verification_last_failure_age_seconds")).toBe(1800);
    expect(valueOf(input, "zzp_ratelimit_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_ratelimit_consecutive_failures")).toBe(10);
    expect(valueOf(input, "zzp_ratelimit_last_failure_age_seconds")).toBe(2100);
    expect(valueOf(input, "zzp_password_breach_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_password_breach_consecutive_failures")).toBe(11);
    expect(valueOf(input, "zzp_password_breach_last_failure_age_seconds")).toBe(2400);
    expect(valueOf(input, "zzp_error_monitoring_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_error_monitoring_consecutive_failures")).toBe(12);
    expect(valueOf(input, "zzp_error_monitoring_last_failure_age_seconds")).toBe(2700);
    expect(valueOf(input, "zzp_upload_scan_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_upload_scan_consecutive_failures")).toBe(13);
    expect(valueOf(input, "zzp_upload_scan_last_failure_age_seconds")).toBe(3000);
    expect(valueOf(input, "zzp_routing_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_routing_consecutive_failures")).toBe(14);
    expect(valueOf(input, "zzp_routing_last_failure_age_seconds")).toBe(3300);
    expect(valueOf(input, "zzp_maintenance_mode")).toBe(1);
    expect(valueOf(input, "zzp_credentials_overdue_expiry")).toBe(12);
    expect(valueOf(input, "zzp_subscriptions_overdue_expiry")).toBe(8);
    expect(valueOf(input, "zzp_subscriptions_stale_pending")).toBe(16);
    expect(valueOf(input, "zzp_subscriptions_past_due_overdue_downgrade")).toBe(17);
    expect(valueOf(input, "zzp_invoices_overdue_unflipped")).toBe(5);
    expect(valueOf(input, "zzp_reviews_overdue_reveal")).toBe(10);
    expect(valueOf(input, "zzp_performances_overdue_grace")).toBe(13);
    expect(valueOf(input, "zzp_disputes_overdue_escalation")).toBe(19);
    expect(valueOf(input, "zzp_health_incidents_open_critical")).toBe(2);
    expect(valueOf(input, "zzp_health_incidents_open_warn")).toBe(8);
    expect(valueOf(input, "zzp_audit_retention_backlog")).toBe(15);
    expect(valueOf(input, "zzp_applications_retention_backlog")).toBe(7);
    expect(valueOf(input, "zzp_notifications_retention_backlog")).toBe(11);
    expect(valueOf(input, "zzp_leads_retention_backlog")).toBe(4);
    expect(valueOf(input, "zzp_health_incidents_ip_retention_backlog")).toBe(9);
    expect(valueOf(input, "zzp_messages_retention_backlog")).toBe(3);
    expect(valueOf(input, "zzp_support_tickets_retention_backlog")).toBe(5);
    expect(valueOf(input, "zzp_webhook_events_retention_backlog")).toBe(6);
    expect(valueOf(input, "zzp_routing_cache_retention_backlog")).toBe(14);
    expect(valueOf(input, "zzp_mail_intake_retention_backlog")).toBe(21);
    expect(valueOf(input, "zzp_membership_unbilled_active")).toBe(20);
    expect(valueOf(input, "zzp_cron_heartbeat_ok")).toBe(0);
    expect(valueOf(input, "zzp_cron_heartbeat_stale")).toBe(1);
    expect(valueOf(input, "zzp_backup_heartbeat_ok")).toBe(0);
    expect(valueOf(input, "zzp_backup_heartbeat_stale")).toBe(1);
  });

  it("klemt negatieve/niet-hele leeftijden en wachtrijdiepte", () => {
    const input = { ...HEALTHY, cronAgeSeconds: -5, verificationQueue: 3.9 };
    expect(valueOf(input, "zzp_cron_heartbeat_age_seconds")).toBe(0);
    expect(valueOf(input, "zzp_verification_queue")).toBe(3);
  });

  it("exposeert GEEN zzp_cron_task_failed-reeks bij een geslaagde run (lege familie)", () => {
    const family = buildMetrics(HEALTHY).filter((m) => m.name === "zzp_cron_task_failed");
    expect(family).toEqual([]);
  });

  it("exposeert één zzp_cron_task_failed-reeks (waarde 1) per gefaalde runner, gesorteerd + ontdubbeld", () => {
    const input: MetricsInput = {
      ...HEALTHY,
      cronOk: false,
      cronFailedTasks: ["reviews-reveal", "expiry", "reviews-reveal", "expiry"],
    };
    const family = buildMetrics(input).filter((m) => m.name === "zzp_cron_task_failed");
    expect(family.map((m) => m.labels?.task)).toEqual(["expiry", "reviews-reveal"]);
    expect(family.every((m) => m.value === 1)).toBe(true);
  });

  it("plaatst de zzp_cron_task_failed-familie direct ná zzp_cron_heartbeat_stale", () => {
    const input: MetricsInput = { ...HEALTHY, cronOk: false, cronFailedTasks: ["expiry"] };
    const names = buildMetrics(input).map((m) => m.name);
    const staleIdx = names.indexOf("zzp_cron_heartbeat_stale");
    expect(names[staleIdx + 1]).toBe("zzp_cron_task_failed");
    expect(names[staleIdx + 2]).toBe("zzp_backup_heartbeat_age_seconds");
  });

  it("levert een stabiele volgorde en volledige set gauges", () => {
    const names = buildMetrics(HEALTHY).map((m) => m.name);
    expect(names).toEqual([
      "zzp_up",
      "zzp_db_reachable",
      "zzp_metrics_collection_complete",
      "zzp_cron_heartbeat_age_seconds",
      "zzp_cron_heartbeat_ok",
      "zzp_cron_heartbeat_stale",
      "zzp_backup_heartbeat_age_seconds",
      "zzp_backup_heartbeat_ok",
      "zzp_backup_heartbeat_stale",
      "zzp_verification_queue",
      "zzp_verification_queue_oldest_age_seconds",
      "zzp_maintenance_mode",
      "zzp_semantic_matcher_degraded",
      "zzp_credentials_overdue_expiry",
      "zzp_subscriptions_overdue_expiry",
      "zzp_subscriptions_stale_pending",
      "zzp_subscriptions_past_due_overdue_downgrade",
      "zzp_invoices_overdue_unflipped",
      "zzp_reviews_overdue_reveal",
      "zzp_performances_overdue_grace",
      "zzp_disputes_overdue_escalation",
      "zzp_health_incidents_open_critical",
      "zzp_health_incidents_open_warn",
      "zzp_audit_retention_backlog",
      "zzp_applications_retention_backlog",
      "zzp_notifications_retention_backlog",
      "zzp_leads_retention_backlog",
      "zzp_health_incidents_ip_retention_backlog",
      "zzp_messages_retention_backlog",
      "zzp_support_tickets_retention_backlog",
      "zzp_webhook_events_retention_backlog",
      "zzp_routing_cache_retention_backlog",
      "zzp_mail_intake_retention_backlog",
      "zzp_membership_unbilled_active",
      "zzp_mail_delivery_ok",
      "zzp_mail_consecutive_failures",
      "zzp_mail_last_failure_age_seconds",
      "zzp_push_delivery_ok",
      "zzp_push_consecutive_failures",
      "zzp_push_last_failure_age_seconds",
      "zzp_storage_delivery_ok",
      "zzp_storage_consecutive_failures",
      "zzp_storage_last_failure_age_seconds",
      "zzp_billing_delivery_ok",
      "zzp_billing_consecutive_failures",
      "zzp_billing_last_failure_age_seconds",
      "zzp_billing_webhook_auth_ok",
      "zzp_billing_webhook_auth_consecutive_failures",
      "zzp_billing_webhook_auth_last_failure_age_seconds",
      "zzp_verification_delivery_ok",
      "zzp_verification_consecutive_failures",
      "zzp_verification_last_failure_age_seconds",
      "zzp_ratelimit_delivery_ok",
      "zzp_ratelimit_consecutive_failures",
      "zzp_ratelimit_last_failure_age_seconds",
      "zzp_password_breach_delivery_ok",
      "zzp_password_breach_consecutive_failures",
      "zzp_password_breach_last_failure_age_seconds",
      "zzp_error_monitoring_delivery_ok",
      "zzp_error_monitoring_consecutive_failures",
      "zzp_error_monitoring_last_failure_age_seconds",
      "zzp_upload_scan_delivery_ok",
      "zzp_upload_scan_consecutive_failures",
      "zzp_upload_scan_last_failure_age_seconds",
      "zzp_routing_delivery_ok",
      "zzp_routing_consecutive_failures",
      "zzp_routing_last_failure_age_seconds",
      "zzp_build_info",
    ]);
  });
});

describe("renderPrometheus", () => {
  it("emit per metric HELP/TYPE/waarde en een afsluitende newline", () => {
    const text = renderPrometheus(buildMetrics(HEALTHY));
    expect(text).toMatch(/# HELP zzp_up .+/);
    expect(text).toMatch(/# TYPE zzp_up gauge/);
    expect(text).toMatch(/\nzzp_up 1\n/);
    expect(text.endsWith("\n")).toBe(true);
  });

  it("rendert zzp_build_info met alfabetisch gesorteerde labels (built_at vóór commit)", () => {
    const text = renderPrometheus(
      buildMetrics({ ...HEALTHY, buildCommit: "abc1234", buildAt: "2026-01-01T00:00:00.000Z" }),
    );
    expect(text).toContain(
      'zzp_build_info{built_at="2026-01-01T00:00:00.000Z",commit="abc1234"} 1',
    );
  });

  it("valt niet-eindige waarden veilig terug op 0", () => {
    const text = renderPrometheus([
      { name: "zzp_test", help: "h", type: "gauge", value: Number.NaN },
    ]);
    expect(text).toContain("zzp_test 0");
    expect(text).not.toContain("NaN");
  });

  it("emit HELP/TYPE precies één keer per naam voor een gelabelde familie", () => {
    const text = renderPrometheus([
      {
        name: "zzp_cron_task_failed",
        help: "h",
        type: "gauge",
        labels: { task: "expiry" },
        value: 1,
      },
      {
        name: "zzp_cron_task_failed",
        help: "h",
        type: "gauge",
        labels: { task: "payment-reminders" },
        value: 1,
      },
    ]);
    // Prometheus verbiedt dubbele HELP/TYPE-regels onder dezelfde naam.
    expect(text.match(/# HELP zzp_cron_task_failed /g)).toHaveLength(1);
    expect(text.match(/# TYPE zzp_cron_task_failed /g)).toHaveLength(1);
    expect(text).toContain('zzp_cron_task_failed{task="expiry"} 1');
    expect(text).toContain('zzp_cron_task_failed{task="payment-reminders"} 1');
  });

  it("rendert gauges zonder labels byte-identiek (geen leeg {}-suffix)", () => {
    const text = renderPrometheus([{ name: "zzp_up", help: "h", type: "gauge", value: 1 }]);
    expect(text).toContain("\nzzp_up 1\n");
    expect(text).not.toContain("zzp_up{}");
  });

  it("escapet labelwaarden (backslash, quote, newline)", () => {
    const text = renderPrometheus([
      {
        name: "zzp_cron_task_failed",
        help: "h",
        type: "gauge",
        labels: { task: 'a"b\\c\nd' },
        value: 1,
      },
    ]);
    expect(text).toContain('zzp_cron_task_failed{task="a\\"b\\\\c\\nd"} 1');
  });
});

describe("metricsToJson", () => {
  it("vlakt de metrics tot { naam: waarde }", () => {
    const json = metricsToJson(buildMetrics(HEALTHY));
    expect(json.zzp_up).toBe(1);
    expect(json.zzp_verification_queue).toBe(4);
    expect(json.zzp_cron_heartbeat_age_seconds).toBe(3600);
  });

  it("keyt een gelabelde reeks met het label-suffix (geen collision onder dezelfde naam)", () => {
    const json = metricsToJson(
      buildMetrics({
        ...HEALTHY,
        cronOk: false,
        cronFailedTasks: ["expiry", "payment-reminders"],
      }),
    );
    expect(json['zzp_cron_task_failed{task="expiry"}']).toBe(1);
    expect(json['zzp_cron_task_failed{task="payment-reminders"}']).toBe(1);
    // De kale naam bestaat niet als sleutel (elke reeks draagt zijn labelsuffix).
    expect(json.zzp_cron_task_failed).toBeUndefined();
  });
});
