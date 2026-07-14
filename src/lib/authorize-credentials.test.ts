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
    }),
  ),
  rateCheck: vi.fn(async () => ({ allowed: true })),
  rateReset: vi.fn(async () => {}),
  auditFn: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique } },
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
