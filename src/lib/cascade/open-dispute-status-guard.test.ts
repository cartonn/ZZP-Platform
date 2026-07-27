// Server-side statusrem op openDispute (DOEL 2 — client-side-only gate op een echte mutatie;
// persona-sweep 2026-07-27).
//
// Defect (LOW→MED, CLAUDE.md regel 1 — "client mag tonen, nooit beslissen"): de UI toont het
// dispuut-formulier alléén bij een ACTIVE samenwerking (`active && …` in
// samenwerkingen/[id]/page.tsx), maar `openDispute` borgde die regel NIET server-side — het las alleen
// `disputedAt`, niet `status`. Een partij kon `openDisputeAction` rechtstreeks aanroepen op een
// PROPOSED/COMPLETED/CANCELLED samenwerking:
//   - COMPLETED → zet `disputedAt` en blokkeert eenzijdig de correctie-/creditfactuur-route
//     (`creditInvoice` checkt `assertNotDisputed`) op een reeds betaalde klus — een griefing-vector;
//   - PROPOSED → landmijn (dispuut → signContract op een bevroren deal; zie contract-dispute-freeze,
//     run 40 dekte alleen de downstream-command af, niet de bron);
//   - CANCELLED → no-op vlag zonder cascade om te bevriezen.
//
// Fix: `openDispute` weigert nu hard tenzij `status === "ACTIVE"`. Deze test is rood zonder die guard.

import { describe, it, expect, vi, beforeEach } from "vitest";

let collabStatus = "ACTIVE";
let collabDisputedAt: Date | null = null;

const txMock = vi.fn().mockResolvedValue(undefined);

// De array-vorm van $transaction bouwt eerst elke operatie (collaboration.update, domainEvent.create,
// …) op en geeft de array dan aan $transaction; die writers moeten dus ook bestaan als stub.
const stubOp = () => vi.fn().mockReturnValue({});

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn().mockImplementation(async () => ({
        id: "col-1",
        status: collabStatus,
        disputedAt: collabDisputedAt,
        freelancer: { userId: "f1" },
        company: { userId: "c1" },
        job: { title: "Testklus" },
      })),
      update: stubOp(),
    },
    domainEvent: { create: stubOp() },
    notification: { create: stubOp() },
    auditLog: { create: stubOp() },
    user: { findMany: vi.fn().mockResolvedValue([{ id: "admin-1" }]) },
    $transaction: txMock,
  },
}));

const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

beforeEach(() => {
  collabStatus = "ACTIVE";
  collabDisputedAt = null;
  txMock.mockClear();
});

describe("openDispute — server-side statusrem", () => {
  it.each(["PROPOSED", "COMPLETED", "CANCELLED"])(
    "weigert een dispuut op een %s samenwerking (geen write)",
    async (status) => {
      collabStatus = status;
      const { openDispute } = await import("@/lib/cascade/dispute-commands");
      await expect(openDispute(FREELANCER, "col-1", "reden")).rejects.toThrow(
        /actieve samenwerking/i,
      );
      expect(txMock).not.toHaveBeenCalled();
    },
  );

  it("staat een dispuut op een ACTIVE samenwerking toe (schrijft de transactie weg)", async () => {
    collabStatus = "ACTIVE";
    const { openDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(openDispute(FREELANCER, "col-1", "reden")).resolves.toBeUndefined();
    expect(txMock).toHaveBeenCalledTimes(1);
  });

  it("weigert nog steeds een al-lopend dispuut op een ACTIVE samenwerking", async () => {
    collabStatus = "ACTIVE";
    collabDisputedAt = new Date("2026-07-01T00:00:00Z");
    const { openDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(openDispute(FREELANCER, "col-1", "reden")).rejects.toThrow(/al een open dispuut/i);
    expect(txMock).not.toHaveBeenCalled();
  });
});
