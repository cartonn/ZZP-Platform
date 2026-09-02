// Wiring-test voor de admin-activatiepoort: alleen ADMIN, reden verplicht bij afwijzen, race-veilig
// (updateMany op de verwachte status) en atomair mét notificatie + auditregel. Prisma, authz en het
// mailkanaal zijn gemockt; de echte Zod- en overgangslogica draaien mee.

import { describe, it, expect, vi, beforeEach } from "vitest";

const requireRoleMock = vi.hoisted(() => vi.fn());
const tenantFindUnique = vi.hoisted(() => vi.fn());
const tenantUpdateMany = vi.hoisted(() => vi.fn());
const notificationCreate = vi.hoisted(() => vi.fn());
const auditCreate = vi.hoisted(() => vi.fn());
const sendMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return { ...actual, requireRole: requireRoleMock };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: sendMock }),
  isMailDeliveryConfigured: () => true,
}));
vi.mock("@/lib/public-url", () => ({ publicOrigin: async () => "https://handslag.test" }));
vi.mock("@/lib/db", () => ({
  prisma: {
    tenant: { findUnique: tenantFindUnique, updateMany: tenantUpdateMany },
    user: { findUnique: vi.fn() },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        tenant: { updateMany: tenantUpdateMany },
        notification: { create: notificationCreate },
        auditLog: { create: auditCreate },
      }),
  },
}));

import { AuthorizationError } from "@/lib/authz";
import { decideActivation } from "@/app/(protected)/admin/franchises/actions";

function form(decision: string, reason?: string): FormData {
  const fd = new FormData();
  fd.set("tenantId", "t1");
  fd.set("decision", decision);
  if (reason !== undefined) fd.set("reason", reason);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({ id: "admin1", role: "ADMIN", status: "ACTIVE" });
  tenantFindUnique.mockResolvedValue({
    id: "t1",
    name: "Zorgbemiddeling Noord",
    status: "PENDING",
    owner: { id: "u1", name: "Anna", email: "anna@bureau.nl" },
  });
  tenantUpdateMany.mockResolvedValue({ count: 1 });
});

describe("decideActivation", () => {
  it("weigert een niet-admin zonder de tenant te raken", async () => {
    requireRoleMock.mockRejectedValue(new AuthorizationError("Geen toegang.", 403));
    const res = await decideActivation(undefined, form("ACTIVATE"));
    expect(res?.error).toBe("Geen toegang.");
    expect(tenantUpdateMany).not.toHaveBeenCalled();
  });

  it("activeert een wachtende aanmelding met notificatie, audit en één e-mail", async () => {
    const res = await decideActivation(undefined, form("ACTIVATE"));
    expect(res?.ok).toBe(true);
    expect(tenantUpdateMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "t1", status: "PENDING" },
      data: { status: "ACTIVE", activationNote: null },
    });
    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate.mock.calls[0]?.[0].data.action).toBe("FRANCHISE_ACTIVATED");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("weigert een afwijzing zonder reden (server-side afgedwongen)", async () => {
    const res = await decideActivation(undefined, form("REJECT"));
    expect(res?.error).toMatch(/reden/i);
    expect(tenantUpdateMany).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("legt bij een afwijzing de reden vast op de tenant én in de audit", async () => {
    const res = await decideActivation(undefined, form("REJECT", "KvK klopt niet"));
    expect(res?.ok).toBe(true);
    expect(tenantUpdateMany.mock.calls[0]?.[0].data).toMatchObject({
      status: "REJECTED",
      activationNote: "KvK klopt niet",
    });
    expect(auditCreate.mock.calls[0]?.[0].data.action).toBe("FRANCHISE_REJECTED");
  });

  it("weigert een tweede beslissing op een al beoordeelde aanmelding", async () => {
    tenantFindUnique.mockResolvedValue({
      id: "t1",
      name: "Zorgbemiddeling Noord",
      status: "ACTIVE",
      owner: { id: "u1", name: "Anna", email: "anna@bureau.nl" },
    });
    const res = await decideActivation(undefined, form("ACTIVATE"));
    expect(res?.error).toMatch(/Ongeldige statusovergang/);
    expect(tenantUpdateMany).not.toHaveBeenCalled();
  });

  it("is race-veilig: verliest de update de race, dan volgt geen e-mail", async () => {
    tenantUpdateMany.mockResolvedValue({ count: 0 });
    const res = await decideActivation(undefined, form("ACTIVATE"));
    expect(res?.error).toMatch(/al beoordeeld/);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
