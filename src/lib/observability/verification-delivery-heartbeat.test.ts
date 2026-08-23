import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma + de foutrapportage zodat we de DB-interactie (channel-mapping, aggregatie, fail-open)
// kunnen verifiëren zonder echte databank.
const findMany = vi.hoisted(() => vi.fn());
const upsert = vi.hoisted(() => vi.fn(async () => ({})));
const reportError = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/db", () => ({
  prisma: { verificationDeliveryHeartbeat: { findMany, upsert } },
}));
vi.mock("@/lib/observability/report", () => ({ reportError }));

import {
  VERIFICATION_CHANNELS,
  getVerificationDeliveryOverview,
  recordVerificationDeliveryFailure,
  recordVerificationDeliverySuccess,
} from "@/lib/observability/verification-delivery-heartbeat";

const NOW = new Date("2026-08-23T12:00:00.000Z");

beforeEach(() => {
  findMany.mockReset();
  upsert.mockClear();
  reportError.mockClear();
});

describe("VERIFICATION_CHANNELS", () => {
  it("dekt de drie registers met stabiele kanaal-ids", () => {
    expect(VERIFICATION_CHANNELS.map((c) => c.channel)).toEqual([
      "verification-diploma",
      "verification-big",
      "verification-identity",
    ]);
  });
});

describe("record*", () => {
  it("succes zet lastOk=true en teller op 0", async () => {
    await recordVerificationDeliverySuccess("verification-diploma", "duo", NOW);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channel: "verification-diploma" },
        update: expect.objectContaining({ lastOk: true, consecutiveFailures: 0, driver: "duo" }),
      }),
    );
  });

  it("mislukking telt de teller atomair op", async () => {
    await recordVerificationDeliveryFailure("verification-big", "bigregister", NOW);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          lastOk: false,
          consecutiveFailures: { increment: 1 },
        }),
      }),
    );
  });

  it("is fail-open: een DB-fout wordt gerapporteerd en geslikt (nooit naar buiten)", async () => {
    upsert.mockRejectedValueOnce(new Error("DBDown"));
    await expect(
      recordVerificationDeliverySuccess("verification-identity", "idin", NOW),
    ).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalled();
  });
});

describe("getVerificationDeliveryOverview", () => {
  it("mapt rijen op hun kanaal en aggregeert pessimistisch", async () => {
    findMany.mockResolvedValueOnce([
      {
        channel: "verification-diploma",
        lastAttemptAt: NOW,
        lastOk: true,
        lastSuccessAt: NOW,
        lastFailureAt: null,
        consecutiveFailures: 0,
        driver: "duo",
      },
      {
        channel: "verification-big",
        lastAttemptAt: new Date(NOW.getTime() - 15_000),
        lastOk: false,
        lastSuccessAt: null,
        lastFailureAt: new Date(NOW.getTime() - 15_000),
        consecutiveFailures: 4,
        driver: "bigregister",
      },
    ]);

    const { adapters, aggregate } = await getVerificationDeliveryOverview(NOW);
    expect(adapters).toHaveLength(3);
    expect(adapters.find((a) => a.key === "diploma")?.freshness.status).toBe("ok");
    expect(adapters.find((a) => a.key === "big")?.freshness.status).toBe("failing");
    expect(adapters.find((a) => a.key === "identity")?.freshness.status).toBe("never");
    expect(aggregate.status).toBe("failing");
    expect(aggregate.consecutiveFailures).toBe(4);
  });

  it("is fail-open bij een leesfout: alle registers 'never', aggregate neutraal", async () => {
    findMany.mockRejectedValueOnce(new Error("DBDown"));
    const { adapters, aggregate } = await getVerificationDeliveryOverview(NOW);
    expect(adapters.every((a) => a.freshness.status === "never")).toBe(true);
    expect(aggregate.status).toBe("never");
    expect(reportError).toHaveBeenCalled();
  });
});
