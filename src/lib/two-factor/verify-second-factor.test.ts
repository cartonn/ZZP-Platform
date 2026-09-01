// Unit-tests voor de gedeelde tweede-factor-poort. prisma/audit en de crypto-kern (totp/secret-crypto/
// recovery-codes) zijn gemockt zodat de tests het GEDRAG toetsen: TOTP-pad met replay-preventie
// (atomaire updateMany), herstelcode-pad (eenmalig verbruik), en de audit-reden bij elke uitkomst.

import { describe, it, expect, vi, beforeEach } from "vitest";

const userUpdateMany = vi.hoisted(() => vi.fn(async () => ({ count: 1 })));
const rcFindMany = vi.hoisted(() => vi.fn(async () => [] as { id: string; codeHash: string }[]));
const rcUpdate = vi.hoisted(() => vi.fn(async () => ({})));
// Typeer de audit-parameter zodat `.mock.calls[..][0]` een echt object is (geen lege tuple) — anders
// faalt tsc op `.at(-1)?.[0]` (TS2493) bij het uitlezen van de metadata in de asserts.
const auditMock = vi.hoisted(() =>
  vi.fn(async (_entry: { metadata?: Record<string, string> }) => undefined),
);
const verifyTotpStepMock = vi.hoisted(() => vi.fn((): number | null => null));
const decryptSecretMock = vi.hoisted(() => vi.fn((s: string) => s.replace(/^enc:/, "")));
const verifyRecoveryMock = vi.hoisted(() => vi.fn(async () => false));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { updateMany: userUpdateMany },
    twoFactorRecoveryCode: { findMany: rcFindMany, update: rcUpdate },
  },
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/two-factor/totp", () => ({ verifyTotpStep: verifyTotpStepMock }));
vi.mock("@/lib/two-factor/secret-crypto", () => ({ decryptTwoFactorSecret: decryptSecretMock }));
vi.mock("@/lib/two-factor/recovery-codes", () => ({ verifyRecoveryCode: verifyRecoveryMock }));

import { verifySecondFactor } from "@/lib/two-factor/verify-second-factor";

const META = { ipAddress: "1.2.3.4", userAgent: "test" };
const USER = {
  id: "user-1",
  twoFactorSecret: "enc:S",
  twoFactorLastUsedStep: null as number | null,
};

function lastAuditReason(): string | undefined {
  return auditMock.mock.calls.at(-1)?.[0]?.metadata?.reason;
}

describe("verifySecondFactor", () => {
  beforeEach(() => {
    userUpdateMany.mockReset();
    userUpdateMany.mockResolvedValue({ count: 1 });
    rcFindMany.mockReset();
    rcFindMany.mockResolvedValue([]);
    rcUpdate.mockReset();
    auditMock.mockClear();
    verifyTotpStepMock.mockReset();
    verifyTotpStepMock.mockReturnValue(null);
    verifyRecoveryMock.mockReset();
    verifyRecoveryMock.mockResolvedValue(false);
  });

  it("weigert (en audit 'missing') bij een lege code", async () => {
    expect(await verifySecondFactor(USER, "  ", META)).toBe(false);
    expect(lastAuditReason()).toBe("missing");
    expect(verifyTotpStepMock).not.toHaveBeenCalled();
  });

  it("accepteert een geldige TOTP met een strikt nieuwere step (updateMany count 1)", async () => {
    verifyTotpStepMock.mockReturnValue(100);
    userUpdateMany.mockResolvedValue({ count: 1 });
    expect(await verifySecondFactor(USER, "123456", META)).toBe(true);
    expect(userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { twoFactorLastUsedStep: 100 } }),
    );
  });

  it("weigert een replay (updateMany count 0) met audit-reden 'replay'", async () => {
    verifyTotpStepMock.mockReturnValue(100);
    userUpdateMany.mockResolvedValue({ count: 0 });
    expect(await verifySecondFactor(USER, "123456", META)).toBe(false);
    expect(lastAuditReason()).toBe("replay");
  });

  it("weigert een foute TOTP (step null) met audit-reden 'totp'", async () => {
    verifyTotpStepMock.mockReturnValue(null);
    expect(await verifySecondFactor(USER, "654321", META)).toBe(false);
    expect(lastAuditReason()).toBe("totp");
    expect(userUpdateMany).not.toHaveBeenCalled();
  });

  it("behandelt een decrypt-fout als mislukte factor, niet als crash", async () => {
    verifyTotpStepMock.mockReturnValue(100);
    decryptSecretMock.mockImplementationOnce(() => {
      throw new Error("bad key");
    });
    expect(await verifySecondFactor(USER, "123456", META)).toBe(false);
    expect(lastAuditReason()).toBe("totp");
  });

  it("accepteert een ongebruikte herstelcode en markeert 'm eenmalig verbruikt", async () => {
    rcFindMany.mockResolvedValue([{ id: "rc-1", codeHash: "hash" }]);
    verifyRecoveryMock.mockResolvedValue(true);
    expect(await verifySecondFactor(USER, "ABCD-EFGH", META)).toBe(true);
    expect(rcUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "rc-1" } }));
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_RECOVERY_CODE_USED" }),
    );
  });

  it("weigert een onbekende herstelcode met audit-reden 'recovery'", async () => {
    rcFindMany.mockResolvedValue([{ id: "rc-1", codeHash: "hash" }]);
    verifyRecoveryMock.mockResolvedValue(false);
    expect(await verifySecondFactor(USER, "ZZZZ-ZZZZ", META)).toBe(false);
    expect(lastAuditReason()).toBe("recovery");
    expect(rcUpdate).not.toHaveBeenCalled();
  });

  it("verrijkt de audit-metadata met de meegegeven context", async () => {
    await verifySecondFactor(USER, "", META, { context: "disable" });
    const entry = auditMock.mock.calls.at(-1)?.[0];
    expect(entry?.metadata).toMatchObject({ context: "disable", reason: "missing" });
  });
});
