// Wiring-test voor de zelfaanmelding van een bemiddelingsbureau: de tenant start op PENDING, de
// rate-limit en de gelekt-wachtwoord-poort gelden net als bij de gewone registratie, en een al
// bestaand e-mailadres of KvK-nummer levert exact dezelfde generieke bevestiging op (geen
// enumeratie). Prisma/auth/audit/rate-limit zijn gemockt; het echte Zod-schema valideert.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

const createTenantMock = vi.hoisted(() => vi.fn());
const userFindUnique = vi.hoisted(() => vi.fn());
const tenantFindUnique = vi.hoisted(() => vi.fn());
const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true })));
const breachCheck = vi.hoisted(() => vi.fn(async () => ({ breached: false, skipped: false })));

vi.mock("@/lib/franchise/create-tenant", () => ({ createTenantWithOwner: createTenantMock }));
vi.mock("@/lib/services/password-breach", () => ({
  getPasswordBreachChecker: () => ({ mode: "off", check: breachCheck }),
  BREACHED_PASSWORD_MESSAGE: "Dit wachtwoord staat in een bekend datalek en is daardoor onveilig.",
}));
vi.mock("@/auth", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "1.2.3.4" })),
}));
vi.mock("@/lib/rate-limit", () => ({ registerRateLimiter: { check: rateCheck } }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: userFindUnique, create: vi.fn() },
    tenant: { findUnique: tenantFindUnique },
  },
}));

import { register } from "@/app/register/actions";

function form(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("role", "FRANCHISER");
  fd.set("bureauName", "Zorgbemiddeling Noord");
  fd.set("kvkNumber", "12345678");
  fd.set("name", "Anna de Vries");
  fd.set("email", "anna@bureau.nl");
  fd.set("password", "correct horse battery staple");
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue(null);
  tenantFindUnique.mockResolvedValue(null);
  rateCheck.mockResolvedValue({ allowed: true });
  breachCheck.mockResolvedValue({ breached: false, skipped: false });
  createTenantMock.mockResolvedValue({ tenantId: "t1", userId: "u1", slug: "s" });
});

describe("zelfaanmelding bemiddelingsbureau", () => {
  it("maakt een tenant met status PENDING en logt niet automatisch in", async () => {
    const res = await register(undefined, form({ region: "Noord-Holland", phone: "0612345678" }));
    expect(createTenantMock).toHaveBeenCalledTimes(1);
    expect(createTenantMock.mock.calls[0]?.[0]).toMatchObject({
      status: "PENDING",
      tenantName: "Zorgbemiddeling Noord",
      kvkNumber: "12345678",
      region: "Noord-Holland",
      contactPhone: "0612345678",
      auditAction: "FRANCHISE_SELF_REGISTERED",
    });
    expect(res?.success).toMatch(/2 werkdagen/);
  });

  it("geeft bij een bestaand e-mailadres dezelfde bevestiging zonder aan te maken", async () => {
    userFindUnique.mockResolvedValue({ id: "bestaand" });
    const res = await register(undefined, form());
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(res?.success).toMatch(/2 werkdagen/);
    expect(res?.fieldErrors).toBeUndefined();
  });

  it("weigert een dubbel KvK-nummer zonder te verklappen dat het bureau al bestaat", async () => {
    tenantFindUnique.mockResolvedValue({ id: "bestaande-tenant" });
    const res = await register(undefined, form());
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(res?.success).toMatch(/2 werkdagen/);
  });

  it("respecteert de registratie-rate-limit", async () => {
    rateCheck.mockResolvedValue({ allowed: false });
    const res = await register(undefined, form());
    expect(res?.error).toMatch(/Te veel registratiepogingen/);
    expect(createTenantMock).not.toHaveBeenCalled();
  });

  it("weigert een ongeldig KvK-nummer met een veldfout", async () => {
    const res = await register(undefined, form({ kvkNumber: "1234" }));
    expect(res?.fieldErrors?.kvkNumber).toMatch(/KvK/);
    expect(createTenantMock).not.toHaveBeenCalled();
  });

  it("vangt een gelijktijdige dubbele aanmelding op (unieke index, P2002)", async () => {
    createTenantMock.mockRejectedValue(Object.assign(new Error("unique"), { code: "P2002" }));
    const res = await register(undefined, form());
    expect(res?.success).toMatch(/2 werkdagen/);
    expect(res?.error).toBeUndefined();
  });

  it("weigert een gelekt wachtwoord vóór de aanmaak", async () => {
    breachCheck.mockResolvedValue({ breached: true, skipped: false });
    const res = await register(undefined, form());
    expect(res?.fieldErrors?.password).toMatch(/datalek/);
    expect(createTenantMock).not.toHaveBeenCalled();
  });
});
