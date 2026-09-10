import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma + de foutrapportage zodat we de DB-interactie (upsert-vorm, fail-open) en de write-coalescing
// kunnen verifiëren zonder echte databank.
const findUnique = vi.hoisted(() => vi.fn());
const upsert = vi.hoisted(() => vi.fn(async () => ({})));
const reportError = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/db", () => ({
  prisma: { deliveryHeartbeat: { findUnique, upsert } },
}));
vi.mock("@/lib/observability/report", () => ({ reportError }));

import {
  RATE_LIMIT_STORE_CHANNEL,
  __resetRateLimitDeliveryHeartbeatState,
  getRateLimitDeliveryFreshness,
  recordRateLimitDeliveryFailure,
  recordRateLimitDeliverySuccess,
} from "@/lib/observability/ratelimit-delivery-heartbeat";

const T0 = new Date("2026-08-23T12:00:00.000Z");
const at = (msOffset: number) => new Date(T0.getTime() + msOffset);

beforeEach(() => {
  findUnique.mockReset();
  upsert.mockClear();
  reportError.mockClear();
  __resetRateLimitDeliveryHeartbeatState();
  // Deterministisch venster van 15s in de tests.
  process.env.RATELIMIT_HEARTBEAT_COALESCE_MS = "15000";
});

afterEach(() => {
  delete process.env.RATELIMIT_HEARTBEAT_COALESCE_MS;
});

describe("record success/failure — upsert-vorm", () => {
  it("succes zet lastOk=true, teller op 0, op het singleton-kanaal", async () => {
    await recordRateLimitDeliverySuccess("upstash", T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channel: RATE_LIMIT_STORE_CHANNEL },
        update: expect.objectContaining({
          lastOk: true,
          consecutiveFailures: 0,
          driver: "upstash",
        }),
      }),
    );
  });

  it("mislukking telt de teller atomair op en zet lastOk=false", async () => {
    await recordRateLimitDeliveryFailure("upstash", T0);
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
    await expect(recordRateLimitDeliverySuccess("upstash", T0)).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalled();
  });
});

describe("write-coalescing (auth-hot-path)", () => {
  it("coalesceert opeenvolgende successen binnen het venster (max één schrijf)", async () => {
    await recordRateLimitDeliverySuccess("upstash", at(0)); // eerste → schrijft
    await recordRateLimitDeliverySuccess("upstash", at(5_000)); // binnen 15s → geslikt
    await recordRateLimitDeliverySuccess("upstash", at(14_000)); // binnen 15s → geslikt
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("schrijft opnieuw zodra het venster verstreken is", async () => {
    await recordRateLimitDeliverySuccess("upstash", at(0));
    await recordRateLimitDeliverySuccess("upstash", at(16_000)); // > 15s → schrijft weer
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("mislukkingen worden ALTIJD geschreven (nooit gecoalesceerd)", async () => {
    await recordRateLimitDeliveryFailure("upstash", at(0));
    await recordRateLimitDeliveryFailure("upstash", at(1_000));
    await recordRateLimitDeliveryFailure("upstash", at(2_000));
    expect(upsert).toHaveBeenCalledTimes(3);
  });

  it("een herstel (eerste succes ná een mislukking) schrijft altijd, ook binnen het venster", async () => {
    await recordRateLimitDeliveryFailure("upstash", at(0)); // schrijft (1)
    await recordRateLimitDeliverySuccess("upstash", at(1_000)); // herstel → schrijft (2), niet gecoalesceerd
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("coalesceert niet stil weg als de eerdere schrijf faalde (volgende succes probeert opnieuw)", async () => {
    upsert.mockRejectedValueOnce(new Error("DBDown")); // eerste succes-schrijf faalt
    await recordRateLimitDeliverySuccess("upstash", at(0));
    await recordRateLimitDeliverySuccess("upstash", at(1_000)); // binnen venster, maar vorige faalde → schrijft
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("COALESCE_MS=0 schakelt coalescing uit (elke success schrijft)", async () => {
    process.env.RATELIMIT_HEARTBEAT_COALESCE_MS = "0";
    await recordRateLimitDeliverySuccess("upstash", at(0));
    await recordRateLimitDeliverySuccess("upstash", at(1_000));
    expect(upsert).toHaveBeenCalledTimes(2);
  });
});

describe("getRateLimitDeliveryFreshness", () => {
  it("mapt de rij op een oordeel", async () => {
    findUnique.mockResolvedValueOnce({
      channel: RATE_LIMIT_STORE_CHANNEL,
      lastAttemptAt: at(-15_000),
      lastOk: false,
      lastSuccessAt: null,
      lastFailureAt: at(-15_000),
      consecutiveFailures: 4,
      driver: "upstash",
    });
    const f = await getRateLimitDeliveryFreshness(T0);
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(4);
    expect(f.driver).toBe("upstash");
  });

  it("geen rij → never (neutraal gezond)", async () => {
    findUnique.mockResolvedValueOnce(null);
    expect((await getRateLimitDeliveryFreshness(T0)).status).toBe("never");
  });

  it("is fail-open bij een leesfout: never + gerapporteerd", async () => {
    findUnique.mockRejectedValueOnce(new Error("DBDown"));
    expect((await getRateLimitDeliveryFreshness(T0)).status).toBe("never");
    expect(reportError).toHaveBeenCalled();
  });
});
