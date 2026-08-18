import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRevenueTrend,
  getClientRevenueTrend,
  getFreelancerRevenueTrend,
  toRevenueRows,
} from "./revenue-trend";

const now = new Date("2026-06-09T10:00:00Z");

describe("toRevenueRows", () => {
  it("vertaalt factuurrijen naar RevenueSource met issuedAt → occurredAt", () => {
    const d1 = new Date("2026-05-01T00:00:00Z");
    const d2 = new Date("2026-06-01T00:00:00Z");
    expect(
      toRevenueRows([
        { issuedAt: d1, totalCents: 100_00 },
        { issuedAt: d2, totalCents: 250_00 },
      ]),
    ).toEqual([
      { occurredAt: d1, totalCents: 100_00 },
      { occurredAt: d2, totalCents: 250_00 },
    ]);
  });

  it("valt terug op 0 cent wanneer totalCents null is (legacy)", () => {
    const d = new Date("2026-06-01T00:00:00Z");
    expect(toRevenueRows([{ issuedAt: d, totalCents: null }])).toEqual([
      { occurredAt: d, totalCents: 0 },
    ]);
  });

  it("behoudt de volgorde en lengte van de invoer", () => {
    const rows = toRevenueRows([
      { issuedAt: new Date("2026-04-01T00:00:00Z"), totalCents: 1 },
      { issuedAt: new Date("2026-03-01T00:00:00Z"), totalCents: 2 },
      { issuedAt: new Date("2026-05-01T00:00:00Z"), totalCents: 3 },
    ]);
    expect(rows.map((r) => r.totalCents)).toEqual([1, 2, 3]);
  });

  it("geeft een lege rij terug voor lege invoer", () => {
    expect(toRevenueRows([])).toEqual([]);
  });
});

describe("buildRevenueTrend", () => {
  it("groepeert bedragen oud naar nieuw met juiste currentCents en totalCents", () => {
    const trend = buildRevenueTrend(
      [
        { occurredAt: new Date("2026-06-01T08:00:00Z"), totalCents: 100_00 },
        { occurredAt: new Date("2026-06-20T08:00:00Z"), totalCents: 50_00 },
        { occurredAt: new Date("2026-05-15T08:00:00Z"), totalCents: 200_00 },
      ],
      now,
      3,
    );
    expect(trend.series.map((m) => m.key)).toEqual(["2026-04", "2026-05", "2026-06"]);
    expect(trend.series.map((m) => m.cents)).toEqual([0, 200_00, 150_00]);
    expect(trend.currentCents).toBe(150_00);
    expect(trend.totalCents).toBe(350_00);
  });

  it("hasData is true als minstens één maand omzet heeft", () => {
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 1_00 }],
      now,
      6,
    );
    expect(trend.hasData).toBe(true);
  });

  it("hasData is false bij lege rows", () => {
    const trend = buildRevenueTrend([], now, 6);
    expect(trend.hasData).toBe(false);
    expect(trend.currentCents).toBe(0);
    expect(trend.totalCents).toBe(0);
    expect(trend.deltaPct).toBeNull();
  });

  it("deltaPct berekent de procentuele verandering t.o.v. de vorige maand", () => {
    const trend = buildRevenueTrend(
      [
        { occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 100_00 },
        { occurredAt: new Date("2026-06-05T08:00:00Z"), totalCents: 112_00 },
      ],
      now,
      6,
    );
    expect(trend.deltaPct).toBe(12);
  });

  it("deltaPct is null als de vorige maand nul cent heeft (geen vergelijkbare basis)", () => {
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2026-06-01T08:00:00Z"), totalCents: 50_00 }],
      now,
      6,
    );
    // Alle maanden vóór juni zijn 0, dus deltaPct is null.
    expect(trend.deltaPct).toBeNull();
  });

  it("deltaPct is null bij volledig lege reeks", () => {
    const trend = buildRevenueTrend([], now, 2);
    expect(trend.deltaPct).toBeNull();
  });

  it("deltaPct is null zolang de lopende maand nog leeg is (geen -100%)", () => {
    // Vorige maand gevuld, lopende maand nog zonder omzet → geen misleidende daling.
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2026-05-10T08:00:00Z"), totalCents: 100_00 }],
      now,
      6,
    );
    expect(trend.currentCents).toBe(0);
    expect(trend.deltaPct).toBeNull();
  });

  it("overbrugt een jaargrens correct", () => {
    const nowFeb = new Date("2026-02-10T10:00:00Z");
    const trend = buildRevenueTrend(
      [{ occurredAt: new Date("2025-12-31T20:00:00Z"), totalCents: 75_00 }],
      nowFeb,
      4,
    );
    expect(trend.series.map((m) => m.key)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    // 31 dec 20:00Z = 31 dec 21:00 Amsterdam — telt in december.
    expect(trend.series[1]?.cents).toBe(75_00);
    expect(trend.totalCents).toBe(75_00);
    expect(trend.currentCents).toBe(0);
    expect(trend.hasData).toBe(true);
  });

  it("series heeft de gevraagde lengte in months", () => {
    const trend = buildRevenueTrend([], now, 12);
    expect(trend.series).toHaveLength(12);
  });
});

// --- getFreelancerRevenueTrend / getClientRevenueTrend: DB-scope over legacy loose + cascade -------

type WhereValue = string | null | { in?: readonly string[]; notIn?: readonly string[] };
interface InvoiceWhere {
  collaboration?: { freelancer?: { userId?: string }; company?: { userId?: string } };
  status?: WhereValue;
  lifecycleStatus?: WhereValue;
  issuedAt?: { gte?: Date };
  OR?: InvoiceWhere[];
}

