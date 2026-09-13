import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  requireActor: vi.fn(),
  loadSigningView: vi.fn(),
  buildSigningOriginal: vi.fn(),
  buildSigningEvidencePdf: vi.fn(),
  audit: vi.fn(),
  auditDeniedAccess: vi.fn(),
  check: vi.fn(),
}));
vi.mock("@/lib/authz", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/authz")>()),
  requireActor: state.requireActor,
}));
vi.mock("@/lib/signing-service", () => ({
  loadSigningView: state.loadSigningView,
  buildSigningOriginal: state.buildSigningOriginal,
}));
vi.mock("@/lib/signing-evidence-pdf", () => ({
  buildSigningEvidencePdf: state.buildSigningEvidencePdf,
}));
vi.mock("@/lib/audit", () => ({ audit: state.audit }));
vi.mock("@/lib/security/access-audit", () => ({ auditDeniedAccess: state.auditDeniedAccess }));
vi.mock("@/lib/rate-limit", () => ({ documentPdfRateLimiter: { check: state.check } }));

import { AuthorizationError } from "@/lib/authz";
import { GET } from "./route";

const actor = { id: "owner", role: "CLIENT", status: "ACTIVE" };
const original = Buffer.from("%PDF-synthetic-immutable-original");
const evidence = Buffer.from("%PDF-synthetic-evidence-report");
const document = { version: 1, collaborationId: "col", jobTitle: "Synthetic agreement" };
function view() {
  return {
    document,
    documentHash: "a".repeat(64),
    col: {
      status: "PROPOSED",
      disputedAt: null,
      signing: {
        pdfHash: "b".repeat(64),
        documentPdf: original,
        createdAt: new Date("2026-09-12"),
        signatures: [{ actorId: "owner", signerName: "Synthetic Owner", party: "CLIENT" }],
      },
    },
  };
}
const get = (query = "", id = "col") =>
  GET(new Request(`https://handslag.test/api/samenwerkingen/${id}/ondertekening${query}`), {
    params: Promise.resolve({ id }),
  });

beforeEach(() => {
  vi.resetAllMocks();
  state.requireActor.mockResolvedValue(actor);
  state.check.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  state.loadSigningView.mockResolvedValue(view());
  state.buildSigningOriginal.mockResolvedValue(Buffer.from("%PDF-synthetic-preview"));
  state.buildSigningEvidencePdf.mockResolvedValue(evidence);
});

function expectPrivate(response: Response, type: string) {
  expect(response.headers.get("content-type")).toBe(type);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin");
  expect(response.headers.get("content-disposition")).toContain("filename=");
}

it.each([401, 403])(
  "rejects authentication failures with %s before reading documents",
  async (status) => {
    state.requireActor.mockRejectedValueOnce(new AuthorizationError("No access", status));
    expect((await get()).status).toBe(status);
    expect(state.check).not.toHaveBeenCalled();
    expect(state.loadSigningView).not.toHaveBeenCalled();
    expect(state.buildSigningEvidencePdf).not.toHaveBeenCalled();
  },
);

it("limits document requests before resolving sensitive data", async () => {
  state.check.mockResolvedValueOnce({ allowed: false, retryAfterMs: 1250 });
  const response = await get();
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("2");
  expect(state.check).toHaveBeenCalledWith("owner");
  expect(state.loadSigningView).not.toHaveBeenCalled();
});

it.each(["col", "missing"])(
  "returns the same private-access denial for inaccessible id %s",
  async (id) => {
    state.loadSigningView.mockResolvedValueOnce(null);
    const response = await get("?format=json", id);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Niet gevonden." });
    expect(state.auditDeniedAccess).toHaveBeenCalledWith({
      actorId: "owner",
      action: "SIGNING_EVIDENCE_ACCESS_DENIED",
      entityType: "Collaboration",
      entityId: id,
      outcome: "not-found",
    });
    expect(state.audit).not.toHaveBeenCalled();
    expect(state.buildSigningEvidencePdf).not.toHaveBeenCalled();
  },
);

it("downloads the exact stored original bytes without rebuilding the agreement", async () => {
  const response = await get("?original=1");
  expectPrivate(response, "application/pdf");
  expect(Buffer.from(await response.arrayBuffer())).toEqual(original);
  expect(state.buildSigningOriginal).not.toHaveBeenCalled();
  expect(state.buildSigningEvidencePdf).not.toHaveBeenCalled();
  expect(state.audit).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "SIGNING_EVIDENCE_ACCESSED",
      metadata: { documentHash: "a".repeat(64), original: true },
    }),
  );
});

it("exports evidence separately from the immutable original", async () => {
  const response = await get();
  expectPrivate(response, "application/pdf");
  expect(Buffer.from(await response.arrayBuffer())).toEqual(evidence);
  expect(state.buildSigningEvidencePdf).toHaveBeenCalledWith(view());
  expect(state.buildSigningOriginal).not.toHaveBeenCalled();
});

it("exports a private structured proof without including stored PDF bytes", async () => {
  const response = await get("?format=json");
  expectPrivate(response, "application/json");
  const data = await response.json();
  expect(data).toEqual({
    document,
    documentHash: "a".repeat(64),
    pdfHash: "b".repeat(64),
    recordedAt: "2026-09-12T00:00:00.000Z",
    signatures: view().col.signing.signatures,
    status: "PROPOSED",
    disputed: false,
  });
  expect(data).not.toHaveProperty("documentPdf");
  expect(state.buildSigningEvidencePdf).not.toHaveBeenCalled();
});

it.each(["", "?original=1", "?format=json"])(
  "fails closed if export auditing fails for %s",
  async (query) => {
    state.audit.mockRejectedValueOnce(new Error("synthetic audit failure"));
    await expect(get(query)).rejects.toThrow("synthetic audit failure");
    expect(state.buildSigningEvidencePdf).not.toHaveBeenCalled();
    expect(state.buildSigningOriginal).not.toHaveBeenCalled();
  },
);

it("does not suppress evidence-integrity failures", async () => {
  state.loadSigningView.mockRejectedValueOnce(new Error("synthetic integrity failure"));
  await expect(get()).rejects.toThrow("synthetic integrity failure");
  expect(state.audit).not.toHaveBeenCalled();
  expect(state.buildSigningEvidencePdf).not.toHaveBeenCalled();
});
