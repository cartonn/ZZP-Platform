// Defense-in-depth (OWASP A01 — broken access control): het bemiddelaars-paneel laadt álle tenants
// plus de naam/e-mail van elke bemiddelaar (cross-tenant PII). Het moet zijn eigen server-side
// ADMIN-check dragen en niet uitsluitend leunen op de gate van zijn aanroeper — anders lekt het bij
// hergebruik elders alle tenant-PII aan een niet-ADMIN. Zonder de `requireRole("ADMIN")` in het
// paneel draait `prisma.tenant.findMany` en resolvet de render: deze test faalt dan (rood→groen).

import { describe, it, expect, vi, beforeEach } from "vitest";

const authz = vi.hoisted(() => ({
  requireRole: vi.fn(async () => {
    throw new Error("FORBIDDEN");
  }),
}));

vi.mock("@/lib/authz", () => ({ requireRole: authz.requireRole }));

const tenantFindMany = vi.hoisted(() => vi.fn(async () => []));
vi.mock("@/lib/db", () => ({ prisma: { tenant: { findMany: tenantFindMany } } }));

// Client-component-afhankelijkheid isoleren: irrelevant voor de authz-poort.
vi.mock("@/app/(protected)/admin/franchises/franchise-form", () => ({
  FranchiseForm: () => null,
}));

import { BemiddelaarsPanel } from "./bemiddelaars-panel";

beforeEach(() => {
  authz.requireRole.mockClear();
  tenantFindMany.mockClear();
});

describe("BemiddelaarsPanel — eigen ADMIN-poort (defense-in-depth)", () => {
  it("checkt ADMIN vóór het laden van tenant-PII en weigert een niet-ADMIN", async () => {
    await expect(BemiddelaarsPanel()).rejects.toThrow(/FORBIDDEN/);
    // De rolcheck moet zijn uitgevoerd met exact de ADMIN-rol.
    expect(authz.requireRole).toHaveBeenCalledWith("ADMIN");
    // Cruciaal: geen enkele tenant-/PII-query mag zijn gedraaid vóór de geweigerde poort.
    expect(tenantFindMany).not.toHaveBeenCalled();
  });
});
