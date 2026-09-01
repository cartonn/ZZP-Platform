// Unit-tests voor de 2FA-enrollment/disable server actions (mutatieketen: auth → Zod → actie → audit).
// prisma/authz/audit/requestMeta/next-cache en de 2FA-crypto-helpers zijn gemockt zodat de tests het
// GEDRAG van de acties toetsen (statusovergangen, hashing van herstelcodes, wachtwoordbevestiging),
// niet de apart geteste crypto-kern.

import { describe, it, expect, vi, beforeEach } from "vitest";

interface FakeUser {
  email: string;
  passwordHash: string;
  twoFactorSecret: string | null;
  twoFactorEnabledAt: Date | null;
  twoFactorLastUsedStep?: number | null;
}

const store = {
  actor: { id: "user-1", role: "FREELANCER", status: "ACTIVE" },
  user: null as FakeUser | null,
};

const userFindUnique = vi.hoisted(() => vi.fn());
const userUpdate = vi.hoisted(() =>
  vi.fn(async (_args: { data: Record<string, unknown> }) => ({})),
);
const rcDeleteMany = vi.hoisted(() => vi.fn(async () => ({ count: 0 })));
const rcCreateMany = vi.hoisted(() =>
  vi.fn(async (_args: { data: { userId: string; codeHash: string }[] }) => ({ count: 10 })),
);
const transaction = vi.hoisted(() => vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)));
const auditMock = vi.hoisted(() => vi.fn(async () => undefined));
const revalidateMock = vi.hoisted(() => vi.fn());
const bcryptCompare = vi.hoisted(() => vi.fn(async () => true));
// De gedeelde tweede-factor-poort wordt apart getest (verify-second-factor.test.ts); hier mocken we
// 'm zodat de disable-action-tests het GEDRAG toetsen: wordt de factor geëist en geraadpleegd, en
// gate't een mislukte factor de uitschakeling vóór enige schrijfactie.
const verifySecondFactorMock = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => store.actor),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: userFindUnique, update: userUpdate },
    twoFactorRecoveryCode: { deleteMany: rcDeleteMany, createMany: rcCreateMany },
    $transaction: transaction,
  },
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.2.3.4", userAgent: "test" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));
vi.mock("bcryptjs", () => ({ default: { compare: bcryptCompare } }));

// 2FA-crypto-helpers deterministisch mocken.
vi.mock("@/lib/two-factor/totp", () => ({
  generateTotpSecret: vi.fn(() => "FRESHSECRET32"),
  otpauthUri: vi.fn(
    (p: { secret: string; accountName: string; issuer: string }) =>
      `otpauth://totp/${p.issuer}:${p.accountName}?secret=${p.secret}`,
  ),
  // verifyTotpStep geeft de gematchte step (number) terug, of null bij geen match.
  verifyTotpStep: vi.fn((): number | null => null),
}));
vi.mock("@/lib/two-factor/secret-crypto", () => ({
  encryptTwoFactorSecret: vi.fn((s: string) => `enc:${s}`),
  decryptTwoFactorSecret: vi.fn((s: string) => s.replace(/^enc:/, "")),
}));
vi.mock("@/lib/two-factor/recovery-codes", () => ({
  generateRecoveryCodes: vi.fn(() => Array.from({ length: 10 }, (_, i) => `CODE-${i}`)),
  hashRecoveryCode: vi.fn(async (code: string) => `hash:${code}`),
}));
vi.mock("@/lib/two-factor/verify-second-factor", () => ({
  verifySecondFactor: verifySecondFactorMock,
}));

import {
  getTwoFactorSetup,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
} from "@/app/(protected)/account/tweestapsverificatie/actions";
import { verifyTotpStep } from "@/lib/two-factor/totp";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  store.actor = { id: "user-1", role: "FREELANCER", status: "ACTIVE" };
  store.user = {
    email: "jan@bedrijf.nl",
    passwordHash: "pw-hash",
    twoFactorSecret: null,
    twoFactorEnabledAt: null,
  };
  userFindUnique.mockImplementation(async () => store.user);
  transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  bcryptCompare.mockImplementation(async () => true);
  (verifyTotpStep as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
});

describe("getTwoFactorSetup", () => {
  it("geeft status 'off' als er geen geheim en geen enabledAt is", async () => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: null,
      twoFactorEnabledAt: null,
    };
    expect(await getTwoFactorSetup()).toEqual({ status: "off" });
  });

  it("geeft status 'pending' met otpauthUri + geheim bij een geheim zonder enabledAt", async () => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: "enc:PENDINGSECRET",
      twoFactorEnabledAt: null,
    };
    const res = await getTwoFactorSetup();
    expect(res.status).toBe("pending");
    expect(res.secret).toBe("PENDINGSECRET");
    expect(res.otpauthUri).toContain("secret=PENDINGSECRET");
    expect(res.otpauthUri).toContain("Handslag:jan@bedrijf.nl");
  });

  it("geeft status 'on' als enabledAt gezet is", async () => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: "enc:X",
      twoFactorEnabledAt: new Date(),
    };
    expect(await getTwoFactorSetup()).toEqual({ status: "on" });
  });
});

