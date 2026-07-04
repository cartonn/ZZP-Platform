// Unit-tests voor de server-side entitlement-bepaling. Prisma-laag volledig gemockt met een
// in-memory store; hasEntitlement/PLANS zijn ECHT (niet gemockt) zodat plan→feature-mapping meetelt.
// Kern: een verlopen betaalde periode (currentPeriodEnd <= nu) telt als FREE, óók bij status ACTIVE.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
interface StoredSub {
  userId: string;
  status: string;
  currentPeriodEnd: Date | null;
  plan: { key: string };
}

const store = {
  subscriptions: [] as StoredSub[],
};

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(async (args: { where: { userId: string } }) => {
        const sub = store.subscriptions.find((s) => s.userId === args.where.userId);
        return sub ?? null;
      }),
      findMany: vi.fn(async (args: { where: { userId: { in: string[] }; status?: string } }) => {
        const ids = args.where.userId.in;
        return store.subscriptions.filter(
          (s) =>
            ids.includes(s.userId) &&
            (args.where.status === undefined || s.status === args.where.status),
        );
      }),
    },
  },
}));

const HOUR = 60 * 60 * 1000;

function makeSub(
  userId: string,
  status: string,
  currentPeriodEnd: Date | null,
  planKey: string,
): StoredSub {
  return { userId, status, currentPeriodEnd, plan: { key: planKey } };
}

describe("getActivePlanKey", () => {
  beforeEach(() => {
    store.subscriptions = [];
    vi.resetModules();
  });

  it("ACTIVE + currentPeriodEnd null (perpetueel) → plan-key", async () => {
    store.subscriptions = [makeSub("u1", "ACTIVE", null, "PRO")];
    const { getActivePlanKey } = await import("@/lib/entitlement-guard");
    expect(await getActivePlanKey("u1")).toBe("PRO");
  });

  it("ACTIVE + toekomstige currentPeriodEnd → plan-key", async () => {
    store.subscriptions = [makeSub("u1", "ACTIVE", new Date(Date.now() + HOUR), "BUSINESS")];
    const { getActivePlanKey } = await import("@/lib/entitlement-guard");
    expect(await getActivePlanKey("u1")).toBe("BUSINESS");
  });

  it("ACTIVE + verleden currentPeriodEnd → FREE", async () => {
    store.subscriptions = [makeSub("u1", "ACTIVE", new Date(Date.now() - HOUR), "PRO")];
    const { getActivePlanKey } = await import("@/lib/entitlement-guard");
    expect(await getActivePlanKey("u1")).toBe("FREE");
  });

  it("PENDING → FREE", async () => {
    store.subscriptions = [makeSub("u1", "PENDING", null, "PRO")];
    const { getActivePlanKey } = await import("@/lib/entitlement-guard");
    expect(await getActivePlanKey("u1")).toBe("FREE");
  });

  it("PAST_DUE → FREE", async () => {
    store.subscriptions = [makeSub("u1", "PAST_DUE", new Date(Date.now() + HOUR), "PRO")];
    const { getActivePlanKey } = await import("@/lib/entitlement-guard");
    expect(await getActivePlanKey("u1")).toBe("FREE");
  });

  it("geen abonnement → FREE", async () => {
    const { getActivePlanKey } = await import("@/lib/entitlement-guard");
    expect(await getActivePlanKey("u1")).toBe("FREE");
  });
});

describe("userHasEntitlement", () => {
  beforeEach(() => {
    store.subscriptions = [];
    vi.resetModules();
  });

  it("verlopen betaald abonnement geeft geen entitlement die het plan normaal wél zou geven", async () => {
    store.subscriptions = [makeSub("u1", "ACTIVE", new Date(Date.now() - HOUR), "PRO")];
    const { userHasEntitlement } = await import("@/lib/entitlement-guard");
    // PRO bezit ADMINISTRATIE, maar de periode is verlopen → geen entitlement.
    expect(await userHasEntitlement("u1", "ADMINISTRATIE")).toBe(false);
  });

  it("perpetueel-actief betaald abonnement geeft de entitlement die het plan bezit", async () => {
    store.subscriptions = [makeSub("u1", "ACTIVE", null, "PRO")];
    const { userHasEntitlement } = await import("@/lib/entitlement-guard");
    expect(await userHasEntitlement("u1", "ADMINISTRATIE")).toBe(true);
  });
});

describe("usersWithEntitlement", () => {
  beforeEach(() => {
    store.subscriptions = [];
    vi.resetModules();
  });

  it("alleen de perpetueel-actieve user zit in de set (verlopen + PENDING vallen buiten)", async () => {
    store.subscriptions = [
      makeSub("perpetual", "ACTIVE", null, "PRO"),
      makeSub("expired", "ACTIVE", new Date(Date.now() - HOUR), "PRO"),
      makeSub("pending", "PENDING", null, "PRO"),
    ];
    const { usersWithEntitlement } = await import("@/lib/entitlement-guard");
    const set = await usersWithEntitlement(["perpetual", "expired", "pending"], "ADMINISTRATIE");
    expect(set.has("perpetual")).toBe(true);
    expect(set.has("expired")).toBe(false);
    expect(set.has("pending")).toBe(false);
    expect(set.size).toBe(1);
  });

  it("lege userIds → lege set (geen query)", async () => {
    const { usersWithEntitlement } = await import("@/lib/entitlement-guard");
    const set = await usersWithEntitlement([], "ADMINISTRATIE");
    expect(set.size).toBe(0);
  });
});
