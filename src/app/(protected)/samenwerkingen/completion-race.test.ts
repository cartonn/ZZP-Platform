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
const { changeCollaborationStatus, cancelCollaboration } = await import("./actions");

function cancelForm(reason = "Opdracht vervalt volledig") {
  const fd = new FormData();
  fd.set("reason", reason);
  return fd;
}

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

// Regressietest voor de annuleer-rem (persona-sweep 2026-07-18, run 36).
//
// Defect (HIGH, DOEL 2 — verboden statusovergang / geld-correctheid): de annuleer-rem checkte alléén
// "openstaande" facturen (lifecycleStatus SUBMITTED/APPROVED/OVERDUE) — NIET een DRAFT-cascadefactuur
// en HELEMAAL geen ingediende (SUBMITTED) prestatie. Asymmetrisch met de afronden-rem. Zo kon een
// opdrachtgever een samenwerking annuleren terwijl er een ingediende prestatie in de wacht stond,
// die daarna alsnog goedgekeurd → gefactureerd → betaald kon worden (de downstream cascade-commando's
// checken de collaboration-status niet) — een volledige facturatiecascade op een geannuleerde deal.
//
// Fix: de annuleer-rem is nu symmetrisch met de afronden-rem (`cancellationBlockReason`): annuleren
// wordt geblokkeerd zolang er een niet-afgewikkelde factuur (óók DRAFT) of een SUBMITTED-prestatie is.
describe("cancelCollaboration — annuleer-rem symmetrisch met afronden (open werk blokkeert)", () => {
  it("weigert annuleren als er een ingediende prestatie op goedkeuring wacht", async () => {
    state.preCheckSubmitted = 1;

    const result = await cancelCollaboration("collab-1", undefined, cancelForm());
    expect(result?.error).toMatch(/beoordeel|goedkeuring/i);
  });

  it("weigert annuleren bij een niet-afgewikkelde DRAFT-cascadefactuur (open geld)", async () => {
    // Een DRAFT-cascadefactuur (lifecycleStatus DRAFT) is NIET afgewikkeld → moet blokkeren. De oude,
    // enge check (outstandingInvoiceWhere) miste deze status volledig.
    state.preCheckInvoices = [{ lifecycleStatus: "DRAFT", status: "DRAFT" }];

    const result = await cancelCollaboration("collab-1", undefined, cancelForm());
    expect(result?.error).toMatch(/factuur.*open|open.*factuur/i);
  });

  it("weigert annuleren als er BINNEN de transactie alsnog een prestatie opduikt (TOCTOU-race)", async () => {
    state.preCheckSubmitted = 0;
    state.txSubmitted = 1;

    const result = await cancelCollaboration("collab-1", undefined, cancelForm());
    expect(result?.error).toMatch(/beoordeel|goedkeuring/i);
  });

  it("annuleert als er geen open werk is (voorwaardelijke write op status ACTIVE → CANCELLED)", async () => {
    state.preCheckInvoices = [];
    state.preCheckSubmitted = 0;
    state.updateManyCount = 1;

    const result = await cancelCollaboration("collab-1", undefined, cancelForm());
    expect(result).toBeUndefined();

    const args = state.updateManyArgs as {
      where: { id: string; status: string };
      data: { status: string; cancellationReason?: string };
    };
    expect(args.where).toMatchObject({ id: "collab-1", status: "ACTIVE" });
    expect(args.data.status).toBe("CANCELLED");
    expect(args.data.cancellationReason).toBe("Opdracht vervalt volledig");
  });

  it("laat een reeds AFGEWIKKELDE (PAID) factuur annuleren toe (geen vals-positief)", async () => {
    // Een PAID-cascadefactuur is afgewikkeld → mag annuleren niet blokkeren.
    state.preCheckInvoices = [{ lifecycleStatus: "PAID", status: "DRAFT" }];
    state.preCheckSubmitted = 0;

    const result = await cancelCollaboration("collab-1", undefined, cancelForm());
    expect(result).toBeUndefined();
  });
});
