// Terminale-status-rem op de forward-cascade (defense-in-depth, spiegelt de dispuut-bevriezing). Een
// forward-command (indienen/goedkeuren/betalen) mag de facturatiecascade niet voortzetten op een
// geannuleerde (CANCELLED) — of, waar niet expliciet toegestaan, afgeronde (COMPLETED) — samenwerking.
// Dekt de pure oordeelsfunctie, de pre-transactionele lees én de in-transactie TOCTOU-grendel.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { emptyEffects } from "@/lib/cascade/types";
import type { DomainEventInput } from "@/lib/events";

const collaborationFindUnique = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique: (...a: unknown[]) => collaborationFindUnique(...a) },
    domainEvent: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

const applyMock = vi.fn().mockResolvedValue({});
vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: applyMock }));

// Installeert een fake-transactie waarin de her-verificatie-lees `disputedAt` + `status` teruggeeft.
function installTx(status: string, disputedAt: Date | null = null) {
  mockTransaction.mockReset();
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const fakeTx = {
      collaboration: { findUnique: vi.fn().mockResolvedValue({ disputedAt, status }) },
      domainEvent: { create: vi.fn().mockResolvedValue({ id: "event-1" }) },
      eventHandlerRun: { create: vi.fn().mockResolvedValue({}) },
    };
    return fn(fakeTx);
  });
}

const eventInput: DomainEventInput = {
  type: "PERFORMANCE_SUBMITTED",
  actorRole: "FREELANCER",
  actorId: "f1",
  subjectType: "Performance",
  subjectId: "perf-1",
};
const owners = { FREELANCER: "f1", CLIENT: "c1" };

describe("terminalCollaborationError — pure oordeelsfunctie", () => {
  it("weigert een geannuleerde samenwerking (altijd)", async () => {
    const { terminalCollaborationError } = await import("@/lib/cascade/commands-shared");
    expect(terminalCollaborationError("CANCELLED")?.message).toMatch(/geannuleerd/);
    // Ook met allowCompleted blijft CANCELLED geweigerd.
    expect(terminalCollaborationError("CANCELLED", { allowCompleted: true })?.message).toMatch(
      /geannuleerd/,
    );
  });

  it("weigert een afgeronde samenwerking tenzij expliciet toegestaan", async () => {
    const { terminalCollaborationError } = await import("@/lib/cascade/commands-shared");
    expect(terminalCollaborationError("COMPLETED")?.message).toMatch(/afgerond/);
    expect(terminalCollaborationError("COMPLETED", { allowCompleted: true })).toBeNull();
  });

  it("laat een actieve/voorgestelde samenwerking door", async () => {
    const { terminalCollaborationError } = await import("@/lib/cascade/commands-shared");
    expect(terminalCollaborationError("ACTIVE")).toBeNull();
    expect(terminalCollaborationError("PROPOSED")).toBeNull();
  });
});

describe("assertCollaborationNotTerminal — pre-transactionele lees", () => {
  beforeEach(() => collaborationFindUnique.mockReset());

  it("werpt bij CANCELLED", async () => {
    collaborationFindUnique.mockResolvedValue({ status: "CANCELLED" });
    const { assertCollaborationNotTerminal } = await import("@/lib/cascade/commands-shared");
    await expect(assertCollaborationNotTerminal("col-1")).rejects.toThrow(/geannuleerd/);
  });

  it("werpt bij COMPLETED zonder allowCompleted", async () => {
    collaborationFindUnique.mockResolvedValue({ status: "COMPLETED" });
    const { assertCollaborationNotTerminal } = await import("@/lib/cascade/commands-shared");
    await expect(assertCollaborationNotTerminal("col-1")).rejects.toThrow(/afgerond/);
  });

  it("staat COMPLETED toe met allowCompleted", async () => {
    collaborationFindUnique.mockResolvedValue({ status: "COMPLETED" });
    const { assertCollaborationNotTerminal } = await import("@/lib/cascade/commands-shared");
    await expect(
      assertCollaborationNotTerminal("col-1", { allowCompleted: true }),
    ).resolves.toBeUndefined();
  });

  it("laat ACTIVE door en werpt niet bij een ontbrekende samenwerking", async () => {
    collaborationFindUnique.mockResolvedValueOnce({ status: "ACTIVE" });
    const { assertCollaborationNotTerminal } = await import("@/lib/cascade/commands-shared");
    await expect(assertCollaborationNotTerminal("col-1")).resolves.toBeUndefined();
    collaborationFindUnique.mockResolvedValueOnce(null);
    await expect(assertCollaborationNotTerminal("missing")).resolves.toBeUndefined();
  });
});

describe("terminalGuard — in-transactie TOCTOU-grendel", () => {
  beforeEach(() => applyMock.mockClear());

  it("rolt terug als de samenwerking BINNEN de transactie geannuleerd blijkt", async () => {
    installTx("CANCELLED");
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await expect(
      persistEventAndEffects(eventInput, emptyEffects(), {
        owners,
        disputeGuardCollaborationId: "col-1",
        terminalGuard: true,
      }),
    ).rejects.toThrow(/geannuleerd/);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("rolt terug bij COMPLETED zonder terminalGuardAllowCompleted", async () => {
    installTx("COMPLETED");
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await expect(
      persistEventAndEffects(eventInput, emptyEffects(), {
        owners,
        disputeGuardCollaborationId: "col-1",
        terminalGuard: true,
      }),
    ).rejects.toThrow(/afgerond/);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("laat COMPLETED door met terminalGuardAllowCompleted (betaal-tak)", async () => {
    installTx("COMPLETED");
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await persistEventAndEffects(eventInput, emptyEffects(), {
      owners,
      disputeGuardCollaborationId: "col-1",
      terminalGuard: true,
      terminalGuardAllowCompleted: true,
    });
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("laat een ACTIVE samenwerking door", async () => {
    installTx("ACTIVE");
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await persistEventAndEffects(eventInput, emptyEffects(), {
      owners,
      disputeGuardCollaborationId: "col-1",
      terminalGuard: true,
    });
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("zonder terminalGuard-vlag wordt de status niet gecheckt (achterwaarts compatibel)", async () => {
    installTx("CANCELLED");
    const { persistEventAndEffects } = await import("@/lib/cascade/commands-shared");
    await persistEventAndEffects(eventInput, emptyEffects(), {
      owners,
      disputeGuardCollaborationId: "col-1",
    });
    expect(applyMock).toHaveBeenCalledTimes(1);
  });
});
