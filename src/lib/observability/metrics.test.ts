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
  cronAgeSeconds: 3600,
  cronOk: true,
  cronStale: false,
  backupAgeSeconds: 7200,
  backupOk: true,
  backupStale: false,
  verificationQueue: 4,
  verificationQueueOldestAgeSeconds: 1800,
  maintenanceMode: false,
  overdueExpiryCredentials: 0,
  overdueExpirySubscriptions: 0,
  overdueUnflippedInvoices: 0,
  overdueReviewReveals: 0,
  auditRetentionBacklog: 0,
  applicationsRetentionBacklog: 0,
  notificationsRetentionBacklog: 0,
  leadsRetentionBacklog: 0,
  healthIncidentsIpRetentionBacklog: 0,
  messagesRetentionBacklog: 0,
  webhookEventsRetentionBacklog: 0,
  routingCacheRetentionBacklog: 0,
  mailDeliveryOk: true,
  mailDeliveryConsecutiveFailures: 0,
  mailDeliveryLastFailureAgeSeconds: null,
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
    expect(valueOf(HEALTHY, "zzp_cron_heartbeat_age_seconds")).toBe(3600);
    expect(valueOf(HEALTHY, "zzp_cron_heartbeat_ok")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_cron_heartbeat_stale")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_backup_heartbeat_age_seconds")).toBe(7200);
    expect(valueOf(HEALTHY, "zzp_backup_heartbeat_ok")).toBe(1);
    expect(valueOf(HEALTHY, "zzp_backup_heartbeat_stale")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_verification_queue")).toBe(4);
    expect(valueOf(HEALTHY, "zzp_verification_queue_oldest_age_seconds")).toBe(1800);
    expect(valueOf(HEALTHY, "zzp_maintenance_mode")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_credentials_overdue_expiry")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_subscriptions_overdue_expiry")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_invoices_overdue_unflipped")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_reviews_overdue_reveal")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_audit_retention_backlog")).toBe(0);
  });

  it("mapt onderhoudsmodus naar 1", () => {
    expect(valueOf({ ...HEALTHY, maintenanceMode: true }, "zzp_maintenance_mode")).toBe(1);
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
      cronAgeSeconds: 999999,
      cronOk: false,
      cronStale: true,
      backupAgeSeconds: 999999,
      backupOk: null,
      backupStale: true,
      verificationQueue: 0,
      verificationQueueOldestAgeSeconds: null,
      maintenanceMode: true,
      overdueExpiryCredentials: 12,
      overdueExpirySubscriptions: 8,
      overdueUnflippedInvoices: 5,
      overdueReviewReveals: 10,
      auditRetentionBacklog: 15,
      applicationsRetentionBacklog: 7,
      notificationsRetentionBacklog: 11,
      leadsRetentionBacklog: 4,
      healthIncidentsIpRetentionBacklog: 9,
      messagesRetentionBacklog: 3,
      webhookEventsRetentionBacklog: 6,
      routingCacheRetentionBacklog: 14,
      mailDeliveryOk: false,
      mailDeliveryConsecutiveFailures: 4,
      mailDeliveryLastFailureAgeSeconds: 300,
    };
    expect(valueOf(input, "zzp_db_reachable")).toBe(0);
    expect(valueOf(input, "zzp_mail_delivery_ok")).toBe(0);
    expect(valueOf(input, "zzp_mail_consecutive_failures")).toBe(4);
    expect(valueOf(input, "zzp_mail_last_failure_age_seconds")).toBe(300);
    expect(valueOf(input, "zzp_maintenance_mode")).toBe(1);
    expect(valueOf(input, "zzp_credentials_overdue_expiry")).toBe(12);
    expect(valueOf(input, "zzp_subscriptions_overdue_expiry")).toBe(8);
    expect(valueOf(input, "zzp_invoices_overdue_unflipped")).toBe(5);
    expect(valueOf(input, "zzp_reviews_overdue_reveal")).toBe(10);
    expect(valueOf(input, "zzp_audit_retention_backlog")).toBe(15);
    expect(valueOf(input, "zzp_applications_retention_backlog")).toBe(7);
    expect(valueOf(input, "zzp_notifications_retention_backlog")).toBe(11);
    expect(valueOf(input, "zzp_leads_retention_backlog")).toBe(4);
    expect(valueOf(input, "zzp_health_incidents_ip_retention_backlog")).toBe(9);
    expect(valueOf(input, "zzp_messages_retention_backlog")).toBe(3);
    expect(valueOf(input, "zzp_webhook_events_retention_backlog")).toBe(6);
    expect(valueOf(input, "zzp_routing_cache_retention_backlog")).toBe(14);
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

  it("levert een stabiele volgorde en volledige set gauges", () => {
    const names = buildMetrics(HEALTHY).map((m) => m.name);
    expect(names).toEqual([
      "zzp_up",
      "zzp_db_reachable",
      "zzp_cron_heartbeat_age_seconds",
      "zzp_cron_heartbeat_ok",
      "zzp_cron_heartbeat_stale",
      "zzp_backup_heartbeat_age_seconds",
      "zzp_backup_heartbeat_ok",
      "zzp_backup_heartbeat_stale",
      "zzp_verification_queue",
      "zzp_verification_queue_oldest_age_seconds",
      "zzp_maintenance_mode",
      "zzp_credentials_overdue_expiry",
      "zzp_subscriptions_overdue_expiry",
      "zzp_invoices_overdue_unflipped",
      "zzp_reviews_overdue_reveal",
      "zzp_audit_retention_backlog",
      "zzp_applications_retention_backlog",
      "zzp_notifications_retention_backlog",
      "zzp_leads_retention_backlog",
      "zzp_health_incidents_ip_retention_backlog",
      "zzp_messages_retention_backlog",
      "zzp_webhook_events_retention_backlog",
      "zzp_routing_cache_retention_backlog",
      "zzp_mail_delivery_ok",
      "zzp_mail_consecutive_failures",
      "zzp_mail_last_failure_age_seconds",
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

  it("valt niet-eindige waarden veilig terug op 0", () => {
    const text = renderPrometheus([
      { name: "zzp_test", help: "h", type: "gauge", value: Number.NaN },
    ]);
    expect(text).toContain("zzp_test 0");
    expect(text).not.toContain("NaN");
  });
});

describe("metricsToJson", () => {
  it("vlakt de metrics tot { naam: waarde }", () => {
    const json = metricsToJson(buildMetrics(HEALTHY));
    expect(json.zzp_up).toBe(1);
    expect(json.zzp_verification_queue).toBe(4);
    expect(json.zzp_cron_heartbeat_age_seconds).toBe(3600);
  });
});
