// Contract van deleteWorkExperience bij een geweigerde cross-owner-poging (CLAUDE.md regel 5 —
// audit alles wat telt; CWE-778 Insufficient Logging). auth → rol FREELANCER → ownership. Een
// IDOR-poging op andermans werkervaring (bestaand id, ander profiel) én een onbekend id leveren naar
// buiten exact dezelfde `{ ok: true }` (geen bestaans-orakel), maar de weigering mag NIET stil
// verdwijnen: ze wordt geaudit (WORK_EXPERIENCE_DELETE_DENIED) én er wordt niets verwijderd. Spiegel
// van deleteDocument (DOCUMENT_DELETE_DENIED). Rood→groen: zonder de audit-op-weigering wordt
// `audit` niet met WORK_EXPERIENCE_DELETE_DENIED aangeroepen.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string, id: "owner-me" }));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: roleState.id, role: roleState.role, status: "ACTIVE" };
  }),
  // Ownership tussen actor en het eigen profiel klopt in deze test altijd (zelfde user-id).
  assertOwnership: vi.fn(),
}));

const audit = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/audit", () => ({ audit }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const db = vi.hoisted(() => ({
  profileFind: vi.fn(),
  weFind: vi.fn(),
  weDelete: vi.fn(async () => ({})),
  weCreate: vi.fn(async () => ({ id: "we-new" })),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: db.profileFind },
    workExperience: { findUnique: db.weFind, delete: db.weDelete, create: db.weCreate },
  },
}));

// Module-oppervlak dat actions.ts importeert maar dit pad niet raakt.
vi.mock("@/lib/profile", () => ({ computeFreelancerCompleteness: vi.fn() }));
vi.mock("@/lib/parse-languages", () => ({
  serializeLanguages: vi.fn(),
  splitLanguagesInput: vi.fn(),
}));
vi.mock("@/lib/validation", () => ({ freelancerProfileSchema: { safeParse: vi.fn() } }));
vi.mock("@/lib/work-experience", () => ({
  workExperienceSchema: { safeParse: vi.fn() },
  WORK_EXPERIENCE_MAX_PER_PROFILE: 20,
}));

import { deleteWorkExperience } from "./actions";

function form(id: string): FormData {
  const fd = new FormData();
  fd.set("id", id);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  roleState.role = "FREELANCER";
  roleState.id = "owner-me";
  db.profileFind.mockResolvedValue({ id: "profile-me", userId: "owner-me" });
});

describe("deleteWorkExperience — geweigerde poging", () => {
  it("audit WORK_EXPERIENCE_DELETE_DENIED en verwijdert niets bij werkervaring van een ander profiel", async () => {
    db.weFind.mockResolvedValueOnce({
      id: "we-123",
      freelancerProfileId: "profile-someone-else",
      role: "Verpleegkundige",
      organization: "Ander ziekenhuis",
    });

    const res = await deleteWorkExperience(undefined, form("we-123"));

    // Geen bestaans-orakel: identiek aan "al weg".
    expect(res).toEqual({ ok: true });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "owner-me",
        action: "WORK_EXPERIENCE_DELETE_DENIED",
        entityType: "WorkExperience",
        entityId: "we-123",
      }),
    );
    expect(db.weDelete).not.toHaveBeenCalled();
  });

  it("audit WORK_EXPERIENCE_DELETE_DENIED ook bij een onbekend id (geen bestaans-orakel)", async () => {
    db.weFind.mockResolvedValueOnce(null);

    const res = await deleteWorkExperience(undefined, form("we-onbekend"));

    expect(res).toEqual({ ok: true });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "WORK_EXPERIENCE_DELETE_DENIED",
        entityId: "we-onbekend",
      }),
    );
    expect(db.weDelete).not.toHaveBeenCalled();
  });

  it("verwijdert wél en audit WORK_EXPERIENCE_REMOVED bij een eigen werkervaring (geen DENIED)", async () => {
    db.weFind.mockResolvedValueOnce({
      id: "we-mine",
      freelancerProfileId: "profile-me",
      role: "Verpleegkundige",
      organization: "Mijn ziekenhuis",
    });

    const res = await deleteWorkExperience(undefined, form("we-mine"));

    expect(res).toEqual({ ok: true });
    expect(db.weDelete).toHaveBeenCalledWith({ where: { id: "we-mine" } });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "WORK_EXPERIENCE_REMOVED", entityId: "we-mine" }),
    );
    expect(audit).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "WORK_EXPERIENCE_DELETE_DENIED" }),
    );
  });
});
