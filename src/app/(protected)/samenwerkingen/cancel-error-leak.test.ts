// Unit-tests voor cancelCollaboration — foutlek-hardening (CWE-209 / OWASP A05:2021 Information
// Exposure). De catch mag geen rauwe Error.message woordelijk terug naar de client sturen: een
// onverwachte Prisma-/systeemfout kan kolom-/tabel-/constraint-namen of hostnames echoën. Rood→groen:
// vóór de fix deed de catch `if (e instanceof Error) return { error: e.message }` en lekte élke message.
// Na de fix loopt hij via toSafeActionError — gecureerde domeinfouten (Nederlandse tekst) passeren,
// een PrismaClient-fout wordt server-side gelogd en vervangen door de generieke boodschap.
// Prisma, authz, audit en de overige libs gemockt; @/lib/safe-action-error is bewust ECHT.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GENERIC_ACTION_ERROR } from "@/lib/safe-action-error";

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
const loggerError = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@prisma/client", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {},
    TransactionIsolationLevel: { Serializable: "Serializable" },
  },
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
vi.mock("@/lib/cascade/completion", () => ({
  completionBlockReason: vi.fn(() => null),
  cancellationBlockReason: vi.fn(() => null),
}));
vi.mock("@/lib/cascade/commands", () => ({
  signContract: vi.fn(),
  CascadeError: class extends Error {},
}));
vi.mock("@/lib/cancellation", () => ({
  assessCancellation: vi.fn(() => ({ chargeable: false })),
}));
vi.mock("@/lib/validation", () => ({
  collaborationProposalSchema: { safeParse: vi.fn() },
  collaborationCancellationSchema: {
    safeParse: vi.fn(() => ({ success: true, data: { reason: "Niet meer nodig." } })),
  },
}));
vi.mock("@/lib/collaboration-alerts", () => ({
  assessCollaborationCredentials: vi.fn(() => ({ missing: [], expired: [] })),
}));
vi.mock("@/lib/collaboration-reminder", () => ({
  reminderDayStart: vi.fn(() => new Date()),
  credentialReminderLink: vi.fn(() => ""),
  credentialReminderMessage: vi.fn(() => ({ title: "", body: "" })),
}));
// De logger is bewust gemockt zodat we kunnen bewijzen dat de technische fout server-side WÉL wordt
// gelogd (i.p.v. naar de client te lekken). safe-action-error zelf blijft echt.
vi.mock("@/lib/observability/logger", () => ({ logger: { error: loggerError } }));

import { cancelCollaboration } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  loggerError.mockReset();
});

describe("cancelCollaboration — geen rauw foutlek (CWE-209)", () => {
  it("vervangt een onverwachte Prisma-fout door de generieke boodschap en lekt de rauwe message niet", async () => {
    const raw =
      'Invalid `prisma.collaboration.findUnique()` invocation: column "secret_internal_col" does not exist';
    const prismaErr = Object.assign(new Error(raw), { name: "PrismaClientKnownRequestError" });
    findUniqueMock.mockRejectedValue(prismaErr);

    const res = await cancelCollaboration("collab-1", undefined, new FormData());

    expect(res).toEqual({ error: GENERIC_ACTION_ERROR });
    expect(res?.error).not.toContain("secret_internal_col");
    expect(res?.error).not.toContain("prisma");
    // De rauwe fout is niet verloren: server-side gelogd voor observability.
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it("laat een gecureerde domeinfout (Nederlandse tekst) wél door", async () => {
    // findUnique → null laat applyCollaborationStatusChange netjes "Samenwerking niet gevonden." gooien.
    findUniqueMock.mockResolvedValue(null);

    const res = await cancelCollaboration("collab-1", undefined, new FormData());

    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
    expect(loggerError).not.toHaveBeenCalled();
  });
});
