// Contract van deleteDocument bij een geweigerde poging (CLAUDE.md regel 5 — audit alles wat telt):
// auth → rol FREELANCER → ownership. Een IDOR-poging op andermans document (bestaand id, andere
// eigenaar) mag NIET stil verdwijnen: de weigering wordt geaudit (DOCUMENT_DELETE_DENIED) én er
// wordt niets verwijderd (geen prisma.delete, geen storage.delete). "Niet gevonden" en "niet van
// jou" zijn naar buiten identiek (geen bestaans-orakel). Rood→groen: zonder de audit-op-weigering
// wordt `audit` niet met DOCUMENT_DELETE_DENIED aangeroepen.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string, id: "owner-me" }));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: roleState.id, role: roleState.role, status: "ACTIVE" };
  }),
}));

const audit = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/audit", () => ({ audit }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  del: vi.fn(async () => ({})),
}));
vi.mock("@/lib/db", () => ({
  prisma: { document: { findUnique: db.findUnique, delete: db.del } },
}));

const storage = vi.hoisted(() => ({ del: vi.fn(async () => {}) }));
vi.mock("@/lib/services/storage", () => ({
  getStorage: () => ({ delete: storage.del }),
  // Ongebruikt in dit pad, maar het module-oppervlak moet bestaan voor de import.
  assertContentMatchesMime: vi.fn(),
  generateStorageKey: vi.fn(),
  UploadValidationError: class extends Error {},
  validateUpload: vi.fn(),
}));
vi.mock("@/lib/services/upload-scanner", () => ({ assertUploadClean: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  uploadRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));
vi.mock("@/lib/validation", () => ({ documentSchema: { safeParse: vi.fn() } }));
vi.mock("@/lib/observability/storage-failure", () => ({ logStorageCleanupFailure: vi.fn() }));

import { deleteDocument } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  roleState.role = "FREELANCER";
  roleState.id = "owner-me";
});

describe("deleteDocument — geweigerde poging", () => {
  it("audit DOCUMENT_DELETE_DENIED en verwijdert niets bij een document van een andere eigenaar", async () => {
    db.findUnique.mockResolvedValueOnce({
      ownerId: "someone-else",
      storageKey: "k/other",
      _count: { credentials: 0 },
    });

    await expect(deleteDocument("doc-123")).rejects.toThrow("Document niet gevonden.");

    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "owner-me",
        action: "DOCUMENT_DELETE_DENIED",
        entityType: "Document",
        entityId: "doc-123",
      }),
    );
    expect(db.del).not.toHaveBeenCalled();
    expect(storage.del).not.toHaveBeenCalled();
  });

  it("audit DOCUMENT_DELETE_DENIED ook bij een onbekend id (geen bestaans-orakel)", async () => {
    db.findUnique.mockResolvedValueOnce(null);

    await expect(deleteDocument("doc-onbekend")).rejects.toThrow("Document niet gevonden.");

    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_DELETE_DENIED", entityId: "doc-onbekend" }),
    );
    expect(db.del).not.toHaveBeenCalled();
  });
});
