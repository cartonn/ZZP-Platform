// Contract van deleteLead (AVG art. 17 — recht op wissen van prospect-PII): auth → rol FRANCHISER →
// tenant-ownership (assertSameTenant) → delete (LeadContact cascadet mee) → audit LEAD_DELETED →
// redirect naar de lijst. Een lead van een ándere tenant wordt nooit verwijderd; een niet-FRANCHISER
// evenmin. Rood→groen: zonder de ownership-/rol-poort zou de delete cross-tenant vuren.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({
  role: "FRANCHISER" as string,
  tenantId: "tenant-A" as string,
}));
const leadState = vi.hoisted(() => ({
  found: null as { tenantId: string; organizationName: string } | null,
}));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));

vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: "user-1", role: roleState.role, status: "ACTIVE", tenantId: roleState.tenantId };
  }),
}));

vi.mock("@/lib/tenancy", () => ({
  hasTenant: (a: { tenantId?: string } | null) => Boolean(a?.tenantId),
  assertSameTenant: vi.fn((actor: { role: string; tenantId?: string }, entityTenantId: string) => {
    if (actor.role === "ADMIN") return;
    if (!actor.tenantId || actor.tenantId !== entityTenantId) {
      throw new FakeAuthError("Geen toegang tot deze bemiddeling-resource.");
    }
  }),
}));

const audit = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/audit", () => ({ audit }));

const NEXT_REDIRECT = "NEXT_REDIRECT";
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    const e = new Error(NEXT_REDIRECT);
    (e as unknown as { path: string }).path = path;
    throw e;
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  findUnique: vi.fn(async () => leadState.found),
  del: vi.fn(async () => ({})),
}));
vi.mock("@/lib/db", () => ({
  prisma: { lead: { findUnique: db.findUnique, delete: db.del } },
}));

import { deleteLead } from "./actions";

async function run(id: string): Promise<{ redirected: boolean; path?: string }> {
  try {
    await deleteLead(id);
    return { redirected: false };
  } catch (e) {
    if (e instanceof Error && e.message === NEXT_REDIRECT) {
      return { redirected: true, path: (e as unknown as { path: string }).path };
    }
    throw e;
  }
}

describe("deleteLead", () => {
  beforeEach(() => {
    roleState.role = "FRANCHISER";
    roleState.tenantId = "tenant-A";
    leadState.found = { tenantId: "tenant-A", organizationName: "Zorggroep West" };
    [db.findUnique, db.del, audit].forEach((m) => m.mockClear());
  });

  it("verwijdert een eigen-tenant lead + audit LEAD_DELETED + redirect naar de lijst", async () => {
    const res = await run("lead-1");
    expect(db.del).toHaveBeenCalledWith({ where: { id: "lead-1" } });
    const auditArg = (audit.mock.calls[0] as unknown[])[0] as {
      action: string;
      entityId: string;
    };
    expect(auditArg.action).toBe("LEAD_DELETED");
    expect(auditArg.entityId).toBe("lead-1");
    expect(res).toEqual({ redirected: true, path: "/franchise/leads" });
  });

  it("weigert het wissen van een lead uit een andere tenant (cross-tenant) — geen delete", async () => {
    leadState.found = { tenantId: "tenant-B", organizationName: "Andere Franchise BV" };
    await expect(deleteLead("lead-1")).rejects.toBeInstanceOf(FakeAuthError);
    expect(db.del).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("weigert een niet-FRANCHISER", async () => {
    roleState.role = "CLIENT";
    await expect(deleteLead("lead-1")).rejects.toBeInstanceOf(FakeAuthError);
    expect(db.del).not.toHaveBeenCalled();
  });

  it("bij een onbekend/al-verwijderd id: geen delete, geen audit, wél redirect (geen bestaan-lek)", async () => {
    leadState.found = null;
    const res = await run("nope");
    expect(db.del).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
    expect(res).toEqual({ redirected: true, path: "/franchise/leads" });
  });
});
