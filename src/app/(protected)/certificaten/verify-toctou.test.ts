import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest (persona-sweep run 54, TOCTOU): zelf-verificatie via DUO/BIG leest de status
// (loadOwnedCredential) en doet dán een externe netwerkcall vóór de VERIFIED-write. Een gelijktijdige
// admin-beslissing (→ REJECTED) tussen snapshot en write mag NIET stil worden overschreven. De write
// is nu een compound-guarded `updateMany({ where: { id, status: fromStatus } })`; matcht die 0 rijen
// (de status is inmiddels veranderd), dan breekt de transactie af — géén VERIFIED, géén
// verificatie-record, géén audit. Vóór de fix schreef een losse `update({ where: { id } })` blind door.

const { updateManyMock, verificationCreateMock, auditCreateMock, reqUpdateManyMock } = vi.hoisted(
  () => ({
    updateManyMock: vi.fn(async () => ({ count: 1 })),
    verificationCreateMock: vi.fn(async () => ({})),
    auditCreateMock: vi.fn(async () => ({})),
    reqUpdateManyMock: vi.fn(async () => ({})),
  }),
);

// Interactieve $transaction: roept de callback aan met een tx-client die de guarded updateMany en de
// vervolgschrijfacties blootstelt — zo kunnen we de race (count:0) vs succes (count:1) sturen.
const txClient = {
  credential: { updateMany: updateManyMock },
  credentialVerification: { create: verificationCreateMock },
  verificationRequest: { updateMany: reqUpdateManyMock },
  auditLog: { create: auditCreateMock },
};

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
    },
    user: { findUnique: vi.fn(async () => ({ name: "Sanne de Vries" })) },
    $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
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
  return { ...actual, audit: vi.fn(async () => {}), auditData: (d: unknown) => d };
});

vi.mock("@/lib/request-meta", () => ({ requestMeta: vi.fn(async () => ({})) }));
vi.mock("@/lib/rate-limit", () => ({
  credentialVerifyRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/db";
import { verifyCredentialViaBig } from "./actions";

const credFindUnique = prisma.credential.findUnique as unknown as ReturnType<typeof vi.fn>;

function form(bigNumber: string): FormData {
  const fd = new FormData();
  fd.set("bigNumber", bigNumber);
  return fd;
}
const VALID_BIG = "12345678901";

describe("verifyCredentialViaBig — TOCTOU status-guard", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    verificationCreateMock.mockClear();
    auditCreateMock.mockClear();
    reqUpdateManyMock.mockClear();
    vi.stubEnv("NODE_ENV", "test");
  });

  it("verliest de race (status inmiddels veranderd → count:0): geen VERIFIED-write, nette fout", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 0 }); // admin heeft 'm net → REJECTED gezet
    const res = await verifyCredentialViaBig("cred-1", undefined, form(VALID_BIG));

    expect(res).toEqual({ error: expect.stringMatching(/inmiddels beoordeeld/i) });
    // De guard matchte de compound where op (id + fromStatus).
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cred-1", status: "SUBMITTED" } }),
    );
    // Cruciaal: géén verificatie-record en géén audit bij een verloren race.
    expect(verificationCreateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it("wint de race (count:1): VERIFIED + verificatie-record + audit", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    const res = await verifyCredentialViaBig("cred-1", undefined, form(VALID_BIG));

    expect(res).toEqual({ ok: true });
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cred-1", status: "SUBMITTED" },
        data: expect.objectContaining({ status: "VERIFIED" }),
      }),
    );
    expect(verificationCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it("weigert een reeds-verlopen bewijsstuk (geen VERIFIED-write, nette fout)", async () => {
    // Zelf-verificatie kent geen admin-badge; de server-side poort is hier de enige rem.
    credFindUnique.mockResolvedValueOnce({
      id: "cred-1",
      freelancerProfileId: "prof-1",
      status: "SUBMITTED",
      type: "LICENSE",
      expiresAt: new Date("2020-01-01T00:00:00Z"), // ruim verlopen
    });
    const res = await verifyCredentialViaBig("cred-1", undefined, form(VALID_BIG));

    expect(res).toEqual({ error: expect.stringMatching(/verlopen/i) });
    // De poort valt vóór de transactie: geen write, geen verificatie-record, geen audit.
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(verificationCreateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });
});
