import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma + de logger zodat we de DB-interactie (upsert-vorm, fail-open) en de write-coalescing kunnen
// verifiëren zonder echte databank. KRITISCH: deze module logt bewust via de logger (NIET via reportError),
// omdat reportError terugroutet door de Sentry-reporter → oneindige recursie. De test klinkt dat vast:
// @/lib/observability/report wordt NIET geïmporteerd/aangeroepen door deze module.
const findUnique = vi.hoisted(() => vi.fn());
const upsert = vi.hoisted(() => vi.fn(async () => ({})));
const loggerError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { errorMonitoringDeliveryHeartbeat: { findUnique, upsert } },
}));
vi.mock("@/lib/observability/logger", () => ({
  logger: { error: loggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import {
  ERROR_MONITORING_CHANNEL,
  __resetErrorMonitoringHeartbeatCoalescingForTests,
  getErrorMonitoringDeliveryFreshness,
  recordErrorMonitoringDeliveryFailure,
  recordErrorMonitoringDeliverySuccess,
} from "@/lib/observability/error-monitoring-delivery-heartbeat";

const T0 = new Date("2026-08-26T12:00:00.000Z");
const at = (msOffset: number) => new Date(T0.getTime() + msOffset);

beforeEach(() => {
  findUnique.mockReset();
  upsert.mockClear();
  upsert.mockImplementation(async () => ({}));
  loggerError.mockClear();
  __resetErrorMonitoringHeartbeatCoalescingForTests();
  process.env.ERROR_MONITORING_HEARTBEAT_COALESCE_MS = "15000";
});

afterEach(() => {
  delete process.env.ERROR_MONITORING_HEARTBEAT_COALESCE_MS;
});

describe("record success/failure — upsert-vorm", () => {
  it("succes zet lastOk=true, teller op 0, driver sentry, op het singleton-kanaal", async () => {
    await recordErrorMonitoringDeliverySuccess(T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channel: ERROR_MONITORING_CHANNEL },
        update: expect.objectContaining({
          lastOk: true,
          consecutiveFailures: 0,
          driver: "sentry",
        }),
      }),
    );
  });

  it("mislukking telt de teller atomair op en zet lastOk=false", async () => {
    await recordErrorMonitoringDeliveryFailure(T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          lastOk: false,
          consecutiveFailures: { increment: 1 },
        }),
      }),
    );
  });
});

describe("write-coalescing", () => {
  it("coalesceert opeenvolgende successen binnen het venster (max één schrijf)", async () => {
    await recordErrorMonitoringDeliverySuccess(T0);
    await recordErrorMonitoringDeliverySuccess(at(5_000));
    await recordErrorMonitoringDeliverySuccess(at(14_999));
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("schrijft opnieuw zodra het venster verstreken is", async () => {
    await recordErrorMonitoringDeliverySuccess(T0);
    await recordErrorMonitoringDeliverySuccess(at(15_001));
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("een mislukking schrijft altijd direct (nooit gecoalesceerd) en een herstel ook", async () => {
    await recordErrorMonitoringDeliverySuccess(T0); // schrijf 1
    await recordErrorMonitoringDeliveryFailure(at(1_000)); // schrijf 2 (direct)
    await recordErrorMonitoringDeliverySuccess(at(2_000)); // schrijf 3 (herstel, direct — binnen venster)
    expect(upsert).toHaveBeenCalledTimes(3);
  });
});

describe("fail-open — een DB-storing mag nooit doorbreken", () => {
  it("een upsert-fout wordt geslikt en via de logger gemeld (NIET via reportError)", async () => {
    upsert.mockRejectedValueOnce(new Error("db down"));
    await expect(recordErrorMonitoringDeliverySuccess(T0)).resolves.toBeUndefined();
    expect(loggerError).toHaveBeenCalledWith(
      "error-monitoring-delivery-heartbeat",
      expect.objectContaining({ op: "success" }),
    );
  });

  it("een leesfout geeft 'never' terug i.p.v. te werpen", async () => {
    findUnique.mockRejectedValueOnce(new Error("db down"));
    const f = await getErrorMonitoringDeliveryFreshness(T0);
    expect(f.status).toBe("never");
    expect(loggerError).toHaveBeenCalledWith(
      "error-monitoring-delivery-heartbeat",
      expect.objectContaining({ op: "read" }),
    );
  });

  it("na een mislukte success-schrijf coalesceert de volgende success niet weg", async () => {
    upsert.mockRejectedValueOnce(new Error("db down")); // schrijf 1 faalt
    await recordErrorMonitoringDeliverySuccess(T0);
    await recordErrorMonitoringDeliverySuccess(at(1_000)); // moet opnieuw proberen (binnen venster)
    expect(upsert).toHaveBeenCalledTimes(2);
  });
});

describe("freshness-lezing", () => {
  it("leest het singleton-kanaal en beoordeelt failing bij lastOk=false", async () => {
    findUnique.mockResolvedValueOnce({
      lastAttemptAt: at(-30_000),
      lastOk: false,
      lastSuccessAt: null,
      lastFailureAt: at(-30_000),
      consecutiveFailures: 4,
      driver: "sentry",
    });
    const f = await getErrorMonitoringDeliveryFreshness(T0);
    expect(findUnique).toHaveBeenCalledWith({ where: { channel: ERROR_MONITORING_CHANNEL } });
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(4);
    expect(f.failureAgeSeconds).toBe(30);
  });
});
