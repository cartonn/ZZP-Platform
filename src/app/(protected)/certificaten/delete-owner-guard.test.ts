import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest (defense-in-depth IDOR — OWASP A01, CLAUDE.md regel 2): `deleteDocumentById` (de
// interne opruimer die het vorige bewijsstuk wist bij een credential-resubmit) verwijdert nooit een
// document dat niet van de actor is. De huidige aanroepers geven altijd een documentId door dat uit
// een eigen credential (`loadOwnedCredential`) komt — dit is dus geen open gat — maar een toekomstige
// call-site met een form-/client-gestuurde id zou zonder deze guard andermans document kunnen wissen.
// Rood→groen: zonder de `doc.ownerId !== actorId`-check zou het vreemde document alsnog verwijderd
// worden. We drijven het pad via de publieke `saveCredentialInline` (gewonnen race → doc-swap +
// opruim van het vorige document).

const { updateManyMock, docCreateMock, reqCreateMock, docDeleteMock, docFindMock, auditMock } =
  vi.hoisted(() => ({
    updateManyMock: vi.fn(async () => ({ count: 1 })),
    docCreateMock: vi.fn(async () => ({ id: "doc-new" })),
    reqCreateMock: vi.fn(async () => ({})),
    docDeleteMock: vi.fn(async () => ({})),
    docFindMock: vi.fn(async () => ({ storageKey: "old-key", ownerId: "user-1" })),
    auditMock: vi.fn(async () => {}),
  }));

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
  return { ...actual, audit: auditMock, auditData: (d: unknown) => d };
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

describe("deleteDocumentById — defense-in-depth ownership-guard", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    updateManyMock.mockResolvedValue({ count: 1 });
    docCreateMock.mockClear();
    reqCreateMock.mockClear();
    docDeleteMock.mockClear();
    docFindMock.mockReset();
    auditMock.mockClear();
  });

  it("verwijdert het vorige document wanneer het van de actor is", async () => {
    docFindMock.mockResolvedValue({ storageKey: "old-key", ownerId: "user-1" });
    const res = await saveCredentialInline(undefined, form());

    expect(res).toEqual({ ok: true });
    expect(docDeleteMock).toHaveBeenCalledWith({ where: { id: "doc-old" } });
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_DELETED", entityId: "doc-old" }),
    );
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_DELETE_DENIED" }),
    );
  });

  it("verwijdert NIET wanneer het document van een andere gebruiker is, en audit de geweigerde poging", async () => {
    // Simuleert een toekomstige call-site die een vreemd (niet-eigen) documentId doorgeeft.
    docFindMock.mockResolvedValue({ storageKey: "old-key", ownerId: "iemand-anders" });
    const res = await saveCredentialInline(undefined, form());

    expect(res).toEqual({ ok: true });
    // Cruciaal: het vreemde document blijft staan.
    expect(docDeleteMock).not.toHaveBeenCalled();
    // De geweigerde poging is auditeerbaar vastgelegd (fail-closed + spoor).
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        action: "DOCUMENT_DELETE_DENIED",
        entityType: "Document",
        entityId: "doc-old",
      }),
    );
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_DELETED", entityId: "doc-old" }),
    );
  });
});
