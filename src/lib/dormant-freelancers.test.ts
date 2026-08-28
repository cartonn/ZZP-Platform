import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  summarizeDormantFreelancers,
  getDormantFreelancers,
  DORMANT_FREELANCER_DAYS,
  type DormantFreelancerInput,
} from "@/lib/dormant-freelancers";
import { type ClientSpendBreakdown } from "@/lib/client-spend-breakdown";

const NOW = new Date("2026-08-24T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function freelancer(over: Partial<DormantFreelancerInput>): DormantFreelancerInput {
  return {
    freelancerId: "f1",
    name: "Sanne de Vries",
    paidCents: 500_00,
    lastCompletedAt: daysAgo(120),
    hasActiveCollaboration: false,
    ...over,
  };
}

describe("summarizeDormantFreelancers", () => {
  it("markeert een ZZP'er zonder lopende samenwerking en oude afronding als slapend", () => {
    const out = summarizeDormantFreelancers([freelancer({})], NOW);
    expect(out.dormantCount).toBe(1);
    expect(out.rows[0]!.daysSince).toBe(120);
    expect(out.rows[0]!.monthsSince).toBe(4);
    expect(out.dormantPaidCents).toBe(500_00);
  });

  it("sluit een ZZP'er met een lopende (PROPOSED/ACTIVE) samenwerking uit", () => {
    const out = summarizeDormantFreelancers([freelancer({ hasActiveCollaboration: true })], NOW);
    expect(out.dormantCount).toBe(0);
    expect(out.dormantPaidCents).toBe(0);
  });

  it("sluit een ZZP'er zonder afgeronde historie (lastCompletedAt null) uit", () => {
    const out = summarizeDormantFreelancers([freelancer({ lastCompletedAt: null })], NOW);
    expect(out.dormantCount).toBe(0);
  });

  it("sluit een ZZP'er uit die recenter dan de drempel afrondde", () => {
    const recent = summarizeDormantFreelancers(
      [freelancer({ lastCompletedAt: daysAgo(DORMANT_FREELANCER_DAYS - 1) })],
      NOW,
    );
    expect(recent.dormantCount).toBe(0);
    // Exact op de drempel telt wél als slapend.
    const onThreshold = summarizeDormantFreelancers(
      [freelancer({ lastCompletedAt: daysAgo(DORMANT_FREELANCER_DAYS) })],
      NOW,
    );
    expect(onThreshold.dormantCount).toBe(1);
  });

  it("sorteert op betaalde uitgaven aflopend, dan op leeftijd aflopend", () => {
    const out = summarizeDormantFreelancers(
      [
        freelancer({ freelancerId: "a", paidCents: 100_00, lastCompletedAt: daysAgo(200) }),
        freelancer({ freelancerId: "b", paidCents: 900_00, lastCompletedAt: daysAgo(100) }),
        freelancer({ freelancerId: "c", paidCents: 100_00, lastCompletedAt: daysAgo(300) }),
      ],
      NOW,
    );
    expect(out.rows.map((r) => r.freelancerId)).toEqual(["b", "c", "a"]);
    expect(out.dormantPaidCents).toBe(1_100_00);
  });

  it("klemt monthsSince op minimaal 1 en negeert een afronding in de toekomst", () => {
    const justOver = summarizeDormantFreelancers(
      [freelancer({ lastCompletedAt: daysAgo(DORMANT_FREELANCER_DAYS) })],
      NOW,
    );
    expect(justOver.rows[0]!.monthsSince).toBe(
      Math.max(1, Math.floor(DORMANT_FREELANCER_DAYS / 30)),
    );

    const future = summarizeDormantFreelancers([freelancer({ lastCompletedAt: daysAgo(-5) })], NOW);
    expect(future.dormantCount).toBe(0);
  });

  it("geeft een lege samenvatting bij geen input", () => {
    const out = summarizeDormantFreelancers([], NOW);
    expect(out).toEqual({ rows: [], dormantCount: 0, dormantPaidCents: 0 });
  });
});

// --- getDormantFreelancers: DB-scope (owner-scoping + completedAt→endDate→updatedAt terugval) -------

interface CollabWhere {
  company?: { userId?: string };
  freelancerId?: { in?: readonly string[] };
}

interface CollabFixture {
  companyUserId: string;
  freelancerId: string;
  status: string;
  completedAt: Date | null;
  endDate: Date | null;
  updatedAt: Date;
}

const USER_ID = "u1";

