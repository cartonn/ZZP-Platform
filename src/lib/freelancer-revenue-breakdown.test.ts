import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildFreelancerRevenueBreakdown,
  getFreelancerRevenueBreakdown,
} from "./freelancer-revenue-breakdown";

describe("buildFreelancerRevenueBreakdown", () => {
  it("returns an empty breakdown without invoices", () => {
    const b = buildFreelancerRevenueBreakdown([]);
    expect(b.rows).toEqual([]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.concentrationPct).toBeNull();
  });

  it("aggregates paid cents per company and counts distinct collaborations", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 10_000 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 5_000 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c2", totalCents: 5_000 },
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c3", totalCents: 4_000 },
    ]);
    expect(b.totalPaidCents).toBe(24_000);
    const zorg = b.rows.find((r) => r.companyId === "co1")!;
    expect(zorg.paidCents).toBe(20_000);
    expect(zorg.placements).toBe(2);
    const bouw = b.rows.find((r) => r.companyId === "co2")!;
    expect(bouw.paidCents).toBe(4_000);
    expect(bouw.placements).toBe(1);
  });

  it("sorts descending by paid cents and computes share + concentration", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c3", totalCents: 4_000 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 12_000 },
    ]);
    expect(b.rows.map((r) => r.companyId)).toEqual(["co1", "co2"]);
    expect(b.rows[0]!.sharePct).toBe(75);
    expect(b.rows[1]!.sharePct).toBe(25);
    // concentratie = aandeel van de grootste opdrachtgever
    expect(b.concentrationPct).toBe(75);
  });

  it("breaks ties on paid cents by distinct collaboration count", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 6_000 },
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c2", totalCents: 3_000 },
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c3", totalCents: 3_000 },
    ]);
    // gelijk bedrag (6000) → meer samenwerkingen eerst
    expect(b.rows.map((r) => r.companyId)).toEqual(["co2", "co1"]);
    expect(b.rows[0]!.placements).toBe(2);
  });

  it("ignores invoices without a known company (collaboration deleted)", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: null, companyName: null, collaborationId: null, totalCents: 9_999 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.totalPaidCents).toBe(1_000);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]!.companyId).toBe("co1");
  });

  it("falls back to a neutral name when the company name is null", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: null, collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.rows[0]!.name).toBe("Onbekende opdrachtgever");
  });

  it("treats null totalCents as zero without breaking the share math", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: null },
    ]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.rows[0]!.paidCents).toBe(0);
    expect(b.rows[0]!.sharePct).toBe(0);
    // geen omzet → geen concentratiesignaal
    expect(b.concentrationPct).toBeNull();
  });
});

// --- getFreelancerRevenueBreakdown: DB-scope over legacy loose + cascade facturen ----------------

type WhereValue = string | null | { in?: readonly string[]; notIn?: readonly string[] };
interface InvoiceWhere {
  collaboration?: { freelancer?: { userId?: string } };
  status?: WhereValue;
  lifecycleStatus?: WhereValue;
  OR?: InvoiceWhere[];
}

interface InvoiceFixture {
  /** Kolom die alleen de cascade-handler zet — NULL voor legacy loose-facturen. */
  issuerUserId: string | null;
  /** `collaboration.freelancer.userId` — altijd gevuld. */
  collabFreelancerUserId: string;
  status: string;
  lifecycleStatus: string | null;
  totalCents: number;
  companyId: string;
  companyName: string;
  collaborationId: string;
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
  const scopedUserId = where.collaboration?.freelancer?.userId;
  if (scopedUserId !== undefined && inv.collabFreelancerUserId !== scopedUserId) return false;
  if (!matchField(where.status, inv.status)) return false;
  if (!matchField(where.lifecycleStatus, inv.lifecycleStatus)) return false;
  if (where.OR && !where.OR.some((branch) => matchWhere(branch, inv))) return false;
  return true;
}

const USER_ID = "u1";

const INVOICES: InvoiceFixture[] = [
  // Legacy loose PAID (issuerUserId NULL, samenwerking van USER_ID) — de regressie.
  {
    issuerUserId: null,
    collabFreelancerUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 50000,
    companyId: "co1",
    companyName: "Zorg BV",
    collaborationId: "col1",
  },
  // Cascade PAID (legacy status DRAFT).
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PAID",
    totalCents: 25000,
    companyId: "co1",
    companyName: "Zorg BV",
    collaborationId: "col2",
  },
  // Cascade PROCESSED bij een tweede opdrachtgever.
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PROCESSED",
    totalCents: 15000,
    companyId: "co2",
    companyName: "Bouw NV",
    collaborationId: "col3",
  },
  // Niet betaald: openstaand cascade + teruggedraaid — tellen niet mee.
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "SUBMITTED",
    totalCents: 999999,
    companyId: "co1",
    companyName: "Zorg BV",
    collaborationId: "col4",
  },
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "CANCELLED",
    lifecycleStatus: "CREDITED",
    totalCents: 888888,
    companyId: "co1",
    companyName: "Zorg BV",
    collaborationId: "col5",
  },
  // Andere ZZP'er: mag nooit meetellen.
  {
    issuerUserId: null,
    collabFreelancerUserId: "u2",
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 777000,
    companyId: "co9",
    companyName: "Andere BV",
    collaborationId: "col9",
  },
];

const findMany = vi.fn(async ({ where }: { where: InvoiceWhere }) =>
  INVOICES.filter((inv) => matchWhere(where, inv)).map((inv) => ({
    totalCents: inv.totalCents,
    collaborationId: inv.collaborationId,
    collaboration: { companyId: inv.companyId, company: { name: inv.companyName } },
  })),
);

vi.mock("@/lib/db", () => ({
  prisma: { invoice: { findMany: (args: { where: InvoiceWhere }) => findMany(args) } },
}));

describe("getFreelancerRevenueBreakdown — DB-scope", () => {
  beforeEach(() => {
    findMany.mockClear();
  });

  it("telt legacy loose PAID (issuerUserId NULL) én cascade PAID/PROCESSED mee, per opdrachtgever", async () => {
    const b = await getFreelancerRevenueBreakdown(USER_ID);
    // co1: legacy loose 50000 + cascade 25000 = 75000; co2: 15000. Totaal 90000.
    expect(b.totalPaidCents).toBe(90000);
    const co1 = b.rows.find((r) => r.companyId === "co1")!;
    expect(co1.paidCents).toBe(75000);
    expect(co1.placements).toBe(2);
    // Onder de oude kolom-scope (`issuerUserId: userId, status: "PAID"`) viel de legacy loose 50000 weg.
    expect(b.totalPaidCents).not.toBe(40000);
  });

  it("scoopt op de eigen samenwerkingen (andere ZZP'er telt niet mee)", async () => {
    const b = await getFreelancerRevenueBreakdown(USER_ID);
    expect(b.rows.some((r) => r.companyId === "co9")).toBe(false);
  });
});
