// Her-voorstel-branch van `proposeCollaboration`: een opdrachtgever mag een vóór ondertekening
// geannuleerd voorstel opnieuw voorstellen op dezelfde @unique-reactie. Deze test bewijst de drie
// paden: (a) herbruikbaar geannuleerd voorstel → compound-guarded reset (count 1) + audit
// COLLABORATION_REPROPOSED; (b) TOCTOU (updateMany count 0) → nette weigering, geen create; (c) geen
// bestaande collaboration → val door naar create met audit COLLABORATION_PROPOSED.

import { describe, it, expect, vi, beforeEach } from "vitest";

const applicationFindUnique = vi.hoisted(() => vi.fn());
const collaborationFindUnique = vi.hoisted(() => vi.fn());
const collaborationUpdateMany = vi.hoisted(() => vi.fn());
const collaborationCreate = vi.hoisted(() => vi.fn());
const runTransaction = vi.hoisted(() => vi.fn(async () => {}));
const notificationCreate = vi.hoisted(() => vi.fn(() => ({ __op: "notify" })));
const auditLogCreate = vi.hoisted(() => vi.fn(() => ({ __op: "audit" })));

let currentActor: { id: string; role: string; status: string } = {
  id: "client-1",
  role: "CLIENT",
  status: "ACTIVE",
};

const AuthorizationError = vi.hoisted(() => class AuthorizationError extends Error {});

vi.mock("@/lib/authz", () => ({
  AuthorizationError,
  requireActor: vi.fn(async () => currentActor),
  requireRole: vi.fn(async (role: string) => {
    if (currentActor.role !== role) throw new AuthorizationError("Geen toegang.");
    return currentActor;
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("@/lib/db", () => ({
  prisma: {
    application: { findUnique: applicationFindUnique },
    collaboration: {
      findUnique: collaborationFindUnique,
      updateMany: collaborationUpdateMany,
      create: collaborationCreate,
    },
    auditLog: { create: auditLogCreate },
    notification: { create: notificationCreate },
    $transaction: runTransaction,
  },
}));
// De cascade-commands worden door actions.ts geïmporteerd; irrelevant voor deze test.
vi.mock("@/lib/cascade/commands", () => {
  class CascadeError extends Error {}
  const noop = vi.fn(async () => {});
  return { CascadeError, signContract: noop };
});

import { proposeCollaboration } from "./actions";
import {
  REPROPOSABLE_CANCELLED_WHERE,
  isReproposableCancelledProposal,
  type ProposalCollaborationState,
} from "@/lib/collaboration-reproposal";

/** Geaccepteerde reactie van deze opdrachtgever (ownership + status ACCEPTED voldaan). */
function acceptedApplication() {
  return {
    id: "app-1",
    status: "ACCEPTED",
    job: { id: "job-1", companyId: "comp-1", company: { userId: "client-1" } },
    freelancer: { id: "fl-1", userId: "zzp-1" },
  };
}

/** Een schoon, geannuleerd PROPOSED-voorstel — herbruikbaar. */
function reproposableState(): ProposalCollaborationState {
  return {
    status: "CANCELLED",
    contractStatus: "DRAFT",
    agreementClientSignedAt: null,
    agreementFreelancerSignedAt: null,
    completedAt: null,
    invoicesCount: 0,
    performancesCount: 0,
  };
}

/** Geldig proposal-formulier (tarief €50/u, geen datums). */
function proposalForm() {
  const fd = new FormData();
  fd.set("rate", "50");
  fd.set("startDate", "");
  fd.set("endDate", "");
  return fd;
}

beforeEach(() => {
  currentActor = { id: "client-1", role: "CLIENT", status: "ACTIVE" };
  applicationFindUnique.mockReset().mockResolvedValue(acceptedApplication());
  collaborationFindUnique.mockReset();
  collaborationUpdateMany.mockReset();
  collaborationCreate.mockReset();
  runTransaction.mockClear();
  notificationCreate.mockClear();
  auditLogCreate.mockClear();
});

describe("proposeCollaboration — her-voorstel", () => {
  it("(a) herbruikbaar geannuleerd voorstel → guarded reset (count 1), audit COLLABORATION_REPROPOSED", async () => {
    const state = reproposableState();
    collaborationFindUnique.mockResolvedValue({ id: "col-1", status: "CANCELLED" });
    // Faithful mock: honoreer de guard tegen de fixture-staat, exact zoals de DB zou doen.
    collaborationUpdateMany.mockImplementation(
      async ({ where }: { where: { applicationId: string } }) => {
        expect(where.applicationId).toBe("app-1");
        // De guard-velden moeten aanwezig zijn (dezelfde bron als de where-fragment-constante).
        expect(where).toMatchObject(REPROPOSABLE_CANCELLED_WHERE);
        return { count: isReproposableCancelledProposal(state) ? 1 : 0 };
      },
    );

    const result = await proposeCollaboration("app-1", undefined, proposalForm());

    expect(result).toBeUndefined();
    expect(collaborationUpdateMany).toHaveBeenCalledTimes(1);
    expect(collaborationCreate).not.toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "COLLABORATION_REPROPOSED",
          entityId: "col-1",
        }),
      }),
    );
  });

  it("(b) TOCTOU: updateMany count 0 → nette weigering, geen create/transactie", async () => {
    collaborationFindUnique.mockResolvedValue({ id: "col-1", status: "CANCELLED" });
    collaborationUpdateMany.mockResolvedValue({ count: 0 });

    const result = await proposeCollaboration("app-1", undefined, proposalForm());

    expect(result?.error).toBe("Er bestaat al een samenwerking voor deze reactie.");
    expect(collaborationCreate).not.toHaveBeenCalled();
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("(c) geen bestaande collaboration → create (happy path), audit COLLABORATION_PROPOSED", async () => {
    collaborationFindUnique.mockResolvedValue(null);
    collaborationCreate.mockResolvedValue({ id: "col-new" });

    const result = await proposeCollaboration("app-1", undefined, proposalForm());

    expect(result).toBeUndefined();
    expect(collaborationCreate).toHaveBeenCalledTimes(1);
    expect(collaborationUpdateMany).not.toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "COLLABORATION_PROPOSED",
          entityId: "col-new",
        }),
      }),
    );
  });
});
