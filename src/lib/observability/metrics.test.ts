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
  maintenanceMode: false,
  overdueExpiryCredentials: 0,
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
    expect(valueOf(HEALTHY, "zzp_maintenance_mode")).toBe(0);
    expect(valueOf(HEALTHY, "zzp_credentials_overdue_expiry")).toBe(0);
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

  it("gebruikt de AGE_NEVER-sentinel wanneer een heartbeat nog nooit draaide", () => {
    const input = { ...HEALTHY, cronAgeSeconds: null, backupAgeSeconds: null };
    expect(valueOf(input, "zzp_cron_heartbeat_age_seconds")).toBe(AGE_NEVER);
    expect(valueOf(input, "zzp_backup_heartbeat_age_seconds")).toBe(AGE_NEVER);
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
      maintenanceMode: true,
      overdueExpiryCredentials: 12,
    };
    expect(valueOf(input, "zzp_db_reachable")).toBe(0);
    expect(valueOf(input, "zzp_maintenance_mode")).toBe(1);
    expect(valueOf(input, "zzp_credentials_overdue_expiry")).toBe(12);
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
      "zzp_maintenance_mode",
      "zzp_credentials_overdue_expiry",
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
