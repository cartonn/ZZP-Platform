import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest: zelf-verificatie (DUO/BIG) mag — net als het admin-beslispad
// (`admin/verificaties/actions.ts` WHERE-guard + `credential-review.ts`) — een al verlopen bewijsstuk
// NIET op VERIFIED zetten. `expiresAt` is vrije invoer op het certificaatformulier en staat los van de
// externe DUO/BIG-respons; een geldig BIG-nummer/DUO-code met een verstreken `expiresAt` zou anders een
// VERIFIED-maar-verlopen certificaat minten (direct ongeldig, door de eerstvolgende expiry-run naar
// EXPIRED geklapt). De snapshot-guard in de callers geeft de nette fout; de transactionele write draagt
// bovendien de expiry-OR-clausule voor de TOCTOU-race. Vóór de fix ontbrak beide op dit pad.

const {
  transactionMock,
  updateManyMock,
  verificationCreateMock,
  auditCreateMock,
  reqUpdateManyMock,
  credentialFindUnique,
} = vi.hoisted(() => {
  const updateManyMock = vi.fn(async () => ({ count: 1 }));
  const verificationCreateMock = vi.fn(async () => ({}));
  const auditCreateMock = vi.fn(async () => ({}));
  const reqUpdateManyMock = vi.fn(async () => ({}));
  const txClient = {
    credential: { updateMany: updateManyMock },
    credentialVerification: { create: verificationCreateMock },
    verificationRequest: { updateMany: reqUpdateManyMock },
    auditLog: { create: auditCreateMock },
  };
  return {
    transactionMock: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
    updateManyMock,
    verificationCreateMock,
    auditCreateMock,
    reqUpdateManyMock,
    credentialFindUnique: vi.fn(),
  };
});

// Mutabele credential-rij: elke test zet type + expiresAt vóór de actie-aanroep.
let credentialRow: {
  id: string;
  freelancerProfileId: string;
  status: string;
  type: string;
  expiresAt: Date | null;
};

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: vi.fn(async () => ({ id: "prof-1" })) },
    credential: { findUnique: credentialFindUnique },
    user: { findUnique: vi.fn(async () => ({ name: "Sanne de Vries" })) },
    $transaction: transactionMock,
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

import { verifyCredentialViaBig, verifyCredentialViaDuo } from "./actions";

const VALID_BIG = "12345678901";
const VALID_DUO = "DUO-AB12-CD34";

function bigForm(bigNumber: string): FormData {
  const fd = new FormData();
  fd.set("bigNumber", bigNumber);
  return fd;
}
function duoForm(code: string): FormData {
  const fd = new FormData();
  fd.set("verificationCode", code);
  return fd;
}

const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);
const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

describe("zelf-verificatie weigert een al verlopen bewijsstuk", () => {
  beforeEach(() => {
    transactionMock.mockClear();
    updateManyMock.mockReset();
    updateManyMock.mockResolvedValue({ count: 1 });
    verificationCreateMock.mockClear();
    auditCreateMock.mockClear();
    reqUpdateManyMock.mockClear();
    credentialFindUnique.mockImplementation(async () => credentialRow);
    vi.stubEnv("NODE_ENV", "test");
  });

  it("BIG: verlopen licentie → nette fout, geen VERIFIED-write/record/audit", async () => {
    credentialRow = {
      id: "cred-1",
      freelancerProfileId: "prof-1",
      status: "SUBMITTED",
      type: "LICENSE",
      expiresAt: PAST,
    };
    const res = await verifyCredentialViaBig("cred-1", undefined, bigForm(VALID_BIG));

    expect(res).toEqual({ error: expect.stringMatching(/verlopen/i) });
    expect(transactionMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(verificationCreateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it("DUO: verlopen diploma → nette fout, geen VERIFIED-write/record/audit", async () => {
    credentialRow = {
      id: "cred-1",
      freelancerProfileId: "prof-1",
      status: "SUBMITTED",
      type: "DIPLOMA",
      expiresAt: PAST,
    };
    const res = await verifyCredentialViaDuo("cred-1", undefined, duoForm(VALID_DUO));

    expect(res).toEqual({ error: expect.stringMatching(/verlopen/i) });
    expect(transactionMock).not.toHaveBeenCalled();
    expect(verificationCreateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it("positieve controle BIG: geldige, nog niet verlopen licentie slaagt wél", async () => {
    credentialRow = {
      id: "cred-1",
      freelancerProfileId: "prof-1",
      status: "SUBMITTED",
      type: "LICENSE",
      expiresAt: FUTURE,
    };
    const res = await verifyCredentialViaBig("cred-1", undefined, bigForm(VALID_BIG));

    expect(res).toEqual({ ok: true });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    // De write draagt de expiry-OR-clausule naast de id+status-guard (TOCTOU-afsluiting).
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "cred-1",
          status: "SUBMITTED",
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        }),
        data: expect.objectContaining({ status: "VERIFIED" }),
      }),
    );
    expect(verificationCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it("positieve controle: een bewijsstuk zonder vervaldatum blijft toegestaan", async () => {
    credentialRow = {
      id: "cred-1",
      freelancerProfileId: "prof-1",
      status: "SUBMITTED",
      type: "LICENSE",
      expiresAt: null,
    };
    const res = await verifyCredentialViaBig("cred-1", undefined, bigForm(VALID_BIG));

    expect(res).toEqual({ ok: true });
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
