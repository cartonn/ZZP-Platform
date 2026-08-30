import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Integratietest voor de onderhouds-afsluitingspoort in de credentials-`authorize`
// (security/privacy-audit 2026-07-11, HOOG). Bij een volledige afsluiting
// (MAINTENANCE_MODE=true + MAINTENANCE_ALLOW_ADMIN=false — bedoeld voor een database-herstel/migratie)
// mag een login de database NIET raken. De middleware kan dit niet afdwingen omdat de matcher
// `/api/auth/**` uitsluit, dus de poort zit in `authorizeCredentials` vóór élke Prisma-call. We mocken
// de randservices en bewijzen rood→groen dat `prisma.user.findUnique` uitblijft tijdens de afsluiting
// en wél gebeurt bij een normale login.

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  passwordHash: string;
  mustChangePassword: boolean;
  passwordChangedAt: Date;
}

const { findUnique, rateCheck, rateReset, auditFn } = vi.hoisted(() => ({
  findUnique: vi.fn(
    async (): Promise<FakeUser | null> => ({
      id: "user-1",
      email: "jan@bedrijf.nl",
      name: "Jan Jansen",
      role: "FREELANCER",
      status: "ACTIVE",
      passwordHash: "hash",
      mustChangePassword: false,
      passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
    }),
  ),
  rateCheck: vi.fn(async () => ({ allowed: true })),
  rateReset: vi.fn(async () => {}),
  auditFn: vi.fn(async () => {}),
}));

const { rcFindMany, rcUpdate } = vi.hoisted(() => ({
  rcFindMany: vi.fn(async (): Promise<{ id: string; codeHash: string }[]> => []),
  rcUpdate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique },
    twoFactorRecoveryCode: { findMany: rcFindMany, update: rcUpdate },
  },
}));

// Tweede-factor-helpers deterministisch mocken zodat de tests de login-poort toetsen (niet de
// crypto-kern, die apart is getest) en niet botsen met de gemockte bcryptjs in dit bestand.
const verifyTotpMock = vi.hoisted(() => vi.fn(() => false));
vi.mock("@/lib/two-factor/totp", () => ({ verifyTotp: verifyTotpMock }));

const decryptSecretMock = vi.hoisted(() => vi.fn((stored: string) => stored));
vi.mock("@/lib/two-factor/secret-crypto", () => ({
  decryptTwoFactorSecret: decryptSecretMock,
}));

const verifyRecoveryMock = vi.hoisted(() => vi.fn(async () => false));
vi.mock("@/lib/two-factor/recovery-codes", () => ({
  verifyRecoveryCode: verifyRecoveryMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  loginRateLimiter: { check: rateCheck, reset: rateReset },
}));

vi.mock("@/lib/audit", async (orig) => {
  const actual = await orig<typeof import("@/lib/audit")>();
  return { ...actual, audit: auditFn };
});

vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.2.3.4", userAgent: "test" })),
}));

const bcryptCompare = vi.hoisted(() => vi.fn(async () => true));
vi.mock("bcryptjs", () => ({ default: { compare: bcryptCompare } }));

import { authorizeCredentials } from "@/lib/authorize-credentials";

const CREDS = { email: "jan@bedrijf.nl", password: "geheim123" };