interface InvoiceFixture {
  /** Kolom die alleen de cascade-handler zet — NULL voor legacy loose-facturen. */
  issuerUserId: string | null;
  collabFreelancerUserId: string;
  collabCompanyUserId: string;
  status: string;
  lifecycleStatus: string | null;
  issuedAt: Date;
  totalCents: number;
}

function matchField(cond: WhereValue | undefined, actual: string | null): boolean {
  if (cond === undefined) return true;
  if (cond === null) return actual === null;
  if (typeof cond === "string") return actual === cond;
  if (cond.in) return actual != null && cond.in.includes(actual);
  if (cond.notIn) return actual != null && !cond.notIn.includes(actual);
  return true;
}

function matchWhere(where: InvoiceWhere, inv: InvoiceFixture): boolean {
  const freelancerScope = where.collaboration?.freelancer?.userId;
  if (freelancerScope !== undefined && inv.collabFreelancerUserId !== freelancerScope) return false;
  const companyScope = where.collaboration?.company?.userId;
  if (companyScope !== undefined && inv.collabCompanyUserId !== companyScope) return false;
  if (where.issuedAt?.gte && inv.issuedAt < where.issuedAt.gte) return false;
  if (!matchField(where.status, inv.status)) return false;
  if (!matchField(where.lifecycleStatus, inv.lifecycleStatus)) return false;
  if (where.OR && !where.OR.some((branch) => matchWhere(branch, inv))) return false;
  return true;
}

const FREELANCER_ID = "f-user";
const COMPANY_ID = "c-user";
const may = new Date("2026-05-10T08:00:00Z");

const TREND_INVOICES: InvoiceFixture[] = [
  // Legacy loose (issuerUserId NULL) — telt mee (niet CANCELLED). De regressie.
  {
    issuerUserId: null,
    collabFreelancerUserId: FREELANCER_ID,
    collabCompanyUserId: COMPANY_ID,
    status: "SENT",
    lifecycleStatus: null,
    issuedAt: may,
    totalCents: 10000,
  },
  // Cascade PAID (legacy status DRAFT) — telt mee.
  {
    issuerUserId: FREELANCER_ID,
    collabFreelancerUserId: FREELANCER_ID,
    collabCompanyUserId: COMPANY_ID,
    status: "DRAFT",
    lifecycleStatus: "PAID",
    issuedAt: may,
    totalCents: 20000,
  },
  // Teruggedraaid cascade (CREDITED) — telt niet mee.
  {
    issuerUserId: FREELANCER_ID,
    collabFreelancerUserId: FREELANCER_ID,
    collabCompanyUserId: COMPANY_ID,
    status: "CANCELLED",
    lifecycleStatus: "CREDITED",
    issuedAt: may,
    totalCents: 33000,
  },
  // Geannuleerde legacy loose — telt niet mee.
  {
    issuerUserId: null,
    collabFreelancerUserId: FREELANCER_ID,
    collabCompanyUserId: COMPANY_ID,
    status: "CANCELLED",
    lifecycleStatus: null,
    issuedAt: may,
    totalCents: 8000,
  },
  // Andere ZZP'er/opdrachtgever — telt nooit mee.
  {
    issuerUserId: null,
    collabFreelancerUserId: "other-f",
    collabCompanyUserId: "other-c",
    status: "PAID",
    lifecycleStatus: null,
    issuedAt: may,
    totalCents: 999000,
  },
];

const findMany = vi.fn(async ({ where }: { where: InvoiceWhere }) =>
  TREND_INVOICES.filter((inv) => matchWhere(where, inv)).map((inv) => ({
    issuedAt: inv.issuedAt,
    totalCents: inv.totalCents,
  })),
);

vi.mock("@/lib/db", () => ({
  prisma: { invoice: { findMany: (args: { where: InvoiceWhere }) => findMany(args) } },
}));

describe("getFreelancerRevenueTrend — DB-scope", () => {
  beforeEach(() => {
    findMany.mockClear();
  });

  it("telt legacy loose (issuerUserId NULL) én cascade mee, excl. teruggedraaid/geannuleerd", async () => {
    const trend = await getFreelancerRevenueTrend(FREELANCER_ID, now, 6);
    // Legacy loose 10000 + cascade 20000 = 30000 in mei; CREDITED (33000) en CANCELLED (8000) uitgesloten.
    expect(trend.totalCents).toBe(30000);
    // Onder de oude kolom-scope (`issuerUserId: userId`) viel de legacy loose 10000 weg → 20000.
    expect(trend.totalCents).not.toBe(20000);
  });

  it("scoopt op de eigen samenwerkingen (andere ZZP'er telt niet mee)", async () => {
    const trend = await getFreelancerRevenueTrend(FREELANCER_ID, now, 6);
    expect(trend.totalCents).toBeLessThan(999000);
  });
});

describe("getClientRevenueTrend — DB-scope", () => {
  beforeEach(() => {
    findMany.mockClear();
  });

  it("telt legacy loose (counterpartyUserId NULL) én cascade mee, excl. teruggedraaid/geannuleerd", async () => {
    const trend = await getClientRevenueTrend(COMPANY_ID, now, 6);
    expect(trend.totalCents).toBe(30000);
    expect(trend.totalCents).not.toBe(20000);
  });

  it("scoopt op de eigen company (andere opdrachtgever telt niet mee)", async () => {
    const trend = await getClientRevenueTrend(COMPANY_ID, now, 6);
    expect(trend.totalCents).toBeLessThan(999000);
  });
});
