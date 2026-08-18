// Regressietest voor de AVG-auditplicht (CLAUDE.md regel 5 / OWASP A09 / CWE-208) op de
// platformfactuur-PDF-route (`/api/admin/facturatie/[id]/pdf`). De success-tak logde al
// `PLATFORM_BILLING_PDF_ACCESSED`, maar de not-found-tak keerde direct terug met een 404 zónder
// audit-write — als enige van alle sibling-PDF-/document-routes. Dat gat betekent:
//   1. een admin die op niet-bestaande platformfactuur-id's probeert (recon) laat geen spoor na, en
//   2. de not-found-tak doet minder werk dan de success-tak (geen requestMeta + audit-write), een
//      meetbaar timing-zijkanaal (CWE-208).
// Deze test faalt zonder de `auditDeniedAccess(... outcome: "not-found")`-aanroep vóór de 404.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
let actor: Actor | null = { id: "admin-1", role: "ADMIN", status: "ACTIVE", tenantId: null };
let detail: Record<string, unknown> | null = null;

vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.7", userAgent: "vitest" })),
}));
vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireRole: vi.fn(async () => {
      if (!actor) throw new actual.AuthorizationError("Niet ingelogd.", 401);
      return actor;
    }),
  };
});
// Rate-limiter niet actief in de test: laat de request door.
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: vi.fn(async () => null) }));
vi.mock("@/lib/platform-billing/billing-data", () => ({
  getPlatformBillingInvoiceDetail: vi.fn(async () => detail),
}));
vi.mock("@/lib/platform-billing/billing-pdf", () => ({
  buildPlatformBillingPdf: vi.fn(async () => Buffer.from("pdf")),
}));

import { GET as platformPdf } from "@/app/api/admin/facturatie/[id]/pdf/route";

const req = new Request("http://localhost/test");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  auditMock.mockClear();
  actor = { id: "admin-1", role: "ADMIN", status: "ACTIVE", tenantId: null };
  detail = null;
});

describe("Platformfactuur-PDF auditeert toegang (AVG, CLAUDE.md regel 5)", () => {
  it("geautoriseerde inzage schrijft PLATFORM_BILLING_PDF_ACCESSED", async () => {
    detail = { number: "PF-1" };
    const res = await platformPdf(req, ctx("pf-1"));
    expect(res.status).toBe(200);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLATFORM_BILLING_PDF_ACCESSED",
        entityType: "PlatformInvoice",
        entityId: "pf-1",
        actorId: "admin-1",
      }),
    );
  });

  it("niet-bestaande factuur: 404 én een PLATFORM_BILLING_PDF_ACCESS_DENIED-auditregel (recon + timing-pariteit)", async () => {
    detail = null; // getPlatformBillingInvoiceDetail geeft null → not-found-tak
    const res = await platformPdf(req, ctx("ghost"));
    expect(res.status).toBe(404);
    // Zonder de fix keert de route hier direct terug zonder audit-write → 0 calls (test rood).
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLATFORM_BILLING_PDF_ACCESS_DENIED",
        entityType: "PlatformInvoice",
        entityId: "ghost",
        actorId: "admin-1",
        metadata: expect.objectContaining({ outcome: "not-found" }),
      }),
    );
  });
});
