// Unit-test voor de timing-pariteit-helper: béíde uitkomsten (geweigerd én niet-gevonden) schrijven
// exact één audit-regel via hetzelfde pad (requestMeta + audit), zodat de routes de niet-gevonden-tak
// niet meetbaar sneller kunnen afhandelen (CWE-208 / residual CWE-203). Zie access-audit.ts.

import { describe, it, expect, vi, beforeEach } from "vitest";

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.4", userAgent: "vitest" })),
}));

import { auditDeniedAccess } from "@/lib/security/access-audit";

beforeEach(() => auditMock.mockClear());

describe("auditDeniedAccess", () => {
  it("schrijft één audit-regel met de request-meta en outcome in de metadata (forbidden)", async () => {
    await auditDeniedAccess({
      actorId: "outsider",
      action: "DOCUMENT_ACCESS_DENIED",
      entityType: "Document",
      entityId: "doc-9",
      outcome: "forbidden",
      metadata: { viewerRole: "FREELANCER", ownerId: "owner-1" },
    });
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith({
      actorId: "outsider",
      action: "DOCUMENT_ACCESS_DENIED",
      entityType: "Document",
      entityId: "doc-9",
      metadata: { viewerRole: "FREELANCER", ownerId: "owner-1", outcome: "forbidden" },
      ipAddress: "203.0.113.4",
      userAgent: "vitest",
    });
  });

  it("merget outcome not-found bij een onbekend id, ook zonder extra metadata", async () => {
    await auditDeniedAccess({
      actorId: "probe",
      action: "INVOICE_PDF_ACCESS_DENIED",
      entityType: "Invoice",
      entityId: "nope",
      outcome: "not-found",
    });
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "probe",
        action: "INVOICE_PDF_ACCESS_DENIED",
        entityId: "nope",
        metadata: { outcome: "not-found" },
        ipAddress: "203.0.113.4",
      }),
    );
  });
});
