// Contract van de onboarding-wizard-acties (addAfdelingStep / removeAfdelingStep): een onbekend id
// en een entiteit van een ÁNDERE tenant moeten zich IDENTIEK gedragen — geen cross-tenant
// existence-oracle (CWE-203). addAfdelingStep geeft in beide gevallen exact dezelfde melding
// ("Opdrachtgever niet gevonden."); removeAfdelingStep is in beide gevallen een stille no-op zonder
// thrown AuthorizationError. Rood→groen: vóór de fix gaf addAfdelingStep een andere melding voor
// cross-tenant ("Geen toegang tot deze bemiddeling-resource.") en gooide removeAfdelingStep een
// ongevangen 403 — beide onderscheidbaar van "bestaat niet".

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FRANCHISER" as string, tenantId: "tenant-A" }));
const dbState = vi.hoisted(() => ({
  company: null as { tenantId: string } | null,
  dept: null as { companyId: string; company: { tenantId: string } } | null,
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
  ownsViaTenant: (actor: { role: string; tenantId?: string }, entityTenantId: string) =>
    actor.role === "ADMIN" || (Boolean(actor.tenantId) && actor.tenantId === entityTenantId),
}));

const audit = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/audit", () => ({ audit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/franchise/dienst", () => ({ createFranchiseDienst: vi.fn() }));

const db = vi.hoisted(() => ({
  companyFind: vi.fn(async () => dbState.company),
  deptFind: vi.fn(async () => dbState.dept),
  deptCreate: vi.fn(async () => ({ id: "dep-new" })),
  deptDelete: vi.fn(async () => ({})),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: db.companyFind },
    department: { findUnique: db.deptFind, create: db.deptCreate, delete: db.deptDelete },
  },
}));

import { addAfdelingStep, removeAfdelingStep } from "./actions";

function fd(name: string): FormData {
  const f = new FormData();
  f.set("name", name);
  return f;
}

beforeEach(() => {
  roleState.role = "FRANCHISER";
  roleState.tenantId = "tenant-A";
  dbState.company = { tenantId: "tenant-A" };
  dbState.dept = { companyId: "comp-1", company: { tenantId: "tenant-A" } };
  Object.values(db).forEach((m) => m.mockClear());
  audit.mockClear();
});

describe("addAfdelingStep — geen existence-oracle", () => {
  it("voegt een afdeling toe binnen de eigen tenant", async () => {
    const res = await addAfdelingStep("comp-1", undefined, fd("Spoedeisende hulp"));
    expect(db.deptCreate).toHaveBeenCalled();
    expect(res).toEqual({});
  });

  it("cross-tenant en onbekend id geven exact dezelfde melding (geen bestaan-lek)", async () => {
    dbState.company = { tenantId: "tenant-B" }; // bestaat, andere tenant
    const cross = await addAfdelingStep("comp-1", undefined, fd("Afdeling"));
    dbState.company = null; // bestaat niet
    const missing = await addAfdelingStep("comp-x", undefined, fd("Afdeling"));
    expect(cross).toEqual({ error: "Opdrachtgever niet gevonden." });
    expect(missing).toEqual(cross);
    expect(db.deptCreate).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });
});

describe("removeAfdelingStep — geen existence-oracle", () => {
  it("verwijdert een afdeling binnen de eigen tenant + audit", async () => {
    await removeAfdelingStep("dep-1");
    expect(db.deptDelete).toHaveBeenCalledWith({ where: { id: "dep-1" } });
    expect(audit).toHaveBeenCalled();
  });

  it("cross-tenant id: stille no-op zonder thrown 403 (identiek aan onbekend id)", async () => {
    dbState.dept = { companyId: "comp-1", company: { tenantId: "tenant-B" } };
    await expect(removeAfdelingStep("dep-1")).resolves.toBeUndefined();
    expect(db.deptDelete).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("onbekend id: stille no-op", async () => {
    dbState.dept = null;
    await expect(removeAfdelingStep("nope")).resolves.toBeUndefined();
    expect(db.deptDelete).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });
});
