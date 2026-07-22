// Unit-tests voor setDienstStatus — de robuustheid van de doelstatus-invoer (DOEL 2). Een geknutselde
// POST met een `target` buiten de JobStatus-enum mag geen ongevangen ZodError → generieke 500 geven,
// maar een nette afwijzing, en mag de DB niet raken. Een geldige doelstatus passeert de poort en bereikt
// de tenant-/overgangslogica. Prisma, authz, audit en next-cache gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "fr-1", role: "FRANCHISER", status: "ACTIVE", tenantId: "tenant-1" } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
};

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
const updateMock = vi.hoisted(() => vi.fn(async () => ({})));
const auditMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    job: { findUnique: findUniqueMock, update: updateMock },
  },
}));

import { setDienstStatus } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  updateMock.mockClear();
  auditMock.mockClear();
});

describe("setDienstStatus — doelstatus-validatie", () => {
  it("weigert een doelstatus buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(setDienstStatus("job-1", "HACKED")).rejects.toThrow("Ongeldige doelstatus.");
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("laat een geldige doelstatus door tot de DB-lookup (hier: niet gevonden)", async () => {
    // Een geldige enum-waarde passeert de safeParse-poort en bereikt de ownership-lookup.
    await expect(setDienstStatus("job-1", "CLOSED")).rejects.toThrow("Dienst niet gevonden.");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("geeft een cross-tenant dienst exact dezelfde melding als een onbekend id (geen existence-oracle, CWE-203)", async () => {
    // Regressie: voorheen wees `assertSameTenant` een dienst van een ándere tenant af met een
    // onderscheidbare 403-melding ("Geen toegang tot deze bemiddeling-resource."), terwijl een
    // onbekend id "Dienst niet gevonden." gaf — waarneembaar verschil dat het bestaan van andermans
    // dienst verraadt. Nu geven beide gevallen exact dezelfde melding en raken de DB niet met een update.
    findUniqueMock.mockResolvedValue({
      tenantId: "tenant-2",
      status: "PUBLISHED",
      publishedAt: new Date(),
    });
    await expect(setDienstStatus("job-x", "CLOSED")).rejects.toThrow("Dienst niet gevonden.");
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });
});