// Alle recency-velden afgeleid van NOW zodat de leeftijden reproduceerbaar zijn.
const COLLABS: CollabFixture[] = [
  // f1 (USER_ID): twee COMPLETED → de max (120d) telt, niet de oudere (300d) → slapend.
  {
    companyUserId: USER_ID,
    freelancerId: "f1",
    status: "COMPLETED",
    completedAt: daysAgo(120),
    endDate: null,
    updatedAt: daysAgo(120),
  },
  {
    companyUserId: USER_ID,
    freelancerId: "f1",
    status: "COMPLETED",
    completedAt: daysAgo(300),
    endDate: null,
    updatedAt: daysAgo(300),
  },
  // f1 (ándere opdrachtgever): recent afgerond — mag NOOIT meetellen. Zou bij een scope-leak f1 uit de
  // slapend-lijst duwen (recente afronding), dus dit bewaakt de owner-scoping.
  {
    companyUserId: "u2",
    freelancerId: "f1",
    status: "COMPLETED",
    completedAt: daysAgo(5),
    endDate: null,
    updatedAt: daysAgo(5),
  },
  // f2 (USER_ID): oude COMPLETED + een lopende ACTIVE → NIET slapend (lopend werk onderdrukt).
  {
    companyUserId: USER_ID,
    freelancerId: "f2",
    status: "COMPLETED",
    completedAt: daysAgo(150),
    endDate: null,
    updatedAt: daysAgo(150),
  },
  {
    companyUserId: USER_ID,
    freelancerId: "f2",
    status: "ACTIVE",
    completedAt: null,
    endDate: null,
    updatedAt: daysAgo(2),
  },
  // f3 (USER_ID): COMPLETED zonder completedAt → terugval op endDate (100d) → slapend.
  {
    companyUserId: USER_ID,
    freelancerId: "f3",
    status: "COMPLETED",
    completedAt: null,
    endDate: daysAgo(100),
    updatedAt: daysAgo(10),
  },
  // f4 (USER_ID): COMPLETED zonder completedAt én zonder endDate → terugval op updatedAt (200d).
  {
    companyUserId: USER_ID,
    freelancerId: "f4",
    status: "COMPLETED",
    completedAt: null,
    endDate: null,
    updatedAt: daysAgo(200),
  },
  // f5 (USER_ID): recent afgerond (30d) → NIET slapend.
  {
    companyUserId: USER_ID,
    freelancerId: "f5",
    status: "COMPLETED",
    completedAt: daysAgo(30),
    endDate: null,
    updatedAt: daysAgo(30),
  },
];

function matchWhere(where: CollabWhere, col: CollabFixture): boolean {
  const scopedUserId = where.company?.userId;
  if (scopedUserId !== undefined && col.companyUserId !== scopedUserId) return false;
  const inSet = where.freelancerId?.in;
  if (inSet !== undefined && !inSet.includes(col.freelancerId)) return false;
  return true;
}

const findMany = vi.fn(async ({ where }: { where: CollabWhere }) =>
  COLLABS.filter((c) => matchWhere(where, c)).map((c) => ({
    freelancerId: c.freelancerId,
    status: c.status,
    completedAt: c.completedAt,
    endDate: c.endDate,
    updatedAt: c.updatedAt,
  })),
);

vi.mock("@/lib/db", () => ({
  prisma: { collaboration: { findMany: (args: { where: CollabWhere }) => findMany(args) } },
}));

function breakdownFixture(): ClientSpendBreakdown {
  const rows = [
    { freelancerId: "f1", name: "Sanne", paidCents: 900_00, placements: 2, sharePct: 45 },
    { freelancerId: "f2", name: "Bram", paidCents: 500_00, placements: 1, sharePct: 25 },
    { freelancerId: "f3", name: "Noor", paidCents: 300_00, placements: 1, sharePct: 15 },
    { freelancerId: "f4", name: "Tim", paidCents: 200_00, placements: 1, sharePct: 10 },
    { freelancerId: "f5", name: "Recent", paidCents: 100_00, placements: 1, sharePct: 5 },
  ];
  return { rows, totalPaidCents: 2_000_00, concentrationPct: 45 };
}

describe("getDormantFreelancers — DB-scope", () => {
  beforeEach(() => {
    findMany.mockClear();
  });

  it("scoopt de Collaboration-query op de ingelogde opdrachtgever én de uitgaven-opleverende ZZP'ers", async () => {
    await getDormantFreelancers(USER_ID, breakdownFixture(), NOW);
    expect(findMany).toHaveBeenCalledTimes(1);
    const where = findMany.mock.calls[0]![0].where as CollabWhere;
    expect(where.company?.userId).toBe(USER_ID);
    expect(where.freelancerId?.in).toEqual(["f1", "f2", "f3", "f4", "f5"]);
  });

  it("markeert alleen slapende ZZP'ers en negeert de recency van andere opdrachtgevers", async () => {
    const out = await getDormantFreelancers(USER_ID, breakdownFixture(), NOW);
    // f2 (lopend), f5 (recent) vallen af; f1/f3/f4 blijven, op uitgaven aflopend.
    expect(out.rows.map((r) => r.freelancerId)).toEqual(["f1", "f3", "f4"]);
    // f1: de max van de eigen COMPLETED-rijen (120d), niet 300d en niet de leak van u2 (5d).
    expect(out.rows[0]!.daysSince).toBe(120);
    expect(out.dormantCount).toBe(3);
    expect(out.dormantPaidCents).toBe(1_400_00);
  });

  it("valt terug op endDate en anders updatedAt wanneer completedAt ontbreekt", async () => {
    const out = await getDormantFreelancers(USER_ID, breakdownFixture(), NOW);
    const f3 = out.rows.find((r) => r.freelancerId === "f3")!;
    const f4 = out.rows.find((r) => r.freelancerId === "f4")!;
    expect(f3.daysSince).toBe(100); // endDate-terugval
    expect(f4.daysSince).toBe(200); // updatedAt-terugval
  });

  it("geeft een lege samenvatting zonder query bij een lege uitgaven-uitsplitsing", async () => {
    const empty: ClientSpendBreakdown = {
      rows: [],
      totalPaidCents: 0,
      concentrationPct: null,
    };
    const out = await getDormantFreelancers(USER_ID, empty, NOW);
    expect(out.dormantCount).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });
});
