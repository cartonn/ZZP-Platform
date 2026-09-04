// Anti-timing-enumeratie voor de bureau-zelfaanmelding (CWE-208 / OWASP A07). Het ontwerp belooft
// "geen enumeratie": een al bestaand e-mailadres of KvK-nummer levert exact dezelfde bevestiging op
// als een nieuwe aanmelding. Maar als de dure bcrypt-hash alléén op het nieuw-pad draait, verraadt
// de responstijd of het account/bureau al bestaat. Deze test borgt het invariant server-side:
//  - bcrypt.hash wordt ONVOORWAARDELIJK aangeroepen, óók wanneer het account/bureau al bestaat;
//  - en die hash gebeurt VÓÓR de existentie-lookups, zodat beide paden dezelfde vaste kosten dragen.
// Vóór de fix (hash pas na de existentie-check, alleen op het nieuw-pad) is de eerste assertie rood.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

// Gedeeld volgorde-logboek zodat we kunnen bewijzen dat de hash vóór de DB-lookups draait.
const order: string[] = [];

const createTenantMock = vi.hoisted(() => vi.fn());
const userFindUnique = vi.hoisted(() => vi.fn());
const tenantFindUnique = vi.hoisted(() => vi.fn());
const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true })));
const breachCheck = vi.hoisted(() => vi.fn(async () => ({ breached: false, skipped: false })));
const bcryptHash = vi.hoisted(() => vi.fn(async () => "hashed"));

vi.mock("bcryptjs", () => ({ default: { hash: bcryptHash } }));
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
    user: {
      findUnique: vi.fn(async (...a: unknown[]) => {
        order.push("user.findUnique");
        return userFindUnique(...a);
      }),
      create: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(async (...a: unknown[]) => {
        order.push("tenant.findUnique");
        return tenantFindUnique(...a);
      }),
    },
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
  order.length = 0;
  userFindUnique.mockResolvedValue(null);
  tenantFindUnique.mockResolvedValue(null);
  rateCheck.mockResolvedValue({ allowed: true });
  breachCheck.mockResolvedValue({ breached: false, skipped: false });
  bcryptHash.mockResolvedValue("hashed");
  createTenantMock.mockResolvedValue({ tenantId: "t1", userId: "u1", slug: "s" });
});

describe("bureau-aanmelding — geen timing-enumeratie", () => {
  it("hasht het wachtwoord óók wanneer het e-mailadres al bestaat (gelijke vaste kosten)", async () => {
    userFindUnique.mockResolvedValue({ id: "bestaand" });
    const res = await register(undefined, form());
    // Zelfde generieke bevestiging, geen aanmaak — én tóch de dure hash betaald.
    expect(res?.success).toMatch(/2 werkdagen/);
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(bcryptHash).toHaveBeenCalledTimes(1);
  });

  it("hasht het wachtwoord óók wanneer het KvK-nummer al bestaat", async () => {
    tenantFindUnique.mockResolvedValue({ id: "bestaande-tenant" });
    const res = await register(undefined, form());
    expect(res?.success).toMatch(/2 werkdagen/);
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(bcryptHash).toHaveBeenCalledTimes(1);
  });

  it("draait de hash vóór de existentie-lookups", async () => {
    await register(undefined, form());
    const firstLookup = order.findIndex((s) => s.endsWith("findUnique"));
    expect(bcryptHash).toHaveBeenCalledTimes(1);
    // De hash is klaar (awaited) voordat de eerste DB-lookup wordt aangeroepen.
    expect(bcryptHash.mock.invocationCallOrder[0]).toBeLessThan(
      Math.min(
        ...[userFindUnique, tenantFindUnique]
          .flatMap((m) => m.mock.invocationCallOrder)
          .filter((n) => Number.isFinite(n)),
      ),
    );
    expect(firstLookup).toBeGreaterThanOrEqual(0);
  });
});
