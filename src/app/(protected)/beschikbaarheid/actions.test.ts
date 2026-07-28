// Unit-tests voor beschikbaarheid/actions#updateAvailabilityWindow — de eigenaar-poort op het
// BEWERKEN van een venster (CLAUDE.md regel 1 & 2). De write is compound-guarded
// (`updateMany({ where: { id, freelancerProfileId } })`) zodat een gegokt id van een ander profiel
// nooit een venster kan wijzigen én de ownership-check niet met de update kan driften (geen TOCTOU).
// prisma/authz/audit/next-cache gemockt; het echte `availabilityWindowSchema` valideert de invoer.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateAvailabilityWindow } from "@/app/(protected)/beschikbaarheid/actions";

const store = {
  actor: { id: "zzp-1", role: "FREELANCER", status: "ACTIVE" } as {
    id: string;
    role: string;
    status: string;
  },
  profile: { id: "prof-1" } as { id: string } | null,
};

const profileFindUnique = vi.hoisted(() => vi.fn());
// Zonder inline-impl → args-type is `any[]` (net als de favorieten-test), zodat
// `.mock.calls[0]?.[0]?.where` typecheckt; de default-return zetten we in beforeEach.
const windowUpdateMany = vi.hoisted(() => vi.fn());
const auditMock = vi.hoisted(() => vi.fn(async () => undefined));
const revalidateMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidateMock }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  AuthorizationError: class AuthorizationError extends Error {},
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: profileFindUnique },
    availabilityWindow: { updateMany: windowUpdateMany },
  },
}));

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const VALID = {
  windowId: "win-1",
  startDate: "2026-08-01",
  endDate: "2026-08-14",
  type: "AVAILABLE",
  hoursPerWeek: "32",
  note: "vakantie-inhaal",
};

beforeEach(() => {
  vi.clearAllMocks();
  store.actor = { id: "zzp-1", role: "FREELANCER", status: "ACTIVE" };
  store.profile = { id: "prof-1" };
  profileFindUnique.mockImplementation(async () => store.profile);
  windowUpdateMany.mockResolvedValue({ count: 1 });
});

describe("updateAvailabilityWindow — eigenaar-poort + compound-guarded write", () => {
  it("scoopt de update op zowel id als het eigen profiel (geen cross-profiel-bewerking)", async () => {
    const res = await updateAvailabilityWindow(undefined, form(VALID));
    expect(res).toEqual({ ok: true });
    const where = windowUpdateMany.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where.id).toBe("win-1");
    expect(where.freelancerProfileId).toBe("prof-1");
    const data = windowUpdateMany.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.type).toBe("AVAILABLE");
    expect(data.hoursPerWeek).toBe(32);
    expect(data.note).toBe("vakantie-inhaal");
    expect(auditMock).toHaveBeenCalledOnce();
    expect(revalidateMock).toHaveBeenCalledWith("/beschikbaarheid");
  });

  it("gaf count 0 (vreemd/onbekend id) → foutmelding, GEEN audit", async () => {
    windowUpdateMany.mockResolvedValueOnce({ count: 0 });
    const res = await updateAvailabilityWindow(undefined, form(VALID));
    expect(res).toEqual({ error: "Venster niet gevonden." });
    expect(auditMock).not.toHaveBeenCalled();
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it("ontbrekend windowId → foutmelding zonder de DB te raken", async () => {
    const { windowId: _omit, ...rest } = VALID;
    const res = await updateAvailabilityWindow(undefined, form(rest));
    expect(res).toEqual({ error: "Venster niet gevonden." });
    expect(windowUpdateMany).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("einddatum vóór startdatum → veldfout, GEEN write", async () => {
    const res = await updateAvailabilityWindow(
      undefined,
      form({ ...VALID, startDate: "2026-08-14", endDate: "2026-08-01" }),
    );
    expect(res?.fieldErrors?.endDate).toBeTruthy();
    expect(windowUpdateMany).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("lege uren/notitie → null weggeschreven (optionele velden gewist)", async () => {
    await updateAvailabilityWindow(undefined, form({ ...VALID, hoursPerWeek: "", note: "" }));
    const data = windowUpdateMany.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.hoursPerWeek).toBeNull();
    expect(data.note).toBeNull();
  });
});
