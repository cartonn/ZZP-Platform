// Contract van setMonthlyIncomeGoal: auth → rol FREELANCER → ownership → Zod → update → audit.
// Een leeg bedrag wist het doel (null); duizendtal-punten worden genegeerd; negatief/onzin/te-hoog
// wordt geweigerd zonder schrijfactie.

import { describe, it, expect, vi, beforeEach } from "vitest";

const profileState = vi.hoisted(() => ({
  current: null as { id: string; userId: string } | null,
}));

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));

vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: "user-1", role: roleState.role, status: "ACTIVE" };
  }),
  assertOwnership: vi.fn((actor: { id: string }, ownerId: string) => {
    if (actor.id !== ownerId) throw new FakeAuthError("Geen toegang.");
  }),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn(async () => ({})) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findUnique: vi.fn(async () => profileState.current),
      update,
    },
  },
}));

import { setMonthlyIncomeGoal } from "./actions";
import { audit } from "@/lib/audit";

function form(amount: string): FormData {
  const fd = new FormData();
  fd.set("amount", amount);
  return fd;
}

function lastAudit() {
  const calls = (audit as unknown as ReturnType<typeof vi.fn>).mock.calls;
  return calls[calls.length - 1]![0] as { action: string; metadata: Record<string, unknown> };
}

describe("setMonthlyIncomeGoal", () => {
  beforeEach(() => {
    profileState.current = { id: "profile-1", userId: "user-1" };
    roleState.role = "FREELANCER";
    update.mockClear();
    (audit as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  it("stelt een geldig doel in (euro's → centen) en auditeert", async () => {
    const res = await setMonthlyIncomeGoal(undefined, form("2500"));
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { monthlyIncomeGoalCents: 250000 },
    });
    expect(lastAudit().action).toBe("INCOME_GOAL_SET");
    expect(lastAudit().metadata).toEqual({ goalCents: 250000 });
  });

  it("negeert duizendtal-punten en spaties", async () => {
    await setMonthlyIncomeGoal(undefined, form("2.500 "));
    expect(update).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { monthlyIncomeGoalCents: 250000 },
    });
  });

  it("wist het doel bij een leeg bedrag (null) en auditeert als gewist", async () => {
    const res = await setMonthlyIncomeGoal(undefined, form(""));
    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: { monthlyIncomeGoalCents: null },
    });
    expect(lastAudit().action).toBe("INCOME_GOAL_CLEARED");
  });

  it("weigert een niet-numeriek bedrag zonder te schrijven", async () => {
    const res = await setMonthlyIncomeGoal(undefined, form("abc"));
    expect(res?.error).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it("weigert een bedrag boven het plafond", async () => {
    const res = await setMonthlyIncomeGoal(undefined, form("100000000"));
    expect(res?.error).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it("weigert een niet-FREELANCER", async () => {
    roleState.role = "CLIENT";
    const res = await setMonthlyIncomeGoal(undefined, form("2500"));
    expect(res?.error).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it("meldt een ontbrekend profiel", async () => {
    profileState.current = null;
    const res = await setMonthlyIncomeGoal(undefined, form("2500"));
    expect(res).toEqual({ error: "Profiel niet gevonden." });
    expect(update).not.toHaveBeenCalled();
  });
});
