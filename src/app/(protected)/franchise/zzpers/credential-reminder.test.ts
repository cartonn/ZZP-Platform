// Certificaatherinnering door de bemiddelaar (franchise-variant van #571). Deze test bewijst de
// mutatieketen: rol (FRANCHISER), ownership (ZZP'er in eigen roster/tenant), server-herbevestiging
// dat het verplichte type écht openstaat (ontbrekend/verlopen), en de dag-idempotentie (geen spam).

import { describe, it, expect, vi, beforeEach } from "vitest";

const freelancerFindFirst = vi.hoisted(() => vi.fn());
const tenantFindUnique = vi.hoisted(() => vi.fn(async () => ({ name: "Zorgbemiddeling BV" })));
const auditLogFindMany = vi.hoisted(() => vi.fn(async () => [] as { metadata: string | null }[]));
const runTransaction = vi.hoisted(() => vi.fn(async () => {}));
const notificationCreate = vi.hoisted(() => vi.fn(() => ({ __op: "notify" })));
const auditLogCreate = vi.hoisted(() => vi.fn(() => ({ __op: "audit" })));

let currentActor: { id: string; role: string; status: string; tenantId: string | null } = {
  id: "fr-1",
  role: "FRANCHISER",
  status: "ACTIVE",
  tenantId: "tenant-1",
};

const AuthorizationError = vi.hoisted(() => class AuthorizationError extends Error {});

vi.mock("@/lib/authz", () => ({
  AuthorizationError,
  requireRole: vi.fn(async (role: string) => {
    if (currentActor.role !== role) throw new AuthorizationError("Geen toegang.");
    return currentActor;
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}), auditData: (d: unknown) => d }));
vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findFirst: freelancerFindFirst },
    tenant: { findUnique: tenantFindUnique },
    auditLog: { findMany: auditLogFindMany, create: auditLogCreate },
    notification: { create: notificationCreate },
    $transaction: runTransaction,
    // Onderstaande modellen worden door andere acties in dit bestand gebruikt; irrelevant hier.
    user: { findUnique: vi.fn(async () => null), create: vi.fn(async () => ({})) },
    skill: { findMany: vi.fn(async () => []) },
  },
}));

import { sendFranchiseCredentialReminder } from "./actions";

/** Roster-ZZP'er zonder VOG én zonder verzekering — beide verplichte docs ontbreken. */
function rosterProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "prof-1",
    userId: "zzp-1",
    credentials: [] as unknown[],
    ...overrides,
  };
}

beforeEach(() => {
  currentActor = { id: "fr-1", role: "FRANCHISER", status: "ACTIVE", tenantId: "tenant-1" };
  freelancerFindFirst.mockReset();
  tenantFindUnique.mockReset().mockResolvedValue({ name: "Zorgbemiddeling BV" });
  auditLogFindMany.mockReset().mockResolvedValue([]);
  runTransaction.mockClear();
  notificationCreate.mockClear();
  auditLogCreate.mockClear();
});

describe("sendFranchiseCredentialReminder", () => {
  it("weigert een niet-FRANCHISER (rolcheck)", async () => {
    currentActor = { id: "zzp-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const result = await sendFranchiseCredentialReminder(
      "prof-1",
      "VOG",
      undefined,
      new FormData(),
    );
    expect(result?.error).toBeTruthy();
    expect(freelancerFindFirst).not.toHaveBeenCalled();
  });

  it("weigert wanneer de ZZP'er niet in het eigen roster zit (ownership/tenant)", async () => {
    freelancerFindFirst.mockResolvedValue(null); // findFirst met tenant-scope geeft niets terug
    const result = await sendFranchiseCredentialReminder(
      "prof-x",
      "VOG",
      undefined,
      new FormData(),
    );
    expect(result?.error).toMatch(/niet in je roster/i);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("weigert een type dat niet (meer) openstaat", async () => {
    // Beide verplichte docs zijn in orde: geen enkel type staat open.
    freelancerFindFirst.mockResolvedValue(
      rosterProfile({
        credentials: [
          { type: "VOG", status: "VERIFIED", expiresAt: null },
          { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
        ],
      }),
    );
    const result = await sendFranchiseCredentialReminder(
      "prof-1",
      "VOG",
      undefined,
      new FormData(),
    );
    expect(result?.error).toMatch(/niet \(meer\) vereist/i);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("verstuurt de herinnering (notificatie + audit) bij een openstaand verplicht document", async () => {
    freelancerFindFirst.mockResolvedValue(rosterProfile());
    const result = await sendFranchiseCredentialReminder(
      "prof-1",
      "VOG",
      undefined,
      new FormData(),
    );
    expect(result?.message).toMatch(/verstuurd/i);
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "zzp-1", type: "CREDENTIAL_REMINDER" }),
      }),
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "FRANCHISE_CREDENTIAL_REMINDER_SENT" }),
      }),
    );
    expect(runTransaction).toHaveBeenCalledTimes(1);
  });

  it("slaat stil over als er vandaag al voor dit type is herinnerd (idempotentie)", async () => {
    freelancerFindFirst.mockResolvedValue(rosterProfile());
    auditLogFindMany.mockResolvedValue([{ metadata: JSON.stringify({ type: "VOG" }) }]);
    const result = await sendFranchiseCredentialReminder(
      "prof-1",
      "VOG",
      undefined,
      new FormData(),
    );
    expect(result?.message).toMatch(/al herinnerd/i);
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
