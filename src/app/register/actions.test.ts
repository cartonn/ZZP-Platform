// Rood→groen test voor de timing-egalisatie op de registratie-actie (CWE-208 / OWASP A07).
// Zonder de fix keert `register()` bij een bestaand e-mailadres — en `registerBureau()` bij een
// bestaand e-mailadres of KvK-nummer — meteen terug, terwijl het "nieuw"-pad `bcrypt.hash` draait.
// Die tijdsdelta is per e-mail meetbaar → enumeratie van bestaande accounts/bureaus. De fix draait
// op de vroege return dezelfde compare met een constante equalizer-hash uit
// `src/lib/authorize-credentials.ts`. We toetsen STRUCTUREEL (mocks) i.p.v. wandkloktijd: de
// verwachting is dat `bcrypt.compare` op beide takken (bestaat wél / bestaat niet) is aangeroepen
// met `TIMING_EQUALIZER_HASH`. Wandkloktoetsen zijn hier fragiel en dus bewust vermeden.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

import { AuthError } from "next-auth";

const bcryptCompare = vi.hoisted(() => vi.fn(async () => false));
const bcryptHash = vi.hoisted(() => vi.fn(async () => "$2a$10$fake-hash"));
const userFindUnique = vi.hoisted(() => vi.fn());
const userCreate = vi.hoisted(() => vi.fn());
const tenantFindUnique = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true })));
const breachCheck = vi.hoisted(() => vi.fn(async () => ({ breached: false, skipped: false })));
const createTenantMock = vi.hoisted(() =>
  vi.fn(async () => ({ tenantId: "t1", userId: "u1", slug: "s" })),
);

vi.mock("bcryptjs", () => ({ default: { compare: bcryptCompare, hash: bcryptHash } }));
vi.mock("@/lib/authorize-credentials", () => ({
  // Fixed placeholder — de echte constante is een cost-10-bcrypt-hash en zit al onder eigen tests.
  // Hier draait het om DE structurele check: krijgt bcrypt.compare deze exacte waarde op beide paden?
  TIMING_EQUALIZER_HASH: "$2a$10$FAKE-EQUALIZER-HASH-FOR-TESTS-ONLY-DO-NOT-USE",
}));
vi.mock("@/lib/services/password-breach", () => ({
  getPasswordBreachChecker: () => ({ mode: "off", check: breachCheck }),
  BREACHED_PASSWORD_MESSAGE: "Dit wachtwoord staat in een bekend datalek en is daardoor onveilig.",
}));
vi.mock("@/auth", () => ({ signIn: signInMock }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.2.3.4" })),
}));
vi.mock("@/lib/rate-limit", () => ({ registerRateLimiter: { check: rateCheck } }));
vi.mock("@/lib/franchise/create-tenant", () => ({ createTenantWithOwner: createTenantMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: userFindUnique, create: userCreate },
    tenant: { findUnique: tenantFindUnique },
  },
}));

import { register } from "@/app/register/actions";
import { TIMING_EQUALIZER_HASH } from "@/lib/authorize-credentials";

const PASSWORD = "correct horse battery staple";

function freelancerForm(): FormData {
  const fd = new FormData();
  fd.set("name", "Test Persoon");
  fd.set("email", "test@example.com");
  fd.set("password", PASSWORD);
  fd.set("role", "FREELANCER");
  return fd;
}

function bureauForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("role", "FRANCHISER");
  fd.set("bureauName", "Zorgbemiddeling Noord");
  fd.set("kvkNumber", "12345678");
  fd.set("name", "Anna de Vries");
  fd.set("email", "anna@bureau.nl");
  fd.set("password", PASSWORD);
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue(null);
  tenantFindUnique.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "u1", role: "FREELANCER" });
  createTenantMock.mockResolvedValue({ tenantId: "t1", userId: "u1", slug: "s" });
  rateCheck.mockResolvedValue({ allowed: true });
  breachCheck.mockResolvedValue({ breached: false, skipped: false });
  signInMock.mockRejectedValue(new AuthError("stubbed"));
  bcryptCompare.mockResolvedValue(false);
  bcryptHash.mockResolvedValue("$2a$10$fake-hash");
});

