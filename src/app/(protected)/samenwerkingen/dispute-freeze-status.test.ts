// Dispuut-vries op de handmatige samenwerking-statuswijziging (persona-sweep 2026-07-20, run 40).
//
// Defect (MED, DOEL 2 — verboden statusovergang / freeze-bypass): `applyCollaborationStatusChange`
// (via `changeCollaborationStatus` / `cancelCollaboration`) was de enige statusmutatie op een
// samenwerking die `disputedAt` NIET las. Elke cascade-command (create/update/submit/approve/reject
// prestatie, submit/approve/reject/credit factuur, confirmPayment, signContract) bevriest bij een
// open dispuut via `assertNotDisputed` / `disputeGuardCollaborationId`. Gevolg: een partij kon een
// bevroren (disputedAt gezet) deal unilateraal op COMPLETED zetten — `cascadeStage` evalueert
// COMPLETED vóór disputed, dus de fase-badge maskeerde het open dispuut tijdens een admin-only hold.
//
// Fix: een pre-transactionele én een in-transactie (TOCTOU-dichte) dispuut-vries; alleen de admin
// heft het dispuut op (`resolveDispute`), daarna hervat de cascade. Deze test is rood zonder de vries.

import { describe, it, expect, vi, beforeEach } from "vitest";

const actor = { id: "company-user", role: "CLIENT", status: "ACTIVE" };

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => actor),
  requireRole: vi.fn(async () => actor),
  AuthorizationError: class AuthorizationError extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const state = vi.hoisted(() => ({
  collaboration: null as unknown,
  txDisputedAt: null as Date | null,
  updateManyCount: 1,
  updateManyCalled: 0,
}));

vi.mock("@/lib/db", () => {
  const tx = {
    invoice: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null) },
    performance: { count: vi.fn(async () => 0) },
    collaboration: {
      // In-transactie her-lees voor de dispuut-vries (TOCTOU).
      findUnique: vi.fn(async () => ({ disputedAt: state.txDisputedAt })),
      updateMany: vi.fn(async () => {
        state.updateManyCalled += 1;
        return { count: state.updateManyCount };
      }),
    },
    notification: { create: vi.fn(async () => ({})) },
    auditLog: { create: vi.fn(async () => ({})) },
    job: { update: vi.fn(async () => ({})) },
  };
  return {
    prisma: {
      collaboration: { findUnique: vi.fn(async () => state.collaboration) },
      invoice: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null) },
      performance: { count: vi.fn(async () => 0) },
      $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    },
  };
});

const { changeCollaborationStatus, cancelCollaboration } = await import("./actions");

function cancelForm(reason = "Opdracht vervalt volledig") {
  const fd = new FormData();
  fd.set("reason", reason);
  return fd;
}

function activeCollaboration(disputedAt: Date | null) {
  return {
    id: "collab-1",
    status: "ACTIVE",
    startDate: new Date("2026-01-01"),
    disputedAt,
    company: { userId: "company-user" },
    freelancer: { userId: "freelancer-user" },
    job: { id: "job-1", status: "CLOSED", title: "Testklus" },
  };
}

beforeEach(() => {
  state.collaboration = activeCollaboration(null);
  state.txDisputedAt = null;
  state.updateManyCount = 1;
  state.updateManyCalled = 0;
});

describe("changeCollaborationStatus / cancelCollaboration — dispuut-vries", () => {
  it("weigert afronden van een bevroren (disputed) samenwerking (pre-check)", async () => {
    state.collaboration = activeCollaboration(new Date("2026-07-01T00:00:00Z"));

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).rejects.toThrow(/dispuut/i);
    expect(state.updateManyCalled).toBe(0);
  });

  it("weigert annuleren van een bevroren (disputed) samenwerking (pre-check)", async () => {
    state.collaboration = activeCollaboration(new Date("2026-07-01T00:00:00Z"));

    const result = await cancelCollaboration("collab-1", undefined, cancelForm());
    expect(result?.error).toMatch(/dispuut/i);
    expect(state.updateManyCalled).toBe(0);
  });

  it("weigert afronden als een dispuut BINNEN de transactie opduikt (TOCTOU-race)", async () => {
    // Pre-check schoon, maar tijdens de transactie is een dispuut geopend.
    state.collaboration = activeCollaboration(null);
    state.txDisputedAt = new Date("2026-07-01T00:00:00Z");

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).rejects.toThrow(/dispuut/i);
    expect(state.updateManyCalled).toBe(0);
  });

  it("rondt af als er geen dispuut is (gelukkige pad blijft werken)", async () => {
    state.collaboration = activeCollaboration(null);
    state.txDisputedAt = null;

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).resolves.toBeUndefined();
    expect(state.updateManyCalled).toBe(1);
  });
});
