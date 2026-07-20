// Dispuut-vries op signContract (defense-in-depth / consistentie — persona-sweep 2026-07-20, run 40).
//
// Defect (LOW, DOEL 2 — freeze-bypass): `signContract` (event A, contract getekend) las `disputedAt`
// NIET en gaf géén `disputeGuardCollaborationId` mee aan `persistEventAndEffects`. Elke andere
// cascade-command bevriest bij een open dispuut. `openDispute` staat een dispuut op een PROPOSED
// samenwerking toe (geen status-check), dus: dispuut openen → signContract → PROPOSED→ACTIVE op een
// bevroren deal. De downstream cascade bevriest daarna wél, dus de impact bleef bij die ene
// contract-/statusstap — maar het is een landmijn tegen de invariant "dispuut bevriest de cascade".
//
// Fix: pre-transactionele dispuut-vries + `disputeGuardCollaborationId` (in-transactie TOCTOU-grendel).
// Deze test is rood zonder de pre-check.

import { describe, it, expect, vi, beforeEach } from "vitest";

let collabDisputedAt: Date | null = null;

const persistMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn().mockImplementation(async () => ({
        id: "col-1",
        status: "PROPOSED",
        disputedAt: collabDisputedAt,
        freelancer: { userId: "f1", credentials: [] },
        company: { userId: "c1" },
        job: { title: "Testklus", credentialRequirements: [] },
      })),
    },
  },
}));

vi.mock("@/lib/cascade/commands-shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cascade/commands-shared")>();
  return { ...actual, persistEventAndEffects: persistMock };
});

// Mail is best-effort; stub zodat de test geen echte sender raakt.
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn(async () => undefined) }),
}));

const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

beforeEach(() => {
  collabDisputedAt = null;
  persistMock.mockClear();
});

describe("signContract — dispuut-vries", () => {
  it("weigert het ondertekenen van een bevroren (disputed) samenwerking", async () => {
    collabDisputedAt = new Date("2026-07-01T00:00:00Z");
    const { signContract } = await import("@/lib/cascade/contract-commands");
    await expect(signContract(FREELANCER, "col-1")).rejects.toThrow(/dispuut/i);
    expect(persistMock).not.toHaveBeenCalled();
  });

  it("bedraadt de in-transactie dispuut-grendel (disputeGuardCollaborationId) op het gelukkige pad", async () => {
    const { signContract } = await import("@/lib/cascade/contract-commands");
    await expect(signContract(FREELANCER, "col-1")).resolves.toBeUndefined();
    expect(persistMock).toHaveBeenCalledTimes(1);
    const refs = persistMock.mock.calls[0]?.[2] as { disputeGuardCollaborationId?: string };
    expect(refs.disputeGuardCollaborationId).toBe("col-1");
  });
});
