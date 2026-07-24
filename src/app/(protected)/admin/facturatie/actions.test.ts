// Unit-tests voor setBillingStatusAction — grensvalidatie van de invoer (DOEL 2 / architectuurregel #2).
// De server-action is direct aanroepbaar (via `.bind` in de UI, maar ook los door elke ADMIN met
// geknutselde args). Een niet-enum `to` of leeg `id` mag geen ongevangen ZodError → generieke 500
// geven, maar een nette weigering, en mag de DB niet raken. Een geldige (id, to) passeert de grens en
// bereikt de factuur-lookup + overgangslogica. Prisma, authz, audit en next-cache gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
const updateManyMock = vi.hoisted(() => vi.fn(async () => ({ count: 1 })));
const auditMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    platformBillingInvoice: { findUnique: findUniqueMock, updateMany: updateManyMock },
  },
}));

import { setBillingStatusAction } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  updateManyMock.mockClear();
  updateManyMock.mockResolvedValue({ count: 1 });
  auditMock.mockClear();
});

describe("setBillingStatusAction — grensvalidatie", () => {
  it("weigert een doelstatus buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(setBillingStatusAction("inv-1", "HACKED" as "SENT")).rejects.toThrow(
      "Ongeldige invoer.",
    );
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("weigert een leeg id met een nette fout, zónder de DB te raken", async () => {
    await expect(setBillingStatusAction("   ", "SENT")).rejects.toThrow("Ongeldige invoer.");
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("laat een geldige (id, to) door tot de factuur-lookup (hier: niet gevonden)", async () => {
    await expect(setBillingStatusAction("inv-1", "SENT")).rejects.toThrow("Factuur niet gevonden.");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("verwerkt een geldige overgang (DRAFT→SENT): update + audit met de gevalideerde waarden", async () => {
    findUniqueMock.mockResolvedValue({ status: "DRAFT" });
    await setBillingStatusAction("inv-42", "SENT");
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    const updateArg = updateManyMock.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string; issuedAt?: Date };
    };
    expect(updateArg.where).toMatchObject({ id: "inv-42", status: "DRAFT" });
    expect(updateArg.data.status).toBe("SENT");
    expect(updateArg.data.issuedAt).toBeInstanceOf(Date);
    expect(auditMock).toHaveBeenCalledTimes(1);
    const auditArg = auditMock.mock.calls[0]![0] as {
      entityId: string;
      metadata: { to: string };
    };
    expect(auditArg.entityId).toBe("inv-42");
    expect(auditArg.metadata.to).toBe("SENT");
  });
});
