// Unit-tests voor beschikbaarheid/actions#setAvailabilityStatus — de snelle statuswijziging op de
// persistente `availability`-status van het ZZP-profiel. Volgt de mutatieketen (auth → rol → Zod →
// eigenaar-scoped write → audit). De write is compound-guarded (`updateMany({ where: { userId } })`)
// zodat een sessie nooit een ander profiel raakt en de ownership-check niet kan driften (geen TOCTOU).
// prisma/authz/audit/next-cache gemockt; het echte `availabilityStatusSchema` valideert de invoer.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { setAvailabilityStatus } from "@/app/(protected)/beschikbaarheid/actions";

const store = {
  actor: { id: "zzp-1", role: "FREELANCER", status: "ACTIVE" } as {
    id: string;
    role: string;
    status: string;
  },
};

const profileFindUnique = vi.hoisted(() => vi.fn());
const profileUpdateMany = vi.hoisted(() => vi.fn());
const auditMock = vi.hoisted(() => vi.fn(async () => undefined));
const revalidateMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  AuthorizationError: class AuthorizationError extends Error {},
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: { freelancerProfile: { findUnique: profileFindUnique, updateMany: profileUpdateMany } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  store.actor = { id: "zzp-1", role: "FREELANCER", status: "ACTIVE" };
  profileFindUnique.mockResolvedValue({ id: "prof-1" });
  profileUpdateMany.mockResolvedValue({ count: 1 });
});

describe("setAvailabilityStatus — eigenaar-poort + compound-guarded write", () => {
  it("scoopt de update compound op id + eigen userId en schrijft de status + audit (echte profiel-id)", async () => {
    const res = await setAvailabilityStatus("LIMITED");
    expect(res).toEqual({ ok: true });
    const call = profileUpdateMany.mock.calls[0]![0] as {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    };
    expect(call.where.id).toBe("prof-1");
    expect(call.where.userId).toBe("zzp-1");
    expect(call.data.availability).toBe("LIMITED");
    expect(auditMock).toHaveBeenCalledOnce();
    const auditArg = (auditMock.mock.calls[0] as unknown[])[0] as {
      action: string;
      entityType: string;
      entityId: string;
    };
    expect(auditArg.action).toBe("AVAILABILITY_STATUS_CHANGED");
    // Audit verwijst naar de echte FreelancerProfile-id (niet de userId) — consistent met het bestand.
    expect(auditArg.entityType).toBe("FreelancerProfile");
    expect(auditArg.entityId).toBe("prof-1");
    expect(revalidateMock).toHaveBeenCalledWith("/beschikbaarheid");
    expect(revalidateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("weigert een ongeldige status (UNKNOWN/onzin) zonder de DB te raken", async () => {
    for (const bad of ["UNKNOWN", "BOGUS", ""]) {
      const res = await setAvailabilityStatus(bad);
      expect(res).toEqual({ ok: false, error: "Ongeldige status." });
    }
    expect(profileUpdateMany).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("geen profiel → nette fout, GEEN write/audit/revalidate", async () => {
    profileFindUnique.mockResolvedValueOnce(null);
    const res = await setAvailabilityStatus("AVAILABLE");
    expect(res).toEqual({ ok: false, error: "Maak eerst je profiel aan." });
    expect(profileUpdateMany).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("weigert een niet-FREELANCER via de rol-poort", async () => {
    const { AuthorizationError } = await import("@/lib/authz");
    const authz = await import("@/lib/authz");
    vi.mocked(authz.requireRole).mockRejectedValueOnce(new AuthorizationError("Geen toegang."));
    const res = await setAvailabilityStatus("AVAILABLE");
    expect(res).toEqual({ ok: false, error: "Geen toegang." });
    expect(profileUpdateMany).not.toHaveBeenCalled();
  });
});