describe("register — timing-egalisatie op de vroege return (CWE-208)", () => {
  it("roept bcrypt.compare met TIMING_EQUALIZER_HASH aan wanneer de e-mail al bestaat", async () => {
    userFindUnique.mockResolvedValue({ id: "bestaand", email: "test@example.com" });

    const res = await register(undefined, freelancerForm());

    // Gedrag ongewijzigd: fieldError blijft staan (UX-affordance; zie comment in actions.ts).
    expect(res?.fieldErrors?.email).toMatch(/bestaat al/);
    // GEEN account aangemaakt op de bestaande-tak.
    expect(userCreate).not.toHaveBeenCalled();
    // Kern van de fix: bcrypt.compare is precies met de equalizer-hash aangeroepen.
    expect(bcryptCompare).toHaveBeenCalledTimes(1);
    expect(bcryptCompare).toHaveBeenCalledWith(PASSWORD, TIMING_EQUALIZER_HASH);
    // Op de vroege return mag GEEN bcrypt.hash draaien.
    expect(bcryptHash).not.toHaveBeenCalled();
  });

  it("draait bcrypt.hash op het 'nieuw account'-pad zodat beide takken gelijkwaardig kosten", async () => {
    userFindUnique.mockResolvedValue(null);

    await register(undefined, freelancerForm());

    // Nieuw-account-pad hasht het wachtwoord.
    expect(bcryptHash).toHaveBeenCalledTimes(1);
    expect(bcryptHash).toHaveBeenCalledWith(PASSWORD, 10);
    // Op dit pad hoeft de compare niet te draaien — de hash levert de bcrypt-kost.
    expect(bcryptCompare).not.toHaveBeenCalled();
    expect(userCreate).toHaveBeenCalledTimes(1);
  });
});

describe("registerBureau — timing-egalisatie op de vroege return (CWE-208)", () => {
  it("roept bcrypt.compare met TIMING_EQUALIZER_HASH aan bij een bestaand e-mailadres", async () => {
    userFindUnique.mockResolvedValue({ id: "bestaand" });
    tenantFindUnique.mockResolvedValue(null);

    const res = await register(undefined, bureauForm());

    // Gedrag ongewijzigd: generieke bevestiging, geen tenant aangemaakt.
    expect(res?.success).toMatch(/2 werkdagen/);
    expect(createTenantMock).not.toHaveBeenCalled();
    // Kern van de fix.
    expect(bcryptCompare).toHaveBeenCalledTimes(1);
    expect(bcryptCompare).toHaveBeenCalledWith(PASSWORD, TIMING_EQUALIZER_HASH);
    expect(bcryptHash).not.toHaveBeenCalled();
  });

  it("roept bcrypt.compare met TIMING_EQUALIZER_HASH aan bij een bestaand KvK-nummer", async () => {
    userFindUnique.mockResolvedValue(null);
    tenantFindUnique.mockResolvedValue({ id: "bestaande-tenant" });

    const res = await register(undefined, bureauForm());

    expect(res?.success).toMatch(/2 werkdagen/);
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(bcryptCompare).toHaveBeenCalledTimes(1);
    expect(bcryptCompare).toHaveBeenCalledWith(PASSWORD, TIMING_EQUALIZER_HASH);
    expect(bcryptHash).not.toHaveBeenCalled();
  });

  it("draait bcrypt.hash op het 'nieuwe tenant'-pad (beide takken gelijkwaardig)", async () => {
    userFindUnique.mockResolvedValue(null);
    tenantFindUnique.mockResolvedValue(null);

    const res = await register(undefined, bureauForm({ region: "Noord-Holland" }));

    expect(res?.success).toMatch(/2 werkdagen/);
    expect(createTenantMock).toHaveBeenCalledTimes(1);
    expect(bcryptHash).toHaveBeenCalledTimes(1);
    expect(bcryptHash).toHaveBeenCalledWith(PASSWORD, 10);
    // Op het aanmaakpad hoeft de compare niet te draaien.
    expect(bcryptCompare).not.toHaveBeenCalled();
  });
});