describe("authorizeCredentials — onderhouds-afsluitingspoort", () => {
  const savedMode = process.env.MAINTENANCE_MODE;
  const savedAllow = process.env.MAINTENANCE_ALLOW_ADMIN;

  beforeEach(() => {
    findUnique.mockClear();
    rateCheck.mockClear();
    rateReset.mockClear();
    auditFn.mockClear();
    bcryptCompare.mockClear();
    bcryptCompare.mockImplementation(async () => true);
    findUnique.mockImplementation(async () => ({
      id: "user-1",
      email: "jan@bedrijf.nl",
      name: "Jan Jansen",
      role: "FREELANCER",
      status: "ACTIVE",
      passwordHash: "hash",
      mustChangePassword: false,
      passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
    }));
    delete process.env.MAINTENANCE_MODE;
    delete process.env.MAINTENANCE_ALLOW_ADMIN;
  });

  afterEach(() => {
    if (savedMode === undefined) delete process.env.MAINTENANCE_MODE;
    else process.env.MAINTENANCE_MODE = savedMode;
    if (savedAllow === undefined) delete process.env.MAINTENANCE_ALLOW_ADMIN;
    else process.env.MAINTENANCE_ALLOW_ADMIN = savedAllow;
  });

  it("weigert stil en raakt de database NIET bij een volledige afsluiting", async () => {
    process.env.MAINTENANCE_MODE = "true";
    process.env.MAINTENANCE_ALLOW_ADMIN = "false";

    const result = await authorizeCredentials(CREDS);

    expect(result).toBeNull();
    // Rood→groen: zonder de poort zou de login de DB/rate-limiter/audit raken.
    expect(findUnique).not.toHaveBeenCalled();
    expect(rateCheck).not.toHaveBeenCalled();
    expect(auditFn).not.toHaveBeenCalled();
  });

  it("laat login door in de standaard-onderhoudsmodus (admin-bypass staat aan)", async () => {
    process.env.MAINTENANCE_MODE = "true";
    // MAINTENANCE_ALLOW_ADMIN ongezet → default true → géén volledige afsluiting.

    const result = await authorizeCredentials(CREDS);

    expect(result).not.toBeNull();
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it("laat een normale login door wanneer onderhoud uit staat", async () => {
    const result = await authorizeCredentials(CREDS);

    expect(result).toMatchObject({ id: "user-1", role: "FREELANCER", status: "ACTIVE" });
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(rateReset).toHaveBeenCalledTimes(1);
  });
});

// Timing-side-channel (CWE-208 / OWASP A07): een mislukte login moet altijd precies één bcrypt.compare
// draaien, ook als het account niet bestaat / niet ACTIVE is / een lege hash heeft. Zonder de
// equalizer-hash short-circuit `bcrypt.compare` weg bij een onbekende e-mail → dat account logt
// meetbaar sneller in en verraadt via de responstijd of de e-mail bestaat (enumeratie).
describe("authorizeCredentials — timing-egalisatie tegen e-mail-enumeratie", () => {
  beforeEach(() => {
    findUnique.mockClear();
    rateCheck.mockClear();
    rateReset.mockClear();
    auditFn.mockClear();
    bcryptCompare.mockClear();
    bcryptCompare.mockImplementation(async () => true);
    delete process.env.MAINTENANCE_MODE;
    delete process.env.MAINTENANCE_ALLOW_ADMIN;
  });

  it("draait bcrypt.compare óók wanneer de e-mail niet bestaat (geen short-circuit)", async () => {
    findUnique.mockImplementationOnce(async () => null);

    const result = await authorizeCredentials(CREDS);

    expect(result).toBeNull();
    // Rood→groen: zonder de equalizer-hash zou compare hier NIET draaien (short-circuit op !user).
    expect(bcryptCompare).toHaveBeenCalledTimes(1);
  });

  it("draait bcrypt.compare óók bij een niet-ACTIVE account (geen short-circuit)", async () => {
    findUnique.mockImplementationOnce(async () => ({
      id: "user-2",
      email: "jan@bedrijf.nl",
      name: "Jan",
      role: "FREELANCER",
      status: "SUSPENDED",
      passwordHash: "hash",
      mustChangePassword: false,
      passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
    }));

    const result = await authorizeCredentials(CREDS);

    expect(result).toBeNull();
    expect(bcryptCompare).toHaveBeenCalledTimes(1);
  });

  it("draait bcrypt.compare óók bij een lege passwordHash (geanonimiseerd account)", async () => {
    findUnique.mockImplementationOnce(async () => ({
      id: "user-3",
      email: "jan@bedrijf.nl",
      name: null,
      role: "FREELANCER",
      status: "ACTIVE",
      passwordHash: "",
      mustChangePassword: false,
      passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
    }));

    const result = await authorizeCredentials(CREDS);

    expect(result).toBeNull();
    // Lege hash zou een snelle/afwijkende compare geven; de equalizer-hash houdt de timing gelijk.
    expect(bcryptCompare).toHaveBeenCalledTimes(1);
  });

  it("weigert een onbekende e-mail zelfs als compare per ongeluk true zou geven", async () => {
    findUnique.mockImplementationOnce(async () => null);
    bcryptCompare.mockImplementation(async () => true); // adversarieel: dummy-hash 'matcht'

    const result = await authorizeCredentials(CREDS);

    // Ook al geeft compare true, zonder gebruiker mag er nooit een sessie ontstaan.
    expect(result).toBeNull();
  });
});

// Tweestapsverificatie is een EXTRA poort NA de geslaagde wachtwoordcheck: alleen accounts met
// `twoFactorEnabledAt` gezet moeten een geldige tweede factor (TOTP of ongebruikte herstelcode)
// aanleveren. Accounts zonder 2FA lopen het bestaande pad — geen gedragswijziging.
interface TwoFactorUser extends FakeUser {
  twoFactorEnabledAt: Date | null;
  twoFactorSecret: string | null;
}

const twoFactorUser = (): TwoFactorUser => ({
  id: "user-1",
  email: "jan@bedrijf.nl",
  name: "Jan Jansen",
  role: "FREELANCER",
  status: "ACTIVE",
  passwordHash: "hash",
  mustChangePassword: false,
  passwordChangedAt: new Date("2026-01-01T00:00:00Z"),
  twoFactorEnabledAt: new Date("2026-02-01T00:00:00Z"),
  twoFactorSecret: "enc-secret",
});

describe("authorizeCredentials — tweestapsverificatie-poort", () => {
  beforeEach(() => {
    findUnique.mockClear();
    rateCheck.mockClear();
    rateReset.mockClear();
    auditFn.mockClear();
    bcryptCompare.mockClear();
    bcryptCompare.mockImplementation(async () => true); // wachtwoord klopt
    rcFindMany.mockClear();
    rcFindMany.mockImplementation(async () => []);
    rcUpdate.mockClear();
    verifyTotpMock.mockClear();
    verifyTotpMock.mockReturnValue(false);
    decryptSecretMock.mockClear();
    decryptSecretMock.mockImplementation((stored: string) => stored);
    verifyRecoveryMock.mockClear();
    verifyRecoveryMock.mockImplementation(async () => false);
    delete process.env.MAINTENANCE_MODE;
    delete process.env.MAINTENANCE_ALLOW_ADMIN;
  });

  it("weigert een 2FA-account zonder tweede factor (token ontbreekt)", async () => {
    findUnique.mockImplementationOnce(async () => twoFactorUser());

    const result = await authorizeCredentials(CREDS);

    expect(result).toBeNull();
    expect(rateReset).not.toHaveBeenCalled();
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_CHALLENGE_FAILED" }),
    );
  });

  it("laat een 2FA-account door met een geldige TOTP-code", async () => {
    findUnique.mockImplementationOnce(async () => twoFactorUser());
    verifyTotpMock.mockReturnValue(true);

    const result = await authorizeCredentials({ ...CREDS, token: "123456" });

    expect(result).toMatchObject({ id: "user-1" });
    expect(verifyTotpMock).toHaveBeenCalledWith("enc-secret", "123456");
    expect(rateReset).toHaveBeenCalledTimes(1);
  });

  it("weigert een 2FA-account met een foute TOTP-code", async () => {
    findUnique.mockImplementationOnce(async () => twoFactorUser());
    verifyTotpMock.mockReturnValue(false);

    const result = await authorizeCredentials({ ...CREDS, token: "000000" });

    expect(result).toBeNull();
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_CHALLENGE_FAILED" }),
    );
  });

  it("laat een 2FA-account door met een geldige herstelcode en markeert die als gebruikt", async () => {
    findUnique.mockImplementationOnce(async () => twoFactorUser());
    rcFindMany.mockImplementationOnce(async () => [{ id: "rc-1", codeHash: "hash-1" }]);
    verifyRecoveryMock.mockImplementation(async () => true);

    const result = await authorizeCredentials({ ...CREDS, token: "7F3K-9QRW-2XMH-5DPT" });

    expect(result).toMatchObject({ id: "user-1" });
    // De TOTP-verificatie mag niet lopen voor een niet-6-cijferige invoer.
    expect(verifyTotpMock).not.toHaveBeenCalled();
    expect(rcUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "rc-1" } }));
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_RECOVERY_CODE_USED" }),
    );
  });

  it("weigert een reeds gebruikte herstelcode (geen ongebruikte rijen matchen)", async () => {
    findUnique.mockImplementationOnce(async () => twoFactorUser());
    // usedAt: null-filter laat geen enkele rij over → geen match.
    rcFindMany.mockImplementationOnce(async () => []);

    const result = await authorizeCredentials({ ...CREDS, token: "7F3K-9QRW-2XMH-5DPT" });

    expect(result).toBeNull();
    expect(rcUpdate).not.toHaveBeenCalled();
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "TWO_FACTOR_CHALLENGE_FAILED" }),
    );
  });

  it("laat een account zonder 2FA ongewijzigd (geen tweede-factor-check)", async () => {
    findUnique.mockImplementationOnce(async () => ({
      ...twoFactorUser(),
      twoFactorEnabledAt: null,
      twoFactorSecret: null,
    }));

    const result = await authorizeCredentials(CREDS);

    expect(result).toMatchObject({ id: "user-1", role: "FREELANCER" });
    expect(verifyTotpMock).not.toHaveBeenCalled();
    expect(rcFindMany).not.toHaveBeenCalled();
    expect(rateReset).toHaveBeenCalledTimes(1);
  });
});
