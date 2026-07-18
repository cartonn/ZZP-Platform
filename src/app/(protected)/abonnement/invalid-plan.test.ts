// Unit-tests voor changeSubscription — robuustheid van de plan-invoer (DOEL 2). Een geknutselde POST
// met een `planKey` buiten de PlanKey-enum mag geen ongevangen ZodError → generieke 500 geven, maar
// een nette afwijzing, en mag de DB niet raken. Een geldige plan-key passeert de poort en bereikt de
// plan-lookup. Alle geïmporteerde modules gemockt zodat de actie laadt; enums is echt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
const upsertMock = vi.hoisted(() => vi.fn(async () => ({})));
const auditCreateMock = vi.hoisted(() => vi.fn(async () => ({})));

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => ({ id: "user-1", role: "FREELANCER", status: "ACTIVE" })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/public-url", () => ({ publicOrigin: vi.fn(async () => "https://zzp.test") }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));
vi.mock("@/lib/billing/provider", () => ({
  getPaymentProvider: vi.fn(() => ({
    startCheckout: vi.fn(async () => ({ redirectUrl: null, providerRef: "ref-1" })),
  })),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    plan: { findUnique: findUniqueMock },
    subscription: { upsert: upsertMock },
    auditLog: { create: auditCreateMock },
  },
}));

import { changeSubscription } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  upsertMock.mockClear();
  auditCreateMock.mockClear();
});

describe("changeSubscription — plan-validatie", () => {
  it("weigert een plan-key buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(changeSubscription("HACKED")).rejects.toThrow("Ongeldig abonnement.");
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("laat een geldige plan-key door tot de plan-lookup (hier: niet gevonden)", async () => {
    // Een geldige enum-waarde passeert de safeParse-poort en bereikt de plan-lookup.
    await expect(changeSubscription("PRO")).rejects.toThrow("Plan niet gevonden.");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });
});
