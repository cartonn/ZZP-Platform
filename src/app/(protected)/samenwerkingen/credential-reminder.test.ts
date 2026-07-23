// Certificaatherinnering (rode draad 5): de opdrachtgever kan de ZZP'er bij een lopende
// samenwerking herinneren een ontbrekend/vereist certificaat aan te leveren. Deze test bewijst de
// mutatieketen: rol (CLIENT), ownership (company.userId), server-herbevestiging dat het type écht
// openstaat, en de dag-idempotentie (geen spam).

import { describe, it, expect, vi, beforeEach } from "vitest";

const collaborationFindUnique = vi.hoisted(() => vi.fn());
const auditLogFindMany = vi.hoisted(() => vi.fn(async () => [] as { metadata: string | null }[]));
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
    collaboration: { findUnique: collaborationFindUnique },
    auditLog: { findMany: auditLogFindMany, create: auditLogCreate },
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

import { sendCredentialReminder } from "./actions";

/** Samenwerking met VOG als vereist certificaat dat de ZZP'er nog niet heeft (ontbrekend). */
function collabWithMissingVog(companyUserId = "client-1") {
  return {
    id: "col-1",
    status: "ACTIVE",
    company: { userId: companyUserId, name: "Zorg BV" },
    freelancer: { userId: "zzp-1", credentials: [] as unknown[] },
    job: { credentialRequirements: [{ credentialType: "VOG" }] },
  };
}

beforeEach(() => {
  currentActor = { id: "client-1", role: "CLIENT", status: "ACTIVE" };
  collaborationFindUnique.mockReset();
  auditLogFindMany.mockReset().mockResolvedValue([]);
  runTransaction.mockClear();
  notificationCreate.mockClear();
  auditLogCreate.mockClear();
});

describe("sendCredentialReminder", () => {
  it("weigert een niet-CLIENT (rolcheck)", async () => {
    currentActor = { id: "zzp-1", role: "FREELANCER", status: "ACTIVE" };
    const result = await sendCredentialReminder("col-1", "VOG", undefined, new FormData());
    expect(result?.error).toBeTruthy();
    expect(collaborationFindUnique).not.toHaveBeenCalled();
  });

  it("weigert een opdrachtgever die niet de eigenaar is — anti-oracle (CWE-203): identiek aan onbekend id", async () => {
    // Onbekend id → "Samenwerking niet gevonden."
    collaborationFindUnique.mockResolvedValue(null);
    const unknown = await sendCredentialReminder("col-x", "VOG", undefined, new FormData());
    expect(unknown?.error).toBe("Samenwerking niet gevonden.");

    // Bestaand-maar-van-een-andere-opdrachtgever moet EXACT dezelfde melding geven (geen existence-
    // oracle): een niet-betrokken CLIENT mag andermans samenwerking-id niet kunnen aftasten.
    collaborationFindUnique.mockResolvedValue(collabWithMissingVog("iemand-anders"));
    const foreign = await sendCredentialReminder("col-1", "VOG", undefined, new FormData());
    expect(foreign?.error).toBe("Samenwerking niet gevonden.");
    expect(foreign?.error).toBe(unknown?.error);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("weigert een type dat niet (meer) openstaat", async () => {
    // INSURANCE is niet vereist; alleen VOG ontbreekt.
    collaborationFindUnique.mockResolvedValue(collabWithMissingVog());
    const result = await sendCredentialReminder("col-1", "INSURANCE", undefined, new FormData());
    expect(result?.error).toMatch(/niet \(meer\) vereist/i);
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it("verstuurt de herinnering (notificatie + audit) bij een openstaand vereist certificaat", async () => {
    collaborationFindUnique.mockResolvedValue(collabWithMissingVog());
    const result = await sendCredentialReminder("col-1", "VOG", undefined, new FormData());
    expect(result?.message).toMatch(/verstuurd/i);
    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "zzp-1", type: "CREDENTIAL_REMINDER" }),
      }),
    );
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "CREDENTIAL_REMINDER_SENT" }),
      }),
    );
    expect(runTransaction).toHaveBeenCalledTimes(1);
  });

  it("slaat stil over als er vandaag al voor dit type is herinnerd (idempotentie)", async () => {
    collaborationFindUnique.mockResolvedValue(collabWithMissingVog());
    auditLogFindMany.mockResolvedValue([{ metadata: JSON.stringify({ type: "VOG" }) }]);
    const result = await sendCredentialReminder("col-1", "VOG", undefined, new FormData());
    expect(result?.message).toMatch(/al herinnerd/i);
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
