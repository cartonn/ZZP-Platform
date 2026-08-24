import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  summarizeDormantClients,
  getDormantClients,
  DORMANT_CLIENT_DAYS,
  type DormantClientInput,
} from "@/lib/dormant-clients";
import { type FreelancerRevenueBreakdown } from "@/lib/freelancer-revenue-breakdown";

const NOW = new Date("2026-08-24T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function client(over: Partial<DormantClientInput>): DormantClientInput {
  return {
    companyId: "c1",
    name: "Zorgcentrum De Linde",
    paidCents: 500_00,
    lastCompletedAt: daysAgo(120),
    hasActiveCollaboration: false,
    ...over,
  };
}

describe("summarizeDormantClients", () => {
  it("markeert een klant zonder lopende samenwerking en oude afronding als slapend", () => {
    const out = summarizeDormantClients([client({})], NOW);
    expect(out.dormantCount).toBe(1);
    expect(out.rows[0].daysSince).toBe(120);
    expect(out.rows[0].monthsSince).toBe(4);
    expect(out.dormantPaidCents).toBe(500_00);
  });

  it("sluit een klant met een lopende (PROPOSED/ACTIVE) samenwerking uit", () => {
    const out = summarizeDormantClients([client({ hasActiveCollaboration: true })], NOW);
    expect(out.dormantCount).toBe(0);
    expect(out.dormantPaidCents).toBe(0);
  });

  it("sluit een klant zonder afgeronde historie (lastCompletedAt null) uit", () => {
    const out = summarizeDormantClients([client({ lastCompletedAt: null })], NOW);
    expect(out.dormantCount).toBe(0);
  });

  it("sluit een klant uit die recenter dan de drempel afrondde", () => {
    const recent = summarizeDormantClients(
      [client({ lastCompletedAt: daysAgo(DORMANT_CLIENT_DAYS - 1) })],
      NOW,
    );
    expect(recent.dormantCount).toBe(0);
    // Exact op de drempel telt wél als slapend.
    const onThreshold = summarizeDormantClients(
      [client({ lastCompletedAt: daysAgo(DORMANT_CLIENT_DAYS) })],
      NOW,
    );
    expect(onThreshold.dormantCount).toBe(1);
  });

  it("sorteert op betaalde omzet aflopend, dan op leeftijd aflopend", () => {
    const out = summarizeDormantClients(
      [
        client({ companyId: "a", paidCents: 100_00, lastCompletedAt: daysAgo(200) }),
        client({ companyId: "b", paidCents: 900_00, lastCompletedAt: daysAgo(100) }),
        client({ companyId: "c", paidCents: 100_00, lastCompletedAt: daysAgo(300) }),
      ],
      NOW,
    );
    expect(out.rows.map((r) => r.companyId)).toEqual(["b", "c", "a"]);
    expect(out.dormantPaidCents).toBe(1_100_00);
  });

  it("klemt monthsSince op minimaal 1 en negeert een afronding in de toekomst", () => {
    const justOver = summarizeDormantClients(
      [client({ lastCompletedAt: daysAgo(DORMANT_CLIENT_DAYS) })],
      NOW,
    );
    expect(justOver.rows[0].monthsSince).toBe(Math.max(1, Math.floor(DORMANT_CLIENT_DAYS / 30)));

    const future = summarizeDormantClients([client({ lastCompletedAt: daysAgo(-5) })], NOW);
    expect(future.dormantCount).toBe(0);
  });

  it("geeft een lege samenvatting bij geen input", () => {
    const out = summarizeDormantClients([], NOW);
    expect(out).toEqual({ rows: [], dormantCount: 0, dormantPaidCents: 0 });
  });
});

// --- getDormantClients: DB-scope (tenant-scoping + completedAt→endDate→updatedAt terugval) ---------

interface CollabWhere {
  freelancer?: { userId?: string };
  companyId?: { in?: readonly string[] };
}

interface CollabFixture {
  freelancerUserId: string;
  companyId: string;
  status: string;
  completedAt: Date | null;
  endDate: Date | null;
  updatedAt: Date;
}

const USER_ID = "u1";

