// TOCTOU-grendel op resolveDispute (DOEL 2 — status-/audit-integriteit onder concurrency;
// persona-sweep 2026-07-28, run 56).
//
// Defect (MED, CLAUDE.md regel 5 — audit alles wat telt, exact één keer per reëel event): `resolveDispute`
// las `col.disputedAt` één keer (stale snapshot) en deed daarna in een APARTE array-`$transaction` een
// onvoorwaardelijke `collaboration.update({ where: { id } })` — géén compound-guard. Twee admins (of één
// admin die het formulier dubbel verstuurt) die gelijktijdig oplossen, passeren beiden de pre-check en
// schrijven beiden hun EIGEN `DISPUTE_RESOLVED` domein-event, audit-rij én twee notificaties → dubbele
// audit-/event-rijen voor één dispuut + dubbele meldingen aan beide partijen. De zuster `openDispute`
// gebruikt al de compound-guarded `updateMany`-idioom; dit pad niet.
//
// Fix: interactieve transactie met compound-guarded `updateMany({ where: { id, disputedAt: { not: null } } })`.
// Verloren race → count 0 → hele transactie rolt terug (geen tweede event/notificatie/audit). Deze test drijft
// de callback ván $transaction zelf, zodat de compound-guard daadwerkelijk wordt uitgeoefend.

import { describe, it, expect, vi, beforeEach } from "vitest";

// De rij zoals de PRE-check hem ziet (nog disputed) — bewust ANDERS dan wat de transactie ziet, om de race
// te simuleren: tussen pre-check en write heeft een concurrente resolve `disputedAt` al op null gezet.
let preCheckDisputedAt: Date | null = new Date("2026-07-28T00:00:00Z");

// De uitkomst van de compound-guarded updateMany binnen de transactie (0 = race verloren, 1 = gewonnen).
let clearedCount = 1;

const updateMany = vi.fn(async (_args: { where?: unknown; data?: unknown }) => ({
  count: clearedCount,
}));
const domainEventCreate = vi.fn(async () => ({}));
const notificationCreate = vi.fn(async () => ({}));
const auditLogCreate = vi.fn(async () => ({}));

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn(async () => ({
        id: "col-1",
        disputedAt: preCheckDisputedAt,
        freelancer: { userId: "f1" },
        company: { userId: "c1" },
      })),
    },
    // Interactieve $transaction: draai de callback met een tx-mock die de guard-uitkomst modelleert.
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        collaboration: { updateMany },
        domainEvent: { create: domainEventCreate },
        notification: { create: notificationCreate },
        auditLog: { create: auditLogCreate },
      }),
    ),
  },
}));

const ADMIN = { id: "admin-1", role: "ADMIN" as const, status: "ACTIVE" };
const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

beforeEach(() => {
  preCheckDisputedAt = new Date("2026-07-28T00:00:00Z");
  clearedCount = 1;
  updateMany.mockClear();
  domainEventCreate.mockClear();
  notificationCreate.mockClear();
  auditLogCreate.mockClear();
});

describe("resolveDispute — TOCTOU compound-guard", () => {
  it("alleen een admin mag oplossen (rolrem vóór alles)", async () => {
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(resolveDispute(FREELANCER, "col-1")).rejects.toThrow(/platform/i);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("verloren race (concurrente resolve won): geen tweede event/notificatie/audit, transactie rolt terug", async () => {
    // Pre-check ziet nog disputed, maar de compound-guarded updateMany matcht 0 (een concurrente resolve
    // heeft disputedAt al op null gezet vóór onze write).
    clearedCount = 0;
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(resolveDispute(ADMIN, "col-1")).rejects.toThrow(/geen open dispuut/i);
    expect(updateMany).toHaveBeenCalledTimes(1);
    // De guard-where moet id + disputedAt-not-null zijn (kan niet driften naar id-only).
    expect(updateMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: "col-1", disputedAt: { not: null } },
    });
    expect(domainEventCreate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it("gewonnen race (count 1): schrijft één event, twee notificaties (beide partijen) en één audit weg", async () => {
    clearedCount = 1;
    const { resolveDispute } = await import("@/lib/cascade/dispute-commands");
    await expect(resolveDispute(ADMIN, "col-1")).resolves.toBeUndefined();
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(domainEventCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(2);
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
  });
});
