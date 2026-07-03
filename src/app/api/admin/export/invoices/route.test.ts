// Integratietest: de export-rem (rate-limit) zit daadwerkelijk op de admin-facturen-export bedraad.
// Deze route dumpt ÁLLE platformfacturen met tegenpartij-PII per call — de grootste amplificatie —
// dus we bewaken dat een scripted loop na de limiet een 429 krijgt i.p.v. een nieuwe volledige dump.
// We vervangen de gedeelde exportRateLimiter door een limiet-1-variant (eigen in-memory store), zodat
// de tweede call al over de grens is — zonder de globale env of andere testbestanden te raken.

import { describe, it, expect, vi, beforeEach } from "vitest";

const auditCreate = vi.hoisted(() => vi.fn(async () => ({})));
const findMany = vi.hoisted(() => vi.fn(async () => []));

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireRole: vi.fn(async () => ({
      id: "admin-1",
      role: "ADMIN",
      status: "ACTIVE",
      tenantId: null,
    })),
  };
});
vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: { findMany },
    auditLog: { create: auditCreate },
  },
}));
vi.mock("@/lib/administration/csv", () => ({ platformInvoicesCsv: () => "csv" }));
vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  return {
    ...actual,
    // Limiet 1 met een eigen store: eerste call mag door, elke volgende wordt geremd.
    exportRateLimiter: new actual.RateLimiter(
      new actual.MemoryRateLimitStore(),
      1,
      60_000,
      "test:",
    ),
  };
});

import { GET } from "@/app/api/admin/export/invoices/route";

beforeEach(() => {
  auditCreate.mockClear();
  findMany.mockClear();
});

describe("admin-facturen-export: rate-limit", () => {
  it("serveert de eerste export en remt de tweede met 429", async () => {
    const first = await GET();
    expect(first.status).toBe(200);
    expect(findMany).toHaveBeenCalledTimes(1);

    const second = await GET();
    expect(second.status).toBe(429);
    // De dure query + audit draaien niet meer op de geremde call.
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
  });
});