// Alle recency-velden afgeleid van NOW zodat de leeftijden reproduceerbaar zijn.
const COLLABS: CollabFixture[] = [
  // co1 (USER_ID): twee COMPLETED → de max (120d) telt, niet de oudere (300d) → slapend.
  {
    freelancerUserId: USER_ID,
    companyId: "co1",
    status: "COMPLETED",
    completedAt: daysAgo(120),
    endDate: null,
    updatedAt: daysAgo(120),
  },
  {
    freelancerUserId: USER_ID,
    companyId: "co1",
    status: "COMPLETED",
    completedAt: daysAgo(300),
    endDate: null,
    updatedAt: daysAgo(300),
  },
  // co1 (ándere ZZP'er): recent afgerond — mag NOOIT meetellen. Zou bij een scope-leak co1 uit de
  // slapend-lijst duwen (recente afronding), dus dit bewaakt de tenant-scoping.
  {
    freelancerUserId: "u2",
    companyId: "co1",
    status: "COMPLETED",
    completedAt: daysAgo(5),
    endDate: null,
    updatedAt: daysAgo(5),
  },
  // co2 (USER_ID): oude COMPLETED + een lopende ACTIVE → NIET slapend (lopend werk onderdrukt).
  {
    freelancerUserId: USER_ID,
    companyId: "co2",
    status: "COMPLETED",
    completedAt: daysAgo(150),
    endDate: null,
    updatedAt: daysAgo(150),
  },
  {
    freelancerUserId: USER_ID,
    companyId: "co2",
    status: "ACTIVE",
    completedAt: null,
    endDate: null,
    updatedAt: daysAgo(2),
  },
  // co3 (USER_ID): COMPLETED zonder completedAt → terugval op endDate (100d) → slapend.
  {
    freelancerUserId: USER_ID,
    companyId: "co3",
    status: "COMPLETED",
    completedAt: null,
    endDate: daysAgo(100),
    updatedAt: daysAgo(10),
  },
  // co4 (USER_ID): COMPLETED zonder completedAt én zonder endDate → terugval op updatedAt (200d).
  {
    freelancerUserId: USER_ID,
    companyId: "co4",
    status: "COMPLETED",
    completedAt: null,
    endDate: null,
    updatedAt: daysAgo(200),
  },
  // co5 (USER_ID): recent afgerond (30d) → NIET slapend.
  {
    freelancerUserId: USER_ID,
    companyId: "co5",
    status: "COMPLETED",
    completedAt: daysAgo(30),
    endDate: null,
    updatedAt: daysAgo(30),
  },
];

function matchWhere(where: CollabWhere, col: CollabFixture): boolean {
  const scopedUserId = where.freelancer?.userId;
  if (scopedUserId !== undefined && col.freelancerUserId !== scopedUserId) return false;
  const inSet = where.companyId?.in;
  if (inSet !== undefined && !inSet.includes(col.companyId)) return false;
  return true;
}

const findMany = vi.fn(async ({ where }: { where: CollabWhere }) =>
  COLLABS.filter((c) => matchWhere(where, c)).map((c) => ({
    companyId: c.companyId,
    status: c.status,
    completedAt: c.completedAt,
    endDate: c.endDate,
    updatedAt: c.updatedAt,
  })),
);

vi.mock("@/lib/db", () => ({
  prisma: { collaboration: { findMany: (args: { where: CollabWhere }) => findMany(args) } },
}));

function breakdownFixture(): FreelancerRevenueBreakdown {
  const rows = [
    { companyId: "co1", name: "Zorg BV", paidCents: 900_00, placements: 2, sharePct: 45 },
    { companyId: "co2", name: "Bouw NV", paidCents: 500_00, placements: 1, sharePct: 25 },
    { companyId: "co3", name: "Care NV", paidCents: 300_00, placements: 1, sharePct: 15 },
    { companyId: "co4", name: "Thuis BV", paidCents: 200_00, placements: 1, sharePct: 10 },
    { companyId: "co5", name: "Recent BV", paidCents: 100_00, placements: 1, sharePct: 5 },
  ];
  return { rows, totalPaidCents: 2_000_00, concentrationPct: 45 };
}

describe("getDormantClients — DB-scope", () => {
  beforeEach(() => {
    findMany.mockClear();
  });

  it("scoopt de Collaboration-query op de ingelogde ZZP'er én de omzet-opleverende opdrachtgevers", async () => {
    await getDormantClients(USER_ID, breakdownFixture(), NOW);
    expect(findMany).toHaveBeenCalledTimes(1);
    const where = findMany.mock.calls[0][0].where as CollabWhere;
    expect(where.freelancer?.userId).toBe(USER_ID);
    expect(where.companyId?.in).toEqual(["co1", "co2", "co3", "co4", "co5"]);
  });

  it("markeert alleen slapende klanten en negeert de recency van andere ZZP'ers", async () => {
    const out = await getDormantClients(USER_ID, breakdownFixture(), NOW);
    // co2 (lopend), co5 (recent) vallen af; co1/co3/co4 blijven, op omzet aflopend.
    expect(out.rows.map((r) => r.companyId)).toEqual(["co1", "co3", "co4"]);
    // co1: de max van de eigen COMPLETED-rijen (120d), niet 300d en niet de leak van u2 (5d).
    expect(out.rows[0].daysSince).toBe(120);
    expect(out.dormantCount).toBe(3);
    expect(out.dormantPaidCents).toBe(1_400_00);
  });

  it("valt terug op endDate en anders updatedAt wanneer completedAt ontbreekt", async () => {
    const out = await getDormantClients(USER_ID, breakdownFixture(), NOW);
    const co3 = out.rows.find((r) => r.companyId === "co3")!;
    const co4 = out.rows.find((r) => r.companyId === "co4")!;
    expect(co3.daysSince).toBe(100); // endDate-terugval
    expect(co4.daysSince).toBe(200); // updatedAt-terugval
  });

  it("geeft een lege samenvatting zonder query bij een lege omzet-uitsplitsing", async () => {
    const empty: FreelancerRevenueBreakdown = {
      rows: [],
      totalPaidCents: 0,
      concentrationPct: null,
    };
    const out = await getDormantClients(USER_ID, empty, NOW);
    expect(out.dormantCount).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });
});
