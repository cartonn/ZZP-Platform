import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Integratietest voor de fail-closed poort (security-review 2026-07-07, KRITIEK): de zelf-verificatie
// via het BIG-register mag op echte productie-data GEEN VERIFIED stempelen wanneer de ingebouwde
// demo-verifier (source "MOCK") draait. We mocken de randservices en bewijzen dat de VERIFIED-schrijf
// (`prisma.$transaction`) uitblijft in productie en wél gebeurt zodra de mock is toegestaan.

const { tx, auditFn } = vi.hoisted(() => ({
  tx: vi.fn(async () => []),
  auditFn: vi.fn(async () => {}),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: vi.fn(async () => ({ id: "prof-1" })) },
    credential: {
      findUnique: vi.fn(async () => ({
        id: "cred-1",
        freelancerProfileId: "prof-1",
        status: "SUBMITTED",
        type: "LICENSE",
      })),
      update: vi.fn(() => ({})),
    },
    credentialVerification: { create: vi.fn(() => ({})) },
    verificationRequest: { updateMany: vi.fn(() => ({})) },
    auditLog: { create: vi.fn(() => ({})) },
    user: { findUnique: vi.fn(async () => ({ name: "Sanne de Vries" })) },
    $transaction: tx,
  },
}));

vi.mock("@/lib/authz", async (orig) => {
  const actual = await orig<typeof import("@/lib/authz")>();
  return {
    ...actual,
    requireRole: vi.fn(async () => ({ id: "user-1", role: "FREELANCER", status: "ACTIVE" })),
  };
});

vi.mock("@/lib/audit", async (orig) => {
  const actual = await orig<typeof import("@/lib/audit")>();
  return { ...actual, audit: auditFn };
});

vi.mock("@/lib/request-meta", () => ({ requestMeta: vi.fn(async () => ({})) }));

vi.mock("@/lib/rate-limit", () => ({
  credentialVerifyRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { verifyCredentialViaBig } from "./actions";

function form(bigNumber: string): FormData {
  const fd = new FormData();
  fd.set("bigNumber", bigNumber);
  return fd;
}

// Een format-geldig BIG-nummer laat de MockBigVerifier `verified:true, source:"MOCK"` teruggeven.
const VALID_BIG = "12345678901";

describe("verifyCredentialViaBig — fail-closed tegen mock-verificatie op productie", () => {
  beforeEach(() => {
    tx.mockClear();
    auditFn.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("BLOKKEERT in productie (geen demo, geen opt-in): geen VERIFIED-schrijf", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SEED_DEMO", "");
    vi.stubEnv("ALLOW_MOCK_VERIFICATION", "");

    const res = await verifyCredentialViaBig("cred-1", undefined, form(VALID_BIG));

    expect(res).toEqual({
      error: expect.stringMatching(/handmatige controle/i),
    });
    // De kern: de credential wordt NIET geverifieerd.
    expect(tx).not.toHaveBeenCalled();
    // De geweigerde poging wordt wél geaudit (zichtbaar dat de demo-verifier op productie draait).
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CREDENTIAL_VERIFY_BLOCKED" }),
    );
  });

  it("staat het toe met expliciete demo-dataset (SEED_DEMO=true): VERIFIED-schrijf gebeurt", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SEED_DEMO", "true");

    const res = await verifyCredentialViaBig("cred-1", undefined, form(VALID_BIG));

    expect(res).toEqual({ ok: true });
    expect(tx).toHaveBeenCalledTimes(1);
  });

  it("staat het toe buiten productie (dev/test): VERIFIED-schrijf gebeurt", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const res = await verifyCredentialViaBig("cred-1", undefined, form(VALID_BIG));

    expect(res).toEqual({ ok: true });
    expect(tx).toHaveBeenCalledTimes(1);
  });
});
