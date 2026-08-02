import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest (persona-sweep, TOCTOU document-substitutie): persistCredential leest de status
// (loadOwnedCredential) en doet dán een trage putBlob (AV-scan + storage-put) vóór de write. Een
// gelijktijdige admin-beslissing (verifyCredential → VERIFIED) in dat venster mag het bewijsstuk NIET
// stil vervangen op de nu-beoordeelde rij, en het beoordeelde document mag NIET verwijderd worden.
// De write is nu een compound-guarded `updateMany({ where: { id, status } })` + count-gate; matcht die
// 0 rijen (status inmiddels veranderd), dan breekt de transactie af — geen doc-swap, geen
// verificationRequest, en deleteDocumentById draait niet (oud document blijft staan).

const { updateManyMock, docCreateMock, reqCreateMock, docDeleteMock, docFindMock } = vi.hoisted(
  () => ({
    updateManyMock: vi.fn(async () => ({ count: 1 })),
    docCreateMock: vi.fn(async () => ({ id: "doc-new" })),
    reqCreateMock: vi.fn(async () => ({})),
    docDeleteMock: vi.fn(async () => ({})),
    docFindMock: vi.fn(async () => ({ storageKey: "old-key" })),
  }),
);

const txClient = {
  document: { create: docCreateMock },
  credential: { updateMany: updateManyMock },
  verificationRequest: { create: reqCreateMock },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: vi.fn(async () => ({ id: "prof-1" })) },
    credential: {
      findUnique: vi.fn(async () => ({
        id: "cred-1",
        freelancerProfileId: "prof-1",
        status: "SUBMITTED",
        documentId: "doc-old",
        type: "LICENSE",
        title: "Rijbewijs",
        issuer: null,
        issuedAt: null,
        expiresAt: null,
        visibility: "PRIVATE",
      })),
    },
    document: { findUnique: docFindMock, delete: docDeleteMock },
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

vi.mock("@/lib/services/storage", async (orig) => {
  const actual = await orig<typeof import("@/lib/services/storage")>();
  return {
    ...actual,
    validateUpload: vi.fn(() => {}),
    assertContentMatchesMime: vi.fn(() => {}),
    generateStorageKey: vi.fn(() => "new-key"),
    getStorage: vi.fn(() => ({ put: vi.fn(async () => {}), delete: vi.fn(async () => {}) })),
  };
});

vi.mock("@/lib/services/upload-scanner", () => ({ assertUploadClean: vi.fn(async () => {}) }));
vi.mock("@/lib/audit", async (orig) => {
  const actual = await orig<typeof import("@/lib/audit")>();
  return { ...actual, audit: vi.fn(async () => {}), auditData: (d: unknown) => d };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { saveCredentialInline } from "./actions";

function form(): FormData {
  const fd = new FormData();
  fd.set("credentialId", "cred-1");
  fd.set("type", "LICENSE");
  fd.set("title", "Rijbewijs");
  fd.set("visibility", "PRIVATE");
  fd.set("issuedAt", "");
  fd.set("expiresAt", "");
  fd.set("document", new File(["nieuwe-scan"], "cert.pdf", { type: "application/pdf" }));
  return fd;
}

describe("persistCredential (hasFile) — TOCTOU document-substitutie-guard", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    docCreateMock.mockClear();
    reqCreateMock.mockClear();
    docDeleteMock.mockClear();
    docFindMock.mockClear();
  });

  it("verliest de race (status inmiddels beoordeeld → count:0): geen doc-swap, oud document blijft, nette fout", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 0 }); // admin heeft 'm net → VERIFIED gezet
    const res = await saveCredentialInline(undefined, form());

    expect(res).toEqual({ error: expect.stringMatching(/inmiddels beoordeeld/i) });
    // De guard matchte de compound where op (id + gesnapshotte status).
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cred-1", status: "SUBMITTED" } }),
    );
    // Cruciaal: geen verificationRequest én het beoordeelde document mag NIET verwijderd zijn.
    expect(reqCreateMock).not.toHaveBeenCalled();
    expect(docDeleteMock).not.toHaveBeenCalled();
  });

  it("wint de race (count:1): doc-swap + oud document opgeruimd", async () => {
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    const res = await saveCredentialInline(undefined, form());

    expect(res).toEqual({ ok: true });
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cred-1", status: "SUBMITTED" },
        data: expect.objectContaining({ documentId: "doc-new" }),
      }),
    );
    // Bij een gewonnen race wordt het vorige document (doc-old) opgeruimd.
    expect(docDeleteMock).toHaveBeenCalledWith({ where: { id: "doc-old" } });
  });
});
