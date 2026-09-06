import { beforeEach, describe, expect, it, vi } from "vitest";

// Anti-brute-force-rem op de identiteitsverificatie. De zelf-verificatie (`verifyIdentity`) zet bij
// succes `identityVerifiedAt` + de geverifieerde juridische naam zonder admin-tussenkomst — precies
// zoals de DUO/BIG-credential-zelfverificatie, die de rem al had. Deze test bewijst dat een
// overschreden rem de actie afkapt vóór de user-lookup én de (in productie uitgaande) iDIN-round-trip,
// en dat een toegestane poging gewoon doorloopt.

const { rlCheck, verifyFn, tx } = vi.hoisted(() => ({
  rlCheck: vi.fn(async () => ({ allowed: true, remaining: 9, retryAfterMs: 0 })),
  verifyFn: vi.fn(async () => ({
    verified: true,
    verifiedName: "Sanne de Vries",
    source: "MOCK" as const,
    message: "ok",
  })),
  tx: vi.fn(async () => []),
}));

vi.mock("@/lib/rate-limit", () => ({
  identityVerifyRateLimiter: { check: rlCheck },
}));

vi.mock("@/lib/authz", async (orig) => {
  const actual = await orig<typeof import("@/lib/authz")>();
  return {
    ...actual,
    requireActor: vi.fn(async () => ({ id: "user-1", role: "FREELANCER", status: "ACTIVE" })),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => ({ name: "Sanne de Vries", identityVerifiedAt: null })),
      update: vi.fn(() => ({})),
    },
    auditLog: { create: vi.fn(() => ({})) },
    $transaction: tx,
  },
}));

vi.mock("@/lib/services/identity-verifier", () => ({
  getIdentityVerifier: () => ({ verify: verifyFn }),
}));

vi.mock("@/lib/request-meta", () => ({ requestMeta: vi.fn(async () => ({})) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { verifyIdentity } from "./actions";

function form(legalName: string): FormData {
  const fd = new FormData();
  fd.set("legalName", legalName);
  return fd;
}

describe("verifyIdentity — anti-brute-force rate limit", () => {
  beforeEach(() => {
    rlCheck.mockClear();
    verifyFn.mockClear();
    tx.mockClear();
    rlCheck.mockResolvedValue({ allowed: true, remaining: 9, retryAfterMs: 0 });
  });

  it("kapt af bij een overschreden rem — vóór de verifier-call, geen VERIFIED-schrijf", async () => {
    rlCheck.mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterMs: 60_000 });

    const res = await verifyIdentity(undefined, form("Sanne de Vries"));

    expect(res).toEqual({ error: expect.stringMatching(/te veel verificatiepogingen/i) });
    // De rem staat vóór de provider-round-trip en de schrijf: geen van beide mag gebeuren.
    expect(verifyFn).not.toHaveBeenCalled();
    expect(tx).not.toHaveBeenCalled();
  });

  it("keyt de rem op de actor-id", async () => {
    await verifyIdentity(undefined, form("Sanne de Vries"));
    expect(rlCheck).toHaveBeenCalledWith("verify:user-1");
  });

  it("laat een toegestane poging gewoon doorlopen naar de verifier + VERIFIED-schrijf", async () => {
    const res = await verifyIdentity(undefined, form("Sanne de Vries"));

    expect(res).toEqual({ ok: true });
    expect(verifyFn).toHaveBeenCalledTimes(1);
    expect(tx).toHaveBeenCalledTimes(1);
  });
});
