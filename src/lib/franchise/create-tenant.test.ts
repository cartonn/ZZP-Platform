// Gedeelde aanmaak van bemiddeling + bemiddelaar-account. Prisma is gemockt; de test bewaakt de
// invarianten die beide ingangen (admin + zelfaanmelding) delen: unieke slug, rol FRANCHISER,
// koppeling User.tenantId, meegegeven tenant-status en een auditregel in dezelfde transactie.

import { describe, it, expect, vi, beforeEach } from "vitest";

const tenantFindUnique = vi.hoisted(() => vi.fn());
const userCreate = vi.hoisted(() => vi.fn());
const tenantCreate = vi.hoisted(() => vi.fn());
const userUpdate = vi.hoisted(() => vi.fn());
const auditCreate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    tenant: { findUnique: tenantFindUnique },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        user: { create: userCreate, update: userUpdate },
        tenant: { create: tenantCreate },
        auditLog: { create: auditCreate },
      }),
  },
}));

import {
  createTenantWithOwner,
  slugifyTenantName,
  uniqueTenantSlug,
} from "@/lib/franchise/create-tenant";

beforeEach(() => {
  vi.clearAllMocks();
  tenantFindUnique.mockResolvedValue(null);
  userCreate.mockResolvedValue({ id: "u1" });
  tenantCreate.mockResolvedValue({ id: "t1" });
});

describe("slugifyTenantName", () => {
  it("maakt een url-veilige slug", () => {
    expect(slugifyTenantName("Zorgbemiddeling Noord")).toBe("zorgbemiddeling-noord");
    expect(slugifyTenantName("Bureau  &  Zo!")).toBe("bureau-zo");
  });

  it("valt terug op een vaste waarde als er niets overblijft", () => {
    expect(slugifyTenantName("!!!")).toBe("franchise");
  });
});

describe("uniqueTenantSlug", () => {
  it("hangt een suffix aan zolang de slug bezet is", async () => {
    const bezet = new Set(["bureau", "bureau-2"]);
    expect(await uniqueTenantSlug("Bureau", async (s) => bezet.has(s))).toBe("bureau-3");
  });
});

describe("createTenantWithOwner", () => {
  it("maakt account + tenant + koppeling + audit in één transactie", async () => {
    const res = await createTenantWithOwner({
      tenantName: "Zorgbemiddeling Noord",
      ownerName: "Anna de Vries",
      ownerEmail: "anna@bureau.nl",
      passwordHash: "hash",
      status: "PENDING",
      kvkNumber: "12345678",
      region: "Noord-Holland",
      auditAction: "FRANCHISE_SELF_REGISTERED",
    });

    expect(res).toEqual({ tenantId: "t1", userId: "u1", slug: "zorgbemiddeling-noord" });
    expect(userCreate.mock.calls[0]?.[0].data).toMatchObject({
      role: "FRANCHISER",
      status: "ACTIVE",
      email: "anna@bureau.nl",
    });
    expect(tenantCreate.mock.calls[0]?.[0].data).toMatchObject({
      status: "PENDING",
      ownerUserId: "u1",
      kvkNumber: "12345678",
      region: "Noord-Holland",
    });
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: "u1" }, data: { tenantId: "t1" } });
    expect(auditCreate.mock.calls[0]?.[0].data).toMatchObject({
      action: "FRANCHISE_SELF_REGISTERED",
      entityType: "Tenant",
      entityId: "t1",
      // Zonder expliciete actor is de aanmelder zelf de actor.
      actorId: "u1",
    });
  });

  it("gebruikt de handelende admin als actor wanneer die is meegegeven", async () => {
    await createTenantWithOwner({
      tenantName: "Bureau Zuid",
      ownerName: "Bram",
      ownerEmail: "bram@bureau.nl",
      passwordHash: "hash",
      status: "ACTIVE",
      mustChangePassword: true,
      auditAction: "FRANCHISE_CREATED",
      actorId: "admin1",
    });

    expect(userCreate.mock.calls[0]?.[0].data.mustChangePassword).toBe(true);
    expect(tenantCreate.mock.calls[0]?.[0].data.status).toBe("ACTIVE");
    expect(auditCreate.mock.calls[0]?.[0].data.actorId).toBe("admin1");
  });
});
