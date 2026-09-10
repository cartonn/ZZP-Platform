import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma + de foutrapportage/log zodat we de gedeelde DB-interactie (upsert-vorm, coalescing,
// fail-open) kunnen verifiëren zonder echte databank.
const findUnique = vi.hoisted(() => vi.fn());
const findMany = vi.hoisted(() => vi.fn());
const upsert = vi.hoisted(() => vi.fn(async () => ({})));
const reportError = vi.hoisted(() => vi.fn(async () => {}));
const loggerError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { deliveryHeartbeat: { findUnique, findMany, upsert } },
}));
vi.mock("@/lib/observability/report", () => ({ reportError }));
vi.mock("@/lib/observability/logger", () => ({ logger: { error: loggerError } }));

import {
  HEARTBEAT_CHANNELS,
  __resetHeartbeatCoalescing,
  heartbeatChannelSpec,
  readHeartbeat,
  readHeartbeats,
  recordHeartbeatFailure,
  recordHeartbeatSuccess,
} from "@/lib/observability/delivery-heartbeat";

// De posture-items van /admin/systeemstatus. Elk bewaakt kanaal moet er precies één hebben — anders
// registreert het platform een storing die niemand ooit te zien krijgt.
import { mailDeliveryStatusItem } from "@/lib/observability/mail-delivery-freshness";
import { pushDeliveryStatusItem } from "@/lib/observability/push-delivery-freshness";
import { storageDeliveryStatusItem } from "@/lib/observability/storage-delivery-freshness";
import { billingDeliveryStatusItem } from "@/lib/observability/billing-delivery-freshness";
import { verificationDeliveryStatusItem } from "@/lib/observability/verification-delivery-freshness";
import { rateLimitDeliveryStatusItem } from "@/lib/observability/ratelimit-delivery-freshness";
import { passwordBreachDeliveryStatusItem } from "@/lib/observability/password-breach-delivery-freshness";
import { errorMonitoringDeliveryStatusItem } from "@/lib/observability/error-monitoring-delivery-freshness";
import { uploadScanDeliveryStatusItem } from "@/lib/observability/upload-scan-delivery-freshness";
import { routingDeliveryStatusItem } from "@/lib/observability/routing-delivery-freshness";

const T0 = new Date("2026-09-02T12:00:00.000Z");
const at = (msOffset: number) => new Date(T0.getTime() + msOffset);

const MAIL = heartbeatChannelSpec("outbound");
const RATELIMIT = heartbeatChannelSpec("rate-limit-store");
const ROUTING = heartbeatChannelSpec("routing");

beforeEach(() => {
  findUnique.mockReset();
  findMany.mockReset();
  upsert.mockClear();
  reportError.mockClear();
  loggerError.mockClear();
  __resetHeartbeatCoalescing();
  process.env.RATELIMIT_HEARTBEAT_COALESCE_MS = "15000";
});

describe("HEARTBEAT_CHANNELS", () => {
  it("heeft unieke kanaal-ids (één gedeelde tabel = één sleutelruimte)", () => {
    const ids = HEARTBEAT_CHANNELS.map((spec) => spec.channel);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("dekt alle twaalf bewaakte afleverkanalen", () => {
    expect(HEARTBEAT_CHANNELS.map((spec) => spec.channel)).toEqual([
      "outbound",
      "web-push",
      "object-storage",
      "payment-provider",
      "verification-diploma",
      "verification-big",
      "verification-identity",
      "rate-limit-store",
      "password-breach",
      "error-monitoring",
      "upload-scan",
      "routing",
    ]);
  });

  it("geeft elk kanaal een posture-item op /admin/systeemstatus", () => {
    // "never" = het neutrale beginoordeel; we toetsen alleen dat de sleutel bestaat en klopt.
    const never = {
      status: "never" as const,
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      consecutiveFailures: 0,
      failureAgeSeconds: null,
      driver: null,
    };
    const items = [
      mailDeliveryStatusItem(never),
      pushDeliveryStatusItem(never),
      storageDeliveryStatusItem(never),
      billingDeliveryStatusItem(never),
      verificationDeliveryStatusItem({
        status: "never",
        consecutiveFailures: 0,
        failureAgeSeconds: null,
        failingLabels: [],
      }),
      rateLimitDeliveryStatusItem(never),
      passwordBreachDeliveryStatusItem(never),
      errorMonitoringDeliveryStatusItem(never),
      uploadScanDeliveryStatusItem(never),
      routingDeliveryStatusItem(never),
    ];
    const renderedKeys = new Set(items.map((item) => item.key));

    for (const spec of HEARTBEAT_CHANNELS) {
      expect(renderedKeys, `kanaal ${spec.channel} mist een posture-item`).toContain(
        spec.statusItemKey,
      );
    }
  });
});

describe("recordHeartbeatSuccess / recordHeartbeatFailure", () => {
  it("succes zet lastOk=true, de teller op 0 en schrijft de driver", async () => {
    await recordHeartbeatSuccess(MAIL, "smtp", T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channel: "outbound" },
        update: expect.objectContaining({ lastOk: true, consecutiveFailures: 0, driver: "smtp" }),
      }),
    );
  });

  it("mislukking telt de teller atomair op en zet lastOk=false", async () => {
    await recordHeartbeatFailure(MAIL, "smtp", T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ lastOk: false, consecutiveFailures: { increment: 1 } }),
      }),
    );
  });

  it("schrijft driver null voor een kanaal zonder driver-begrip", async () => {
    await recordHeartbeatSuccess(heartbeatChannelSpec("web-push"), null, T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ driver: null }) }),
    );
  });

  it("faalt nooit naar buiten en rapporteert de schrijffout (sink report)", async () => {
    upsert.mockRejectedValueOnce(new Error("db weg"));
    await expect(recordHeartbeatSuccess(MAIL, "smtp", T0)).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ source: "mail-delivery-heartbeat", requestPath: "/mail/outbound" }),
    );
  });

  it("logt in plaats van te rapporteren voor kanalen in het foutrapportage-pad (sink log)", async () => {
    upsert.mockRejectedValueOnce(new Error("db weg"));
    await recordHeartbeatFailure(ROUTING, "geoapify", T0);
    expect(loggerError).toHaveBeenCalledWith(
      "routing-delivery-heartbeat",
      expect.objectContaining({ op: "failure", channel: "routing" }),
    );
    expect(reportError).not.toHaveBeenCalled();
  });
});

