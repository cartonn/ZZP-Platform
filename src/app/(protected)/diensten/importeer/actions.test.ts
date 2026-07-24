// Contract van importDienstenAction: auth → rol FREELANCER → ownership → import.
// Anti-oracle (CWE-203): een onbekend collaborationId én andermans samenwerking geven exact
// dezelfde melding, zodat een ZZP'er niet via een gegokt id het bestaan van andermans
// samenwerking kan aftasten.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));
const colState = vi.hoisted(() => ({
  found: null as {
    status: string;
    rate: number | null;
    ortProfile: unknown;
    ortCustomRates: unknown;
    freelancer: { userId: string };
    company: { userId: string };
  } | null,
}));

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => ({ id: "user-1", role: roleState.role, status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn(async () => colState.found),
    },
  },
}));

import { importDienstenAction } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validForm = () => form({ collaborationId: "col-x", csv: "start;eind\n" });

describe("importDienstenAction — anti-oracle ownership", () => {
  beforeEach(() => {
    roleState.role = "FREELANCER";
    colState.found = null;
  });

  it("onbekend id → 'Samenwerking niet gevonden.'", async () => {
    colState.found = null;
    const res = await importDienstenAction(null, validForm());
    expect(res.errors).toContain("Samenwerking niet gevonden.");
    expect(res.imported).toBe(0);
  });

  it("andermans samenwerking → identieke melding (geen existence-oracle)", async () => {
    colState.found = {
      status: "ACTIVE",
      rate: 80,
      ortProfile: null,
      ortCustomRates: null,
      freelancer: { userId: "someone-else" },
      company: { userId: "client-9" },
    };
    const res = await importDienstenAction(null, validForm());
    // Exact dezelfde melding als het onbekende id — geen "geen toegang"-divergentie.
    expect(res.errors).toContain("Samenwerking niet gevonden.");
    expect(res.errors).not.toContain("Je hebt geen toegang tot deze samenwerking.");
    expect(res.imported).toBe(0);
  });

  it("niet-FREELANCER wordt geweigerd", async () => {
    roleState.role = "CLIENT";
    const res = await importDienstenAction(null, validForm());
    expect(res.errors[0]).toContain("Alleen ZZP'ers");
    expect(res.imported).toBe(0);
  });
});
