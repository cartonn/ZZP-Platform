import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildClientSpendBreakdown, getClientSpendBreakdown } from "./client-spend-breakdown";

describe("buildClientSpendBreakdown", () => {
  it("returns an empty breakdown without invoices", () => {
    const b = buildClientSpendBreakdown([]);
    expect(b.rows).toEqual([]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.concentrationPct).toBeNull();
  });

  it("aggregates paid cents per freelancer and counts distinct collaborations", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 10_000 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 5_000 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c2", totalCents: 5_000 },
      { freelancerId: "f2", freelancerName: "Bram", collaborationId: "c3", totalCents: 4_000 },
    ]);
    expect(b.totalPaidCents).toBe(24_000);
    const sanne = b.rows.find((r) => r.freelancerId === "f1")!;
    expect(sanne.paidCents).toBe(20_000);
    expect(sanne.placements).toBe(2);
    const bram = b.rows.find((r) => r.freelancerId === "f2")!;
    expect(bram.paidCents).toBe(4_000);
    expect(bram.placements).toBe(1);
  });

  it("sorts descending by paid cents and computes share + concentration", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f2", freelancerName: "Bram", collaborationId: "c3", totalCents: 4_000 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 12_000 },
    ]);
    expect(b.rows.map((r) => r.freelancerId)).toEqual(["f1", "f2"]);
    expect(b.rows[0]!.sharePct).toBe(75);
    expect(b.rows[1]!.sharePct).toBe(25);
    // concentratie = aandeel van de grootste ZZP'er
    expect(b.concentrationPct).toBe(75);
  });

  it("ignores invoices without a known freelancer (collaboration deleted)", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: null, freelancerName: null, collaborationId: null, totalCents: 9_999 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.totalPaidCents).toBe(1_000);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]!.freelancerId).toBe("f1");
  });

  it("falls back to a neutral name when the freelancer name is anonymized/null", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f1", freelancerName: null, collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.rows[0]!.name).toBe("Onbekende ZZP'er");
  });

  it("treats null totalCents as zero without breaking the share math", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: null },
    ]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.rows[0]!.paidCents).toBe(0);
    expect(b.rows[0]!.sharePct).toBe(0);
    // geen uitgaven → geen concentratiesignaal
    expect(b.concentrationPct).toBeNull();
  });
});

// --- getClientSpendBreakdown: DB-scope over legacy loose + cascade facturen ----------------------

type WhereValue = string | null | { in?: readonly string[]; notIn?: readonly string[] };
interface InvoiceWhere {
  collaboration?: { company?: { userId?: string } };
  status?: WhereValue;
  lifecycleStatus?: WhereValue;
  OR?: InvoiceWhere[];
}

interface InvoiceFixture {
  /** Kolom die alleen de cascade-handler zet — NULL voor legacy loose-facturen. */
  counterpartyUserId: string | null;
  /** `collaboration.company.userId` — altijd gevuld. */
  collabCompanyUserId: string;
  status: string;
  lifecycleStatus: string | null;
  totalCents: number;
  freelancerId: string;
  freelancerName: string;
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
  const scopedUserId = where.collaboration?.company?.userId;
  if (scopedUserId !== undefined && inv.collabCompanyUserId !== scopedUserId) return false;
  if (!matchField(where.status, inv.status)) return false;
  if (!matchField(where.lifecycleStatus, inv.lifecycleStatus)) return false;
  if (where.OR && !where.OR.some((branch) => matchWhere(branch, inv))) return false;
  return true;
}

const USER_ID = "c1";

const INVOICES: InvoiceFixture[] = [
  // Legacy loose PAID (counterpartyUserId NULL, samenwerking van USER_ID) — de regressie.
  {
    counterpartyUserId: null,
    collabCompanyUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 50000,
    freelancerId: "f1",
    freelancerName: "Sanne",
    collaborationId: "col1",
  },
  // Cascade PAID (legacy status DRAFT), zelfde ZZP'er, andere samenwerking.
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PAID",
    totalCents: 25000,
    freelancerId: "f1",
    freelancerName: "Sanne",
    collaborationId: "col2",
  },
  // Cascade PROCESSED bij een tweede ZZP'er.
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PROCESSED",
    totalCents: 15000,
    freelancerId: "f2",
    freelancerName: "Bram",
    collaborationId: "col3",
  },
  // Niet betaald: openstaand + teruggedraaid — tellen niet mee.
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "SUBMITTED",
    totalCents: 999999,
    freelancerId: "f1",
    freelancerName: "Sanne",
    collaborationId: "col4",
  },
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "CANCELLED",
    lifecycleStatus: "CREDITED",
    totalCents: 888888,
    freelancerId: "f1",
    freelancerName: "Sanne",
    collaborationId: "col5",
  },
  // Andere opdrachtgever: mag nooit meetellen.
  {
    counterpartyUserId: null,
    collabCompanyUserId: "c2",
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 777000,
    freelancerId: "f9",
    freelancerName: "Iemand",
    collaborationId: "col9",
  },
];

const findMany = vi.fn(async ({ where }: { where: InvoiceWhere }) =>
  INVOICES.filter((inv) => matchWhere(where, inv)).map((inv) => ({
    totalCents: inv.totalCents,
    collaborationId: inv.collaborationId,
    collaboration: {
      freelancerId: inv.freelancerId,
      freelancer: { user: { name: inv.freelancerName } },
    },
  })),
);

vi.mock("@/lib/db", () => ({
  prisma: { invoice: { findMany: (args: { where: InvoiceWhere }) => findMany(args) } },
}));

describe("getClientSpendBreakdown — DB-scope", () => {
  beforeEach(() => {
    findMany.mockClear();
  });

  it("telt legacy loose PAID (counterpartyUserId NULL) én cascade PAID/PROCESSED mee, per ZZP'er", async () => {
    const b = await getClientSpendBreakdown(USER_ID);
    // f1: legacy loose 50000 + cascade 25000 = 75000; f2: 15000. Totaal 90000.
    expect(b.totalPaidCents).toBe(90000);
    const f1 = b.rows.find((r) => r.freelancerId === "f1")!;
    expect(f1.paidCents).toBe(75000);
    expect(f1.placements).toBe(2);
    // Onder de oude kolom-scope (`counterpartyUserId: userId, status: "PAID"`) viel de legacy loose 50000 weg.
    expect(b.totalPaidCents).not.toBe(40000);
  });

  it("scoopt op de eigen company (andere opdrachtgever telt niet mee)", async () => {
    const b = await getClientSpendBreakdown(USER_ID);
    expect(b.rows.some((r) => r.freelancerId === "f9")).toBe(false);
  });
});