describe("coalescing van geslaagde schrijfacties", () => {
  it("coalesceert opeenvolgend succes binnen het venster, en schrijft er weer na", async () => {
    await recordHeartbeatSuccess(RATELIMIT, "upstash", T0);
    await recordHeartbeatSuccess(RATELIMIT, "upstash", at(5_000));
    expect(upsert).toHaveBeenCalledTimes(1);

    await recordHeartbeatSuccess(RATELIMIT, "upstash", at(15_001));
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("schrijft herstel (eerste succes ná een mislukking) altijd direct", async () => {
    await recordHeartbeatSuccess(RATELIMIT, "upstash", T0);
    await recordHeartbeatFailure(RATELIMIT, "upstash", at(1_000));
    await recordHeartbeatSuccess(RATELIMIT, "upstash", at(2_000));
    expect(upsert).toHaveBeenCalledTimes(3);
  });

  it("coalesceert nooit een kanaal zonder coalesce-venster", async () => {
    await recordHeartbeatSuccess(MAIL, "smtp", T0);
    await recordHeartbeatSuccess(MAIL, "smtp", at(1));
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("houdt de coalescing-state per kanaal gescheiden", async () => {
    await recordHeartbeatSuccess(RATELIMIT, "upstash", T0);
    await recordHeartbeatSuccess(ROUTING, "geoapify", T0);
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("coalesceert niet ná een mislukte schrijf (de volgende poging probeert opnieuw)", async () => {
    upsert.mockRejectedValueOnce(new Error("db weg"));
    await recordHeartbeatSuccess(RATELIMIT, "upstash", T0);
    await recordHeartbeatSuccess(RATELIMIT, "upstash", at(1_000));
    expect(upsert).toHaveBeenCalledTimes(2);
  });
});

describe("readHeartbeat / readHeartbeats", () => {
  it("geeft de rij als velden terug", async () => {
    findUnique.mockResolvedValueOnce({
      channel: "outbound",
      lastAttemptAt: T0,
      lastOk: true,
      lastSuccessAt: T0,
      lastFailureAt: null,
      consecutiveFailures: 0,
      driver: "smtp",
      updatedAt: T0,
    });
    await expect(readHeartbeat(MAIL)).resolves.toEqual({
      lastAttemptAt: T0,
      lastOk: true,
      lastSuccessAt: T0,
      lastFailureAt: null,
      consecutiveFailures: 0,
      driver: "smtp",
    });
  });

  it("geeft null bij een ontbrekende rij én bij een leesfout (fail-open)", async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(readHeartbeat(MAIL)).resolves.toBeNull();

    findUnique.mockRejectedValueOnce(new Error("db weg"));
    await expect(readHeartbeat(MAIL)).resolves.toBeNull();
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it("leest meerdere kanalen in één query en geeft een lege map bij een leesfout", async () => {
    findMany.mockResolvedValueOnce([
      {
        channel: "verification-big",
        lastAttemptAt: T0,
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: T0,
        consecutiveFailures: 3,
        driver: "bigregister",
        updatedAt: T0,
      },
    ]);
    const spec = heartbeatChannelSpec("verification-big");
    const map = await readHeartbeats(spec, ["verification-diploma", "verification-big"]);
    expect(map.get("verification-big")?.consecutiveFailures).toBe(3);
    expect(map.get("verification-diploma")).toBeUndefined();

    findMany.mockRejectedValueOnce(new Error("db weg"));
    await expect(readHeartbeats(spec, ["verification-big"])).resolves.toEqual(new Map());
  });
});
