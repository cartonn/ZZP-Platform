import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock prisma + de foutrapportage zodat we de DB-interactie (upsert-vorm, fail-open) kunnen verifiëren
// zonder echte databank.
const findUnique = vi.hoisted(() => vi.fn());
const upsert = vi.hoisted(() => vi.fn(async () => ({})));
const reportError = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/db", () => ({
  prisma: { passwordBreachDeliveryHeartbeat: { findUnique, upsert } },
}));
vi.mock("@/lib/observability/report", () => ({ reportError }));

import {
  PASSWORD_BREACH_CHANNEL,
  getPasswordBreachDeliveryFreshness,
  recordPasswordBreachDeliveryFailure,
  recordPasswordBreachDeliverySuccess,
} from "@/lib/observability/password-breach-delivery-heartbeat";

const T0 = new Date("2026-08-25T12:00:00.000Z");

beforeEach(() => {
  findUnique.mockReset();
  upsert.mockClear();
  reportError.mockClear();
});

describe("record success/failure — upsert-vorm", () => {
  it("succes zet lastOk=true, teller op 0, op het singleton-kanaal", async () => {
    await recordPasswordBreachDeliverySuccess("hibp", T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { channel: PASSWORD_BREACH_CHANNEL },
        update: expect.objectContaining({
          lastOk: true,
          consecutiveFailures: 0,
          driver: "hibp",
        }),
      }),
    );
  });

  it("mislukking telt de teller atomair op en zet lastOk=false", async () => {
    await recordPasswordBreachDeliveryFailure("hibp", T0);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          lastOk: false,
          consecutiveFailures: { increment: 1 },
        }),
      }),
    );
  });

  it("een DB-fout wordt geslikt (fail-open) en gerapporteerd", async () => {
    upsert.mockRejectedValueOnce(new Error("db down"));
    await expect(recordPasswordBreachDeliverySuccess("hibp", T0)).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalled();
  });
});

describe("getPasswordBreachDeliveryFreshness", () => {
  it("leest de rij en beoordeelt (failing)", async () => {
    findUnique.mockResolvedValueOnce({
      channel: PASSWORD_BREACH_CHANNEL,
      lastAttemptAt: T0,
      lastOk: false,
      lastSuccessAt: null,
      lastFailureAt: T0,
      consecutiveFailures: 5,
      driver: "hibp",
    });
    const f = await getPasswordBreachDeliveryFreshness(T0);
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(5);
  });

  it("geen rij → never", async () => {
    findUnique.mockResolvedValueOnce(null);
    const f = await getPasswordBreachDeliveryFreshness(T0);
    expect(f.status).toBe("never");
  });

  it("een leesfout valt terug op never (geen 500)", async () => {
    findUnique.mockRejectedValueOnce(new Error("db down"));
    const f = await getPasswordBreachDeliveryFreshness(T0);
    expect(f.status).toBe("never");
    expect(reportError).toHaveBeenCalled();
  });
});
