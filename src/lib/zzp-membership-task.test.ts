// Unit-tests voor runZzpMembershipTask — maandbijdrage voor ZZP'ers met werk.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  performances: [] as Array<Record<string, unknown>>,
  upserts: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    performance: {
      findMany: vi.fn(async () => store.performances),
    },
    zzpMembershipCharge: {
      upsert: vi.fn(async (args: { create: Record<string, unknown> }) => {
        store.upserts.push(args.create);
        return args.create;
      }),
    },
  },
}));

// Vaste referentiedatum in juni 2026 (maand "2026-06")
const NOW = new Date("2026-06-09T12:00:00.000Z");

// Maak een goedgekeurde prestatie in de doelmaand.
function makePerformance(freelancerUserId: string, periodStart?: Date) {
  return {
    status: "APPROVED",
    periodStart: periodStart ?? new Date("2026-06-01T00:00:00.000Z"),
    approvedAt: new Date("2026-06-05T00:00:00.000Z"),
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    collaboration: {
      freelancer: { userId: freelancerUserId },
    },
  };
}

describe("runZzpMembershipTask", () => {
  beforeEach(async () => {
    store.performances = [];
    store.upserts = [];
    vi.resetModules();
    // Reset env zodat ZZP_MEMBERSHIP.enabled via config werkt
    delete process.env.ZZP_MEMBERSHIP_ENABLED;
  });

  it("lege toestand — geen prestaties → billed = 0", async () => {
    store.performances = [];
    const { runZzpMembershipTask } = await import("@/lib/zzp-membership-task");
    const result = await runZzpMembershipTask({ now: NOW });
    expect(result.billed).toBe(0);
    expect(result.period).toBe("2026-06");
    expect(store.upserts).toHaveLength(0);
  });

  it("happy path — 1 ZZP'er met werk in juni → bijdrage geregistreerd", async () => {
    store.performances = [makePerformance("user-1")];

    const { runZzpMembershipTask } = await import("@/lib/zzp-membership-task");
    const result = await runZzpMembershipTask({ now: NOW });

    expect(result.period).toBe("2026-06");
    expect(result.billed).toBe(1);
    expect(store.upserts).toHaveLength(1);
    expect(store.upserts[0]?.userId).toBe("user-1");
    expect(store.upserts[0]?.period).toBe("2026-06");
    expect(store.upserts[0]?.status).toBe("PENDING");
    // Bedrag > 0
    expect(store.upserts[0]?.priceCents).toBeGreaterThan(0);
  });

  it("happy path — 2 verschillende ZZP'ers → 2 bijdragen", async () => {
    store.performances = [makePerformance("user-2"), makePerformance("user-3")];

    const { runZzpMembershipTask } = await import("@/lib/zzp-membership-task");
    const result = await runZzpMembershipTask({ now: NOW });

    expect(result.billed).toBe(2);
    expect(store.upserts).toHaveLength(2);
  });

  it("idempotentie — dezelfde ZZP'er tweemaal in de prestaties → slechts 1 bijdrage", async () => {
    // Dezelfde user-id, twee aparte prestaties (bv. meerdere opdrachten)
    store.performances = [makePerformance("user-dup"), makePerformance("user-dup")];

    const { runZzpMembershipTask } = await import("@/lib/zzp-membership-task");
    const result = await runZzpMembershipTask({ now: NOW });

    expect(result.billed).toBe(1);
    expect(store.upserts).toHaveLength(1);
  });

  it("idempotentie — tweede run met zelfde state → upsert (geen create) opnieuw aanroepen", async () => {
    store.performances = [makePerformance("user-idem")];

    const { runZzpMembershipTask } = await import("@/lib/zzp-membership-task");
    await runZzpMembershipTask({ now: NOW });
    const firstCount = store.upserts.length;
    await runZzpMembershipTask({ now: NOW });
    // Upsert wordt opnieuw aangeroepen maar update-body is leeg (idempotent).
    expect(store.upserts.length).toBe(firstCount * 2);
  });

  it("prestatie buiten de doelmaand → niet meegeteld", async () => {
    // periodStart in mei 2026 → hoort niet bij "2026-06"
    const mayPerf = {
      status: "APPROVED",
      periodStart: new Date("2026-05-01T00:00:00.000Z"),
      approvedAt: new Date("2026-05-10T00:00:00.000Z"),
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      collaboration: { freelancer: { userId: "user-may" } },
    };
    store.performances = [mayPerf];

    const { runZzpMembershipTask } = await import("@/lib/zzp-membership-task");
    const result = await runZzpMembershipTask({ now: NOW });

    // Prestatie zit niet in de query (mock geeft alles terug), maar performanceMonthKey filtert hem weg.
    expect(result.billed).toBe(0);
    expect(store.upserts).toHaveLength(0);
  });
});
