// TOCTOU-grendel op openDispute (DOEL 2 — financiële/statusintegriteit onder concurrency;
// persona-sweep 2026-07-28, run 55).
//
// Defect (HIGH, CLAUDE.md regel 3 — statusovergangen via een atomair-afgedwongen rem): de statusrem in
// `openDispute` (run 53) las een STALE snapshot (`col.status`), en tussen die lees en de write lag nog een
// awaited admin-`findMany`. In dat venster kan een concurrente, compound-guarded mutatie
// (`confirmPayment` ACTIVE→COMPLETED, of `cancelCollaboration` ACTIVE→CANCELLED) éérst committen; de
// oude blinde `collaboration.update({ where: { id } })` zette `disputedAt` dan alsnog op de niet-ACTIVE
// rij. Op COMPLETED blokkeert dat de correctie-/creditfactuur-route (`creditInvoice` → `assertNotDisputed`)
// permanent — een griefing-vector, bereikbaar door twee partijen (of één partij met twee tabs) rond het
// moment van eindbetaling/annulering.
//
// Fix: interactieve transactie met compound-guarded `updateMany({ where: { id, status: "ACTIVE",
// disputedAt: null } })`. Verloren race → count 0 → hele transactie rolt terug (geen event/notificaties/
// audit). Deze test drijft de callback ván $transaction zelf (anders dan de status-guard-test, die alleen
// de pre-transactionele rem test), zodat de compound-guard daadwerkelijk wordt uitgeoefend.

import { describe, it, expect, vi, beforeEach } from "vitest";

// De rij zoals de PRE-check hem ziet (nog ACTIVE) — bewust ANDERS dan wat de transactie ziet, om de race
// te simuleren: tussen pre-check en write is de samenwerking COMPLETED geworden.
let preCheckStatus = "ACTIVE";
let preCheckDisputedAt: Date | null = null;

// De uitkomst van de compound-guarded updateMany binnen de transactie (0 = race verloren, 1 = gewonnen)
// en wat de her-lees binnen de transactie teruggeeft.
let claimedCount = 1;
let inTxStatus = "ACTIVE";
let inTxDisputedAt: Date | null = null;

const updateMany = vi.fn(async (_args: { where?: unknown; data?: unknown }) => ({
  count: claimedCount,
}));
const txFindUnique = vi.fn(async () => ({ status: inTxStatus, disputedAt: inTxDisputedAt }));
const domainEventCreate = vi.fn(async () => ({}));
const notificationCreate = vi.fn(async () => ({}));
const auditLogCreate = vi.fn(async () => ({}));

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn(async () => ({
        id: "col-1",
        status: preCheckStatus,
        disputedAt: preCheckDisputedAt,
        freelancer: { userId: "f1" },
        company: { userId: "c1" },
        job: { title: "Testklus" },
      })),
    },
    user: { findMany: vi.fn(async () => [{ id: "admin-1" }]) },
    // Interactieve $transaction: draai de callback met een tx-mock die de guard-uitkomst modelleert.
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        collaboration: { updateMany, findUnique: txFindUnique },
        domainEvent: { create: domainEventCreate },
        notification: { create: notificationCreate },
        auditLog: { create: auditLogCreate },
      }),
    ),
  },
}));

const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

beforeEach(() => {
  preCheckStatus = "ACTIVE";
  preCheckDisputedAt = null;
  claimedCount = 1;
  inTxStatus = "ACTIVE";
  inTxDisputedAt = null;
  updateMany.mockClear();
  txFindUnique.mockClear();
  domainEventCreate.mockClear();
  notificationCreate.mockClear();
  auditLogCreate.mockClear();
});

describe("openDispute — TOCTOU compound-guard", () => {
  it("verloren race (samenwerking net COMPLETED): geen event/notificatie/audit, hele transactie rolt terug", async () => {
    // Pre-check ziet nog ACTIVE, maar de compound-guarded updateMany matcht 0 (een concurrente
    // confirmPayment heeft ACTIVE→COMPLETED al gecommit vóór onze write).
    preCheckStatus = "ACTIVE";
    claimedCount = 0;
    inTxStatus = "COMPLETED";
    inTxDisputedAt = null;
    const { openDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(openDispute(FREELANCER, "col-1", "reden")).rejects.toThrow(
      /actieve samenwerking/i,
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
    // De guard-where moet id + status ACTIVE + disputedAt null zijn (kan niet driften naar id-only).
    expect(updateMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "col-1", status: "ACTIVE", disputedAt: null },
    });
    expect(domainEventCreate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it("verloren race door een net-geopend concurrent dispuut: meldt 'al een open dispuut', geen write", async () => {
    preCheckStatus = "ACTIVE";
    claimedCount = 0;
    inTxStatus = "ACTIVE";
    inTxDisputedAt = new Date("2026-07-28T00:00:00Z");
    const { openDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(openDispute(FREELANCER, "col-1", "reden")).rejects.toThrow(/al een open dispuut/i);
    expect(domainEventCreate).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it("gewonnen race (count 1): schrijft event, tegenpartij- + admin-notificatie en audit weg", async () => {
    claimedCount = 1;
    const { openDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(openDispute(FREELANCER, "col-1", "reden")).resolves.toBeUndefined();
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(domainEventCreate).toHaveBeenCalledTimes(1);
    // tegenpartij (c1) + één admin
    expect(notificationCreate).toHaveBeenCalledTimes(2);
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
  });
});
