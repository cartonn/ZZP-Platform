// Contract van createFranchiseDienst: een onbekend afdeling-id en een afdeling van een ÁNDERE tenant
// moeten zich IDENTIEK gedragen — geen cross-tenant existence-oracle (CWE-203 / OWASP A01). Beide
// gevallen geven exact dezelfde melding ("Afdeling niet gevonden.") en raken nooit de DB-schrijf of
// audit. Rood→groen: vóór de fix gaf de cross-tenant tak een onderscheidbare AuthorizationError-melding
// ("Geen toegang tot deze bemiddeling-resource."), waarmee een franchiser kon aflezen dat een id bij
// een ándere bemiddeling hoorde. Spiegelt wizard-oracle.test.ts (addAfdelingStep/removeAfdelingStep).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const dbState = vi.hoisted(() => ({
  dept: null as { companyId: string; company: { tenantId: string } } | null,
}));

const db = vi.hoisted(() => ({
  deptFind: vi.fn(async () => dbState.dept),
  skillFind: vi.fn(async () => []),
  jobCreate: vi.fn(async () => ({ id: "job-new" })),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    department: { findUnique: db.deptFind },
    skill: { findMany: db.skillFind },
    job: { create: db.jobCreate },
  },
}));

vi.mock("@/lib/tenancy", () => ({
  ownsViaTenant: (actor: { role: string; tenantId?: string | null }, entityTenantId: string) =>
    actor.role === "ADMIN" || (Boolean(actor.tenantId) && actor.tenantId === entityTenantId),
}));

const audit = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/audit", () => ({ audit }));

import { createFranchiseDienst } from "@/lib/franchise/dienst";

const actor: Actor = { id: "user-1", role: "FRANCHISER", status: "ACTIVE", tenantId: "tenant-A" };

function dienstForm(): FormData {
  const f = new FormData();
  f.set("title", "Nachtdienst verpleegkundige");
  f.set("description", "Zorg op de nachtafdeling gedurende de nacht.");
  return f;
}

beforeEach(() => {
  dbState.dept = { companyId: "comp-1", company: { tenantId: "tenant-A" } };
  Object.values(db).forEach((m) => m.mockClear());
  audit.mockClear();
});

describe("createFranchiseDienst — geen cross-tenant existence-oracle", () => {
  it("maakt de dienst aan binnen de eigen tenant", async () => {
    const res = await createFranchiseDienst({
      actor,
      departmentId: "dep-1",
      formData: dienstForm(),
    });
    expect(res).toEqual({
      ok: true,
      jobId: "job-new",
      title: "Nachtdienst verpleegkundige",
      companyId: "comp-1",
    });
    expect(db.jobCreate).toHaveBeenCalled();
    expect(audit).toHaveBeenCalled();
  });

  it("cross-tenant afdeling en onbekend id geven exact dezelfde melding (geen bestaan-lek)", async () => {
    dbState.dept = { companyId: "comp-1", company: { tenantId: "tenant-B" } }; // bestaat, andere tenant
    const cross = await createFranchiseDienst({
      actor,
      departmentId: "dep-1",
      formData: dienstForm(),
    });
    dbState.dept = null; // bestaat niet
    const missing = await createFranchiseDienst({
      actor,
      departmentId: "dep-x",
      formData: dienstForm(),
    });

    expect(cross).toEqual({
      error: "Afdeling niet gevonden.",
      fieldErrors: { departmentId: "Onbekend." },
    });
    expect(missing).toEqual(cross);
    expect(db.jobCreate).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });
});
