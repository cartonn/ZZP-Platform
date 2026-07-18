// TOCTOU-regressietest voor de handmatige samenwerking-afronding (persona-sweep 2026-07-18).
//
// Defect: `applyCollaborationStatusChange` (via changeCollaborationStatus) berekende de
// afronden-/annuleer-rem met een LOSSE, niet-transactionele lees vóór een ONVOORWAARDELIJKE
// `collaboration.update`. Een parallelle actie tussen die pre-check en de write (de tegenpartij
// dient een prestatie in, of er verschijnt een nieuwe factuur) kon zo een samenwerking op COMPLETED
// zetten terwijl er nog open geld of een onbeoordeelde prestatie is — een verboden statusovergang
// (CLAUDE.md: "afronden met open geld/onbeoordeelde prestatie moet onmogelijk zijn").
//
// De fix her-verifieert de rem BINNEN de transactie en maakt de statuswrite voorwaardelijk op de
// verwachte `from`-status (optimistic concurrency). Deze tests simuleren de race door de
// transactie-client andere lees-uitkomsten te laten teruggeven dan de pre-check.

import { describe, it, expect, vi, beforeEach } from "vitest";

const actor = { id: "company-user", role: "CLIENT", status: "ACTIVE" };

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => actor),
  requireRole: vi.fn(async () => actor),
  AuthorizationError: class AuthorizationError extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// De prisma-mock is per-test instelbaar: `preCheck` bedient de losse pre-check-lezingen op
// `prisma.*`, `inTx` bedient de her-verificatie binnen `$transaction(async (tx) => ...)`.
const state = vi.hoisted(() => ({
  collaboration: null as unknown,
  preCheckSubmitted: 0,
  preCheckInvoices: [] as unknown[],
  txSubmitted: 0,
  txInvoices: [] as unknown[],
  updateManyCount: 1,
  updateManyArgs: null as unknown,
}));

vi.mock("@/lib/db", () => {
  const invoiceFindMany = vi.fn(async () => state.preCheckInvoices);
  const invoiceFindFirst = vi.fn(async () => null);
  const performanceCount = vi.fn(async () => state.preCheckSubmitted);
  const collaborationFindUnique = vi.fn(async () => state.collaboration);

  const tx = {
    invoice: {
      findMany: vi.fn(async () => state.txInvoices),
      findFirst: vi.fn(async () => null),
    },
    performance: { count: vi.fn(async () => state.txSubmitted) },
    collaboration: {
      updateMany: vi.fn(async (args: unknown) => {
        state.updateManyArgs = args;
        return { count: state.updateManyCount };
      }),
    },
    notification: { create: vi.fn(async () => ({})) },
    auditLog: { create: vi.fn(async () => ({})) },
    job: { update: vi.fn(async () => ({})) },
  };

  return {
    prisma: {
      collaboration: { findUnique: collaborationFindUnique },
      invoice: { findMany: invoiceFindMany, findFirst: invoiceFindFirst },
      performance: { count: performanceCount },
      $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    },
  };
});

// Import ná de mocks.
const { changeCollaborationStatus } = await import("./actions");

function activeCollaboration() {
  return {
    id: "collab-1",
    status: "ACTIVE",
    startDate: new Date("2026-01-01"),
    company: { userId: "company-user" },
    freelancer: { userId: "freelancer-user" },
    job: { id: "job-1", status: "CLOSED", title: "Testklus" },
  };
}

beforeEach(() => {
  state.collaboration = activeCollaboration();
  state.preCheckSubmitted = 0;
  state.preCheckInvoices = [];
  state.txSubmitted = 0;
  state.txInvoices = [];
  state.updateManyCount = 1;
  state.updateManyArgs = null;
});

describe("changeCollaborationStatus — TOCTOU-hardening bij afronden", () => {
  it("weigert afronden als er BINNEN de transactie alsnog een ingediende prestatie opduikt (race)", async () => {
    // Pre-check schoon (geen open werk), maar tijdens de transactie is een prestatie ingediend.
    state.preCheckSubmitted = 0;
    state.txSubmitted = 1;

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).rejects.toThrow(
      /beoordeel|goedkeuring/i,
    );
  });

  it("weigert afronden als er BINNEN de transactie alsnog een open factuur opduikt (race)", async () => {
    state.preCheckInvoices = [];
    // Cascade-factuur die nog niet is afgewikkeld (APPROVED = open geld).
    state.txInvoices = [{ lifecycleStatus: "APPROVED", status: "DRAFT" }];

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).rejects.toThrow(
      /factuur.*open|open.*factuur/i,
    );
  });

  it("weigert afronden als de samenwerking intussen van status wisselde (updateMany count 0)", async () => {
    state.updateManyCount = 0;

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).rejects.toThrow(
      /intussen gewijzigd/i,
    );
  });

  it("rondt af én stempelt completedAt als alles schoon is (voorwaardelijke write, count 1)", async () => {
    state.updateManyCount = 1;

    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).resolves.toBeUndefined();

    const args = state.updateManyArgs as {
      where: { id: string; status: string };
      data: { status: string; completedAt?: Date };
    };
    // Voorwaardelijk op de verwachte `from`-status (ACTIVE) — optimistic concurrency.
    expect(args.where).toMatchObject({ id: "collab-1", status: "ACTIVE" });
    expect(args.data.status).toBe("COMPLETED");
    expect(args.data.completedAt).toBeInstanceOf(Date);
  });
});
