import { describe, expect, it } from "vitest";

import {
  evaluateUploadScanDeliveryFreshness,
  uploadScanDeliveryStatusItem,
  type UploadScanDeliveryHeartbeatFields,
} from "@/lib/observability/upload-scan-delivery-freshness";

const NOW = new Date("2026-08-27T12:00:00.000Z");
const at = (msOffset: number) => new Date(NOW.getTime() + msOffset);

const fields = (
  override: Partial<UploadScanDeliveryHeartbeatFields>,
): UploadScanDeliveryHeartbeatFields => ({
  lastAttemptAt: NOW,
  lastOk: true,
  lastSuccessAt: NOW,
  lastFailureAt: null,
  consecutiveFailures: 0,
  driver: "clamav",
  ...override,
});

describe("evaluateUploadScanDeliveryFreshness", () => {
  it("null of geen poging → never (neutraal gezond)", () => {
    expect(evaluateUploadScanDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluateUploadScanDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste scan geslaagd → ok, teller 0", () => {
    const f = evaluateUploadScanDeliveryFreshness(fields({ lastOk: true }), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("laatste scan mislukt → failing met teller en leeftijd", () => {
    const f = evaluateUploadScanDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(-45_000), consecutiveFailures: 5 }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(5);
    expect(f.failureAgeSeconds).toBe(45);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluateUploadScanDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(60_000), consecutiveFailures: 1 }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("negatieve/niet-eindige teller wordt 0", () => {
    const f = evaluateUploadScanDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: -3 }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });

  it("een geslaagde laatste scan nult de teller ook al stond die hoog", () => {
    const f = evaluateUploadScanDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9 }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("uploadScanDeliveryStatusItem", () => {
  it("never → ok-niveau, verwijst naar de env-variabele (geen secret-waarde)", () => {
    const item = uploadScanDeliveryStatusItem(evaluateUploadScanDeliveryFreshness(null, NOW));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("upload-scan-delivery-heartbeat");
    // De uitleg noemt de env-VARIABELENAAM (config-hint), nooit een concrete host/poort.
    expect(item.detail).toContain("UPLOAD_SCANNER");
    expect(item.detail).not.toContain("CLAMAV_HOST=");
  });

  it("failing → attention-niveau met driver in de modus + fail-open-waarschuwing", () => {
    const item = uploadScanDeliveryStatusItem(
      evaluateUploadScanDeliveryFreshness(
        fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: 3 }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toContain("clamav");
    expect(item.detail).toContain("UPLOAD_SCAN_FAIL_OPEN");
  });

  it("ok → ok-niveau, operationeel", () => {
    const item = uploadScanDeliveryStatusItem(
      evaluateUploadScanDeliveryFreshness(fields({ lastOk: true }), NOW),
    );
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("operationeel");
  });
});
