import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest (security/privacy-audit 2026-09-03): dient een ZZP'er na een eerdere beoordeling een
// NIEUW bewijsstuk in (herindienen: VERIFIED/REJECTED → SUBMITTED), dan moet de "gezien/verwijderd"-
// registratie van de vórige cyclus (`evidenceSeenAt`/`evidenceSeenById`/`evidenceRemovedAt`) worden
// gewist. Anders houdt een VOG een stale, niet-lege `evidenceRemovedAt`, waardoor de opruimtaak
// (die uitsluitend rijen met `evidenceRemovedAt: null` oppakt) een later mislukte opslag-verwijdering
// nooit hervat en het nieuwe strafrechtelijk gegeven bij een storing permanent in de opslag
// achterblijft (AVG art. 5(1)(e)/art. 10). Tevens: de weergave "gezien op … · bestand verwijderd"
// mag niet blijven staan voor een nog-ongezien nieuw bewijsstuk (AVG art. 5(1)(d), juistheid).

const { updateManyMock, docCreateMock, reqCreateMock, docDeleteMock, docFindMock } = vi.hoisted(
  () => ({
    updateManyMock: vi.fn(async () => ({ count: 1 })),
    docCreateMock: vi.fn(async () => ({ id: "doc-new" })),
    reqCreateMock: vi.fn(async () => ({})),
    docDeleteMock: vi.fn(async () => ({})),
    docFindMock: vi.fn(async () => ({ storageKey: "old-key", ownerId: "user-1" })),
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
        // Al beoordeeld in een vorige cyclus → herindienen zet 'm terug naar SUBMITTED.
        status: "VERIFIED",
        documentId: "doc-old",
        type: "VOG",
        title: "VOG zorg",
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
  fd.set("type", "VOG");
  fd.set("title", "VOG zorg");
  fd.set("visibility", "PRIVATE");
  fd.set("issuedAt", "");
  fd.set("expiresAt", "");
  fd.set("document", new File(["nieuwe-scan"], "vog.pdf", { type: "application/pdf" }));
  return fd;
}

describe("persistCredential — herindienen wist de bewijsstuk-registratie van de vorige cyclus", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    updateManyMock.mockResolvedValue({ count: 1 });
    docCreateMock.mockClear();
    reqCreateMock.mockClear();
    docDeleteMock.mockClear();
    docFindMock.mockClear();
  });

  it("zet evidenceSeenAt/evidenceSeenById/evidenceRemovedAt terug op null bij VERIFIED → SUBMITTED", async () => {
    const res = await saveCredentialInline(undefined, form());

    expect(res).toEqual({ ok: true });
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cred-1", status: "VERIFIED" },
        data: expect.objectContaining({
          status: "SUBMITTED",
          documentId: "doc-new",
          evidenceSeenAt: null,
          evidenceSeenById: null,
          evidenceRemovedAt: null,
        }),
      }),
    );
  });
});
