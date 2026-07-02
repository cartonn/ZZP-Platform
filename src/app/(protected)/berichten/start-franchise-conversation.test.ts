// Bemiddelaar-gesprek (rode draad 8): een FRANCHISER mag zelf een gesprek starten met een ZZP'er
// uit het eigen roster of een opdrachtgever — maar UITSLUITEND binnen de eigen tenant, en het
// hergebruiken van een bestaand opdracht-loos tweegesprek moet idempotent zijn (geen duplicaten).
// Deze tests borgen de authz-grens (cross-tenant → 403) en de idempotentie.

import { describe, it, expect, vi, beforeEach } from "vitest";

const userFindUnique = vi.hoisted(() => vi.fn());
const conversationFindFirst = vi.hoisted(() => vi.fn());
const conversationCreate = vi.hoisted(() => vi.fn());
const auditFn = vi.hoisted(() => vi.fn(async () => {}));
const redirectFn = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
);

let currentActor: { id: string; role: string; tenantId: string | null; status: string };

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireActor: vi.fn(async () => currentActor),
    requireRole: vi.fn(async (role: string) => {
      if (currentActor.role !== role) throw new actual.AuthorizationError("Verkeerde rol.", 403);
      return currentActor;
    }),
  };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectFn }));
vi.mock("@/lib/audit", () => ({ audit: auditFn }));
vi.mock("@/lib/rate-limit", () => ({
  messageRateLimiter: { check: vi.fn(async () => ({ allowed: true })) },
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    conversation: { findFirst: conversationFindFirst, create: conversationCreate },
  },
}));

import { startFranchiseConversation } from "./actions";

beforeEach(() => {
  currentActor = { id: "fr-1", role: "FRANCHISER", tenantId: "t-1", status: "ACTIVE" };
  userFindUnique.mockReset();
  conversationFindFirst.mockReset();
  conversationCreate.mockReset();
  auditFn.mockClear();
  redirectFn.mockClear();
});

describe("startFranchiseConversation — authz + idempotentie", () => {
  it("weigert een ontvanger uit een andere tenant (geen cross-tenant contact)", async () => {
    userFindUnique.mockResolvedValue({
      id: "zzp-9",
      role: "FREELANCER",
      tenantId: "t-2",
      status: "ACTIVE",
    });

    await expect(startFranchiseConversation("zzp-9")).rejects.toThrow(/niet gevonden/i);
    expect(conversationCreate).not.toHaveBeenCalled();
  });

  it("weigert een niet-FRANCHISER actor", async () => {
    currentActor = { id: "c-1", role: "CLIENT", tenantId: "t-1", status: "ACTIVE" };
    await expect(startFranchiseConversation("zzp-1")).rejects.toThrow();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("weigert een franchiser zonder gekoppelde bemiddeling", async () => {
    currentActor = { id: "fr-1", role: "FRANCHISER", tenantId: null, status: "ACTIVE" };
    await expect(startFranchiseConversation("zzp-1")).rejects.toThrow(/bemiddeling/i);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("weigert een gesprek met jezelf", async () => {
    await expect(startFranchiseConversation("fr-1")).rejects.toThrow(/jezelf/i);
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("weigert een geschorste ontvanger", async () => {
    userFindUnique.mockResolvedValue({
      id: "zzp-3",
      role: "FREELANCER",
      tenantId: "t-1",
      status: "SUSPENDED",
    });
    await expect(startFranchiseConversation("zzp-3")).rejects.toThrow(/niet gevonden/i);
    expect(conversationCreate).not.toHaveBeenCalled();
  });

  it("hergebruikt een bestaand opdracht-loos gesprek (idempotent, geen duplicaat, geen audit)", async () => {
    userFindUnique.mockResolvedValue({
      id: "zzp-1",
      role: "FREELANCER",
      tenantId: "t-1",
      status: "ACTIVE",
    });
    conversationFindFirst.mockResolvedValue({ id: "conv-bestaand" });

    await expect(startFranchiseConversation("zzp-1")).rejects.toThrow(
      "REDIRECT:/berichten/conv-bestaand",
    );
    expect(conversationCreate).not.toHaveBeenCalled();
    expect(auditFn).not.toHaveBeenCalled();
    // De hergebruik-query moet op jobId=null filteren zodat opdracht-gesprekken los blijven.
    expect(conversationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ jobId: null }) }),
    );
  });

  it("maakt een nieuw gesprek met een opdrachtgever + auditregel als er nog geen bestaat", async () => {
    userFindUnique.mockResolvedValue({
      id: "cl-1",
      role: "CLIENT",
      tenantId: "t-1",
      status: "ACTIVE",
    });
    conversationFindFirst.mockResolvedValue(null);
    conversationCreate.mockResolvedValue({ id: "conv-nieuw" });

    await expect(startFranchiseConversation("cl-1")).rejects.toThrow(
      "REDIRECT:/berichten/conv-nieuw",
    );
    expect(conversationCreate).toHaveBeenCalledTimes(1);
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CONVERSATION_STARTED",
        entityId: "conv-nieuw",
        actorId: "fr-1",
      }),
    );
  });
});
