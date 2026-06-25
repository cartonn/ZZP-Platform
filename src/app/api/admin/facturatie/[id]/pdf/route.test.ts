// Regressietest voor de AVG-auditplicht (CLAUDE.md regel 5, OWASP A09) op de admin-platformfactuur-
// PDF-route. Vóór deze fix serveerde deze route een platformfactuur (financiële PII: bedrijfsnaam,
// bedragen) ZONDER auditregel, in tegenstelling tot de overige PDF-routes (/api/facturen/[id]/pdf).
// De test faalt zonder de audit()-aanroep en bewaakt dat:
//   1. een geautoriseerde admin-inzage een PLATFORM_BILLING_PDF_ACCESSED-audit schrijft, en
//   2. een niet-admin een 403 krijgt en niets geserveerd/geaudit wordt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
let actor: Actor | null = { id: "admin-1", role: "ADMIN", status: "ACTIVE", tenantId: null };

vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.7", userAgent: "vitest" })),
}));
vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireRole: vi.fn(async (...roles: string[]) => {
      if (!actor) throw new actual.AuthorizationError("Niet ingelogd.", 401);
      if (!roles.includes(actor.role)) throw new actual.AuthorizationError("Geen toegang.", 403);
      return actor;
    }),
  };
});

const detail = { number: "PF-2026-001" } as Record<string, unknown>;
vi.mock("@/lib/platform-billing/billing-data", () => ({
  getPlatformBillingInvoiceDetail: vi.fn(async () => detail),
}));
vi.mock("@/lib/platform-billing/billing-pdf", () => ({
  buildPlatformBillingPdf: vi.fn(async () => Buffer.from("pdf")),
}));

import { GET } from "./route";

const req = new Request("http://localhost/test");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/admin/facturatie/[id]/pdf — audit", () => {
  beforeEach(() => {
    auditMock.mockClear();
    actor = { id: "admin-1", role: "ADMIN", status: "ACTIVE", tenantId: null };
  });

  it("schrijft een PLATFORM_BILLING_PDF_ACCESSED-audit bij een admin-inzage", async () => {
    const res = await GET(req, ctx("inv-1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        action: "PLATFORM_BILLING_PDF_ACCESSED",
        entityType: "PlatformInvoice",
        entityId: "inv-1",
        ipAddress: "203.0.113.7",
      }),
    );
  });

  it("weigert een niet-admin met 403 en serveert/auditeert niets", async () => {
    actor = { id: "user-2", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await GET(req, ctx("inv-1"));
    expect(res.status).toBe(403);
    expect(auditMock).not.toHaveBeenCalled();
  });
});
