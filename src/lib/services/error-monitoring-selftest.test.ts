import { describe, expect, it } from "vitest";

import type { ErrorMonitoringProbeResult } from "@/lib/observability/report";
import {
  runErrorMonitoringSelfTest,
  safeErrorMonitoringDetail,
} from "@/lib/services/error-monitoring-selftest";

const installedDelivered: ErrorMonitoringProbeResult = {
  packageInstalled: true,
  delivered: true,
  detail: "flush geslaagd",
};

describe("runErrorMonitoringSelfTest", () => {
  it("meldt eerlijk 'niets getest' als er geen monitoring geconfigureerd is (geen vals groen)", async () => {
    let called = false;
    const report = await runErrorMonitoringSelfTest({
      active: false,
      run: async () => {
        called = true;
        return installedDelivered;
      },
    });

    expect(called).toBe(false); // run mag nooit draaien op een inactieve monitoring
    expect(report.ok).toBe(true);
    expect(report.active).toBe(false);
    expect(report.packageInstalled).toBe(false);
    expect(report.delivered).toBe(false);
    expect(report.detail).toContain("SENTRY_DSN");
  });

  it("is groen als het pakket geïnstalleerd is én de gebeurtenis is afgeleverd", async () => {
    const report = await runErrorMonitoringSelfTest({
      active: true,
      run: async () => installedDelivered,
    });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.packageInstalled).toBe(true);
    expect(report.delivered).toBe(true);
  });

  it("faalt als de DSN gezet is maar @sentry/nextjs niet geïnstalleerd is (stille console-fallback)", async () => {
    const report = await runErrorMonitoringSelfTest({
      active: true,
      run: async () => ({
        packageInstalled: false,
        delivered: false,
        detail: "pakket niet geïnstalleerd",
      }),
    });

    expect(report.ok).toBe(false);
    expect(report.active).toBe(true);
    expect(report.packageInstalled).toBe(false);
    expect(report.delivered).toBe(false);
  });

  it("faalt bij een flush-time-out (pakket wel geïnstalleerd, maar transport bevestigde niet)", async () => {
    const report = await runErrorMonitoringSelfTest({
      active: true,
      run: async () => ({
        packageInstalled: true,
        delivered: false,
        detail: "flush-time-out",
      }),
    });

    expect(report.ok).toBe(false);
    expect(report.delivered).toBe(false);
  });

  it("vangt een gooiende probe en geeft een veilige, secret-vrije detail terug", async () => {
    const report = await runErrorMonitoringSelfTest({
      active: true,
      run: async () => {
        throw new TypeError("dsn=https://secret@sentry.example/1 mag NOOIT lekken");
      },
    });

    expect(report.ok).toBe(false);
    expect(report.detail).toBe("TypeError"); // alleen de error-NAAM, nooit het rauwe bericht
    expect(report.detail).not.toContain("secret");
  });

  it("telt een actieve monitoring zonder probe als een programmeerfout (fout)", async () => {
    const report = await runErrorMonitoringSelfTest({ active: true });
    expect(report.ok).toBe(false);
    expect(report.packageInstalled).toBe(false);
  });
});

describe("safeErrorMonitoringDetail", () => {
  it("geeft alleen de error-naam terug, nooit het bericht", () => {
    expect(safeErrorMonitoringDetail(new RangeError("gevoelig endpoint"))).toBe("RangeError");
  });

  it("valt terug op 'Error' voor niet-Error-waarden", () => {
    expect(safeErrorMonitoringDetail("string-fout")).toBe("Error");
    expect(safeErrorMonitoringDetail(null)).toBe("Error");
  });
});
