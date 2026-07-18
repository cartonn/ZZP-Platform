// Unit-tests voor setUserStatus — robuustheid van de accountstatus-invoer (DOEL 2). Een geknutselde
// admin-POST met een `target` buiten de UserStatus-enum mag geen ongevangen ZodError → generieke 500
// geven, maar een nette afwijzing, en mag de DB niet raken. Een geldige status passeert de poort en
// bereikt de gebruiker-lookup. Alle geïmporteerde modules gemockt zodat de actie laadt; enums is echt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
const updateMock = vi.hoisted(() => vi.fn(async () => ({})));
const transactionMock = vi.hoisted(() => vi.fn(async () => []));
const canModerateUserMock = vi.hoisted(() => vi.fn(() => true));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));
vi.mock("@/lib/admin", () => ({ canModerateUser: canModerateUserMock }));
vi.mock("@/lib/request-meta", () => ({ requestMeta: vi.fn(async () => ({})) }));
vi.mock("@/lib/services/storage", () => ({ getStorage: vi.fn(() => ({ delete: vi.fn() })) }));
vi.mock("@/lib/observability/storage-failure", () => ({ logStorageCleanupFailure: vi.fn() }));
vi.mock("@/lib/account-anonymization", () => ({
  AUDIT_PII_REDACTED: "[REDACTED]",
  canAnonymizeUser: vi.fn(() => ({ ok: true })),
  companyAnonymizationData: vi.fn(() => ({})),
  freelancerProfileAnonymizationData: vi.fn(() => ({})),
  scrubAuditMetadataPii: vi.fn((m: unknown) => m),
  userAnonymizationData: vi.fn(() => ({})),
}));
vi.mock("@/lib/cascade/dispute-commands", () => ({ DISPUTE_ADMIN_NOTIFICATION_TITLE: "Dispuut" }));
vi.mock("@/lib/dispute-ownership", () => ({
  collaborationsWithActiveDisputeOpenedBy: vi.fn(async () => []),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: findUniqueMock, update: updateMock },
    $transaction: transactionMock,
  },
}));

import { setUserStatus } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  updateMock.mockClear();
  transactionMock.mockClear();
  canModerateUserMock.mockReset();
  canModerateUserMock.mockReturnValue(true);
});

describe("setUserStatus — accountstatus-validatie", () => {
  it("weigert een status buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(setUserStatus("u-1", "HACKED")).rejects.toThrow("Ongeldige accountstatus.");
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("laat een geldige status door tot de gebruiker-lookup (hier: niet gevonden)", async () => {
    // Een geldige enum-waarde passeert de safeParse-poort en (met moderatie-toestemming) de lookup.
    await expect(setUserStatus("u-1", "SUSPENDED")).rejects.toThrow("Gebruiker niet gevonden.");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
