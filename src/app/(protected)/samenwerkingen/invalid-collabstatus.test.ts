// Unit-tests voor changeCollaborationStatus — robuustheid van de doelstatus-invoer (DOEL-2). Een
// geknutselde POST met een `target` buiten de CollaborationStatus-enum mag geen ongevangen ZodError →
// generieke 500 geven, maar een nette afwijzing die de DB niet raakt. Daarnaast blijft de bestaande
// special-case gelden (CANCELLED loopt uitsluitend via cancelCollaboration). Een geldige, niet-annuleer
// status passeert de safeParse-poort en bereikt applyCollaborationStatusChange (prisma-lookup). Prisma,
// authz, audit en de overige libs gemockt; @/lib/enums is bewust ECHT.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "user-1", role: "CLIENT", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
};

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@prisma/client", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));
vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => store.actor),
  requireRole: vi.fn(async () => store.actor),
  AuthorizationError: class extends Error {},
}));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d) => d) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique: findUniqueMock, updateMany: vi.fn(), findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/collaborations", () => ({
  assertCollaborationTransition: vi.fn(),
  CollaborationTransitionError: class extends Error {},
}));
vi.mock("@/lib/jobs", () => ({ assertJobTransition: vi.fn() }));
vi.mock("@/lib/replacement", () => ({
  planReplacement: vi.fn(() => ({ reopenJob: false, signal: false })),
}));
vi.mock("@/lib/administration/outstanding", () => ({ outstandingInvoiceWhere: {} }));
vi.mock("@/lib/cascade/completion", () => ({ completionBlockReason: vi.fn(() => null) }));
vi.mock("@/lib/cascade/commands", () => ({
  signContract: vi.fn(),
  CascadeError: class extends Error {},
}));
vi.mock("@/lib/cancellation", () => ({
  assessCancellation: vi.fn(() => ({ chargeable: false })),
}));
vi.mock("@/lib/validation", () => ({
  collaborationProposalSchema: { safeParse: vi.fn() },
  collaborationCancellationSchema: { safeParse: vi.fn() },
}));
vi.mock("@/lib/collaboration-alerts", () => ({
  assessCollaborationCredentials: vi.fn(() => ({ missing: [], expired: [] })),
}));
vi.mock("@/lib/collaboration-reminder", () => ({
  reminderDayStart: vi.fn(() => new Date()),
  credentialReminderLink: vi.fn(() => ""),
  credentialReminderMessage: vi.fn(() => ({ title: "", body: "" })),
}));

import { changeCollaborationStatus } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
});

describe("changeCollaborationStatus — doelstatus-validatie", () => {
  it("weigert een doelstatus buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(changeCollaborationStatus("collab-1", "HACKED")).rejects.toThrow(
      "Ongeldige doelstatus.",
    );
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("blokkeert het annuleer-pad: CANCELLED vereist de annuleerknop, zónder de DB te raken", async () => {
    // CANCELLED is een geldige enum-waarde maar loopt uitsluitend via cancelCollaboration (reden
    // verplicht). De special-case throwt vóór applyCollaborationStatusChange.
    await expect(changeCollaborationStatus("collab-1", "CANCELLED")).rejects.toThrow(
      "Annuleren vereist een reden — gebruik de annuleerknop.",
    );
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("laat een geldige niet-annuleer status door tot applyCollaborationStatusChange (hier: niet gevonden)", async () => {
    // "COMPLETED" passeert de safeParse-poort én de CANCELLED-special-case en bereikt de lookup.
    await expect(changeCollaborationStatus("collab-1", "COMPLETED")).rejects.toThrow(
      "Samenwerking niet gevonden.",
    );
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
