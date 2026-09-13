import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  auth: vi.fn(),
  load: vi.fn(),
  update: vi.fn(),
  history: vi.fn(),
  requests: vi.fn(),
  notify: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
  cleanup: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({ requireRole: m.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { credential: { findUnique: m.load }, $transaction: m.transaction },
}));
vi.mock("@/lib/credential-evidence", () => ({ removeCredentialEvidence: m.cleanup }));
vi.mock("@/lib/signals/invalidate", () => ({ invalidateSignals: m.invalidate }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { verifyCredentialState, rejectCredentialState } from "./actions";
const updatedAt = new Date("2026-01-01T00:00:00.000Z");
const credential = {
  id: "c",
  type: "VOG",
  title: "Verklaring",
  status: "SUBMITTED",
  updatedAt,
  documentId: "doc",
  document: { mimeType: "application/pdf", ownerId: "owner" },
  freelancerProfile: { userId: "owner" },
  issuedAt: null,
  expiresAt: null,
};
const tx = {
  credential: { updateMany: m.update },
  credentialVerification: { create: m.history },
  verificationRequest: { updateMany: m.requests },
  notification: { create: m.notify },
  auditLog: { create: m.audit },
};
function form() {
  const fd = new FormData();
  for (const [k, v] of Object.entries({
    updatedAt: updatedAt.toISOString(),
    documentId: "doc",
    reviewMethod: "DIGITAL_VOG",
    original: "on",
    person: "on",
    authenticity: "on",
    scope: "on",
    reason: "Vraag een leesbaar origineel.",
  }))
    fd.set(k, v);
  return fd;
}
beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ id: "admin" });
  m.load.mockResolvedValue(credential);
  m.update.mockResolvedValue({ count: 1 });
  m.audit.mockResolvedValue({});
  m.transaction.mockImplementation((fn: (client: typeof tx) => Promise<unknown>) => fn(tx));
});
describe("credential decision enforcement", () => {
  it("requires ADMIN before accessing private data, on both action paths", async () => {
    m.auth.mockRejectedValue(new Error("Geen toegang."));
    expect(await verifyCredentialState("c", undefined, form())).toEqual({ error: "Geen toegang." });
    expect(await rejectCredentialState("c", undefined, form())).toEqual({ error: "Geen toegang." });
    expect(m.auth).toHaveBeenCalledWith("ADMIN");
    expect(m.load).not.toHaveBeenCalled();
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("empty one-click approval can no longer mutate", async () => {
    expect(await verifyCredentialState("c", undefined, new FormData())).toHaveProperty("error");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("keeps update, immutable manual evidence, request, notification and audit in one transaction", async () => {
    expect(await verifyCredentialState("c", undefined, form())).toEqual({ ok: true });
    expect(m.transaction).toHaveBeenCalledTimes(1);
    expect(m.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "c",
          status: "SUBMITTED",
          updatedAt,
          documentId: "doc",
          OR: expect.any(Array),
        }),
      }),
    );
    expect(m.history).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: "ADMIN",
        verifierId: "admin",
        decision: "VERIFIED",
        reviewMethod: "DIGITAL_VOG",
        reviewEvidence: expect.stringContaining('"confirmations"'),
      }),
    });
    expect(m.requests).toHaveBeenCalledOnce();
    expect(m.notify).toHaveBeenCalledOnce();
    expect(m.audit).toHaveBeenCalledOnce();
  });
  it("losing a concurrent update leaves no history, audit, notification or cleanup", async () => {
    m.update.mockResolvedValue({ count: 0 });
    expect(await verifyCredentialState("c", undefined, form())).toHaveProperty("error");
    expect(m.history).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
    expect(m.notify).not.toHaveBeenCalled();
    expect(m.cleanup).not.toHaveBeenCalled();
  });
  it("propagates audit failure out of the transaction and never starts evidence deletion", async () => {
    m.audit.mockRejectedValue(new Error("Audit mislukt."));
    expect(await verifyCredentialState("c", undefined, form())).toEqual({
      error: "Audit mislukt.",
    });
    await expect(m.transaction.mock.results[0]?.value).rejects.toThrow("Audit mislukt.");
    expect(m.cleanup).not.toHaveBeenCalled();
    expect(m.invalidate).not.toHaveBeenCalled();
  });
  it("refuses a replacement document also on rejection", async () => {
    m.load.mockResolvedValue({ ...credential, documentId: "replacement" });
    expect(await rejectCredentialState("c", undefined, form())).toHaveProperty("error");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("preserves rejection for a missing document with a current snapshot", async () => {
    m.load.mockResolvedValue({ ...credential, documentId: null, document: null });
    const fd = form();
    fd.set("documentId", "");
    expect(await rejectCredentialState("c", undefined, fd)).toEqual({ ok: true });
  });
});