describe("beginTwoFactorSetup", () => {
  it("slaat een vers, versleuteld geheim op met enabledAt=null (pending)", async () => {
    const res = await beginTwoFactorSetup(undefined, form({}));
    expect(res).toEqual({});
    const data = userUpdate.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.twoFactorSecret).toBe("enc:FRESHSECRET32");
    expect(data.twoFactorEnabledAt).toBeNull();
    expect(revalidateMock).toHaveBeenCalledWith("/account/tweestapsverificatie");
  });

  it("weigert wanneer 2FA al aan staat", async () => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: "enc:X",
      twoFactorEnabledAt: new Date(),
    };
    const res = await beginTwoFactorSetup(undefined, form({}));
    expect(res.error).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("confirmTwoFactorSetup", () => {
  beforeEach(() => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: "enc:PENDINGSECRET",
      twoFactorEnabledAt: null,
    };
  });

  it("weigert bij een foute code en audit een mislukte challenge", async () => {
    (verifyTotpStep as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const res = await confirmTwoFactorSetup(undefined, form({ token: "000000" }));
    expect(res.error).toBe("De code klopt niet of is verlopen.");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_CHALLENGE_FAILED" }),
    );
    expect(rcCreateMany).not.toHaveBeenCalled();
  });

  it("activeert 2FA bij een geldige code en slaat GEHASHTE herstelcodes op", async () => {
    (verifyTotpStep as unknown as ReturnType<typeof vi.fn>).mockReturnValue(42);
    const res = await confirmTwoFactorSetup(undefined, form({ token: "123456" }));

    // Platte codes exact één keer terug voor weergave.
    expect(res.recoveryCodes).toHaveLength(10);
    expect(res.recoveryCodes?.[0]).toBe("CODE-0");

    // Oude codes eerst weg, dan verse hashes opslaan (nooit de platte code).
    expect(rcDeleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    const created = rcCreateMany.mock.calls[0]?.[0]?.data as { codeHash: string }[];
    expect(created).toHaveLength(10);
    expect(created[0]?.codeHash).toBe("hash:CODE-0");
    expect(created.some((c) => c.codeHash === "CODE-0")).toBe(false);

    // enabledAt gezet + de verbruikte step vastgelegd (replay-preventie voor de eerste login) + audit.
    const data = userUpdate.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.twoFactorEnabledAt).toBeInstanceOf(Date);
    expect(data.twoFactorLastUsedStep).toBe(42);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_ENABLED" }),
    );
  });

  it("weigert wanneer er geen instelling in behandeling is (al aan)", async () => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: "enc:X",
      twoFactorEnabledAt: new Date(),
    };
    const res = await confirmTwoFactorSetup(undefined, form({ token: "123456" }));
    expect(res.error).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("disableTwoFactor", () => {
  beforeEach(() => {
    store.user = {
      email: "jan@bedrijf.nl",
      passwordHash: "pw-hash",
      twoFactorSecret: "enc:X",
      twoFactorEnabledAt: new Date(),
      twoFactorLastUsedStep: null,
    };
    verifySecondFactorMock.mockReset();
    verifySecondFactorMock.mockResolvedValue(true);
  });

  it("weigert bij een fout wachtwoord — zonder de factor te raadplegen", async () => {
    bcryptCompare.mockImplementation(async () => false);
    const res = await disableTwoFactor(undefined, form({ password: "fout", token: "123456" }));
    expect(res.error).toBeTruthy();
    expect(verifySecondFactorMock).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(rcDeleteMany).not.toHaveBeenCalled();
  });

  it("weigert wanneer de tweede factor mislukt — geen schrijfactie, geen DISABLED-audit", async () => {
    bcryptCompare.mockImplementation(async () => true);
    verifySecondFactorMock.mockResolvedValue(false);
    const res = await disableTwoFactor(undefined, form({ password: "geheim123", token: "000000" }));
    expect(res.error).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(rcDeleteMany).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_DISABLED" }),
    );
  });

  it("schakelt 2FA uit bij juist wachtwoord + geldige factor en verwijdert alle herstelcodes", async () => {
    bcryptCompare.mockImplementation(async () => true);
    const res = await disableTwoFactor(undefined, form({ password: "geheim123", token: "123456" }));
    expect(res).toEqual({ done: true });

    // De factor is met exact de ingevoerde code geraadpleegd (disable-context).
    expect(verifySecondFactorMock).toHaveBeenCalledWith(
      expect.objectContaining({ twoFactorSecret: "enc:X", twoFactorLastUsedStep: null }),
      "123456",
      expect.anything(),
      expect.objectContaining({ context: "disable" }),
    );

    const data = userUpdate.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.twoFactorSecret).toBeNull();
    expect(data.twoFactorEnabledAt).toBeNull();
    expect(data.twoFactorLastUsedStep).toBeNull();
    expect(rcDeleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_DISABLED" }),
    );
  });
});
