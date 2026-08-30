import { beforeEach, describe, expect, it, vi } from "vitest";
import { fillRateHint, getClientStats } from "@/lib/client-stats";

describe("fillRateHint", () => {
  it("beschrijft hoeveel opdrachten een plaatsing hebben", () => {
    expect(fillRateHint(3, 14)).toBe("3 van je 14 opdrachten heeft een plaatsing");
  });

  it("gebruikt enkelvoud bij één opdracht", () => {
    expect(fillRateHint(0, 1)).toBe("0 van je 1 opdracht heeft een plaatsing");
  });

  it("nodigt uit om te plaatsen wanneer er geen opdrachten zijn", () => {
    expect(fillRateHint(0, 0)).toBe("Nog geen opdrachten geplaatst");
  });
});

// --- getClientStats: "Uitgaven"/"Openstaand"-KPI over legacy + cascade facturen ------------------

type WhereValue = string | null | { in?: readonly string[]; notIn?: readonly string[] };
interface InvoiceWhere {
  // Relationele scope: `collaboration: { company: { userId } }` — de kolom `counterpartyUserId` wordt
  // niet meer gebruikt (die is NULL voor legacy loose-facturen).
  collaboration?: { company?: { userId?: string } };
  status?: WhereValue;
  lifecycleStatus?: WhereValue;
  OR?: InvoiceWhere[];
}

interface InvoiceFixture {
  /** De kolom die alleen de cascade-handler zet — NULL voor legacy loose-facturen. */
  counterpartyUserId: string | null;
  /** `collaboration.company.userId` — altijd gevuld (de eigenaar van de samenwerking). */
  collabCompanyUserId: string;
  status: string;
  lifecycleStatus: string | null;
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
  const scopedUserId = where.collaboration?.company?.userId;
  if (scopedUserId !== undefined && inv.collabCompanyUserId !== scopedUserId) return false;
  if (!matchField(where.status, inv.status)) return false;
  if (!matchField(where.lifecycleStatus, inv.lifecycleStatus)) return false;
  if (where.OR && !where.OR.some((branch) => matchWhere(branch, inv))) return false;
  return true;
}

const USER_ID = "c1";

// Gemengde fixture: legacy loose-facturen (counterpartyUserId NULL — nooit door de cascade-handler
// gezet) én cascade-facturen. De relationele scope (`collaboration.company.userId`) telt beide paden
// mee; de oude kolom-scope (`counterpartyUserId: userId`) liet de legacy loose-rijen vallen.
const INVOICES: InvoiceFixture[] = [
  // Legacy loose openstaand: counterpartyUserId NULL, samenwerking van USER_ID — de regressie.
  {
    counterpartyUserId: null,
    collabCompanyUserId: USER_ID,
    status: "SENT",
    lifecycleStatus: null,
    totalCents: 10000,
  },
  {
    counterpartyUserId: null,
    collabCompanyUserId: USER_ID,
    status: "OVERDUE",
    lifecycleStatus: null,
    totalCents: 5000,
  },
  // Cascade openstaand: legacy status blijft DRAFT, lifecycleStatus is de waarheid.
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "SUBMITTED",
    totalCents: 20000,
  },
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "APPROVED",
    totalCents: 30000,
  },
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "OVERDUE",
    totalCents: 7000,
  },
  // Legacy loose betaald: counterpartyUserId NULL, samenwerking van USER_ID — de regressie.
  {
    counterpartyUserId: null,
    collabCompanyUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 50000,
  },
  // Betaalde cascade-facturen: legacy status blijft DRAFT, lifecycleStatus is PAID/PROCESSED.
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: "PAID",
    totalCents: 99000,
  },
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PROCESSED",
    totalCents: 12000,
  },
  // Niet meegeteld: geannuleerd, concept, teruggedraaid.
  {
    counterpartyUserId: null,
    collabCompanyUserId: USER_ID,
    status: "CANCELLED",
    lifecycleStatus: null,
    totalCents: 8000,
  },
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "DRAFT",
    totalCents: 40000,
  },
  {
    counterpartyUserId: USER_ID,
    collabCompanyUserId: USER_ID,
    status: "CANCELLED",
    lifecycleStatus: "CREDITED",
    totalCents: 33000,
  },
  // Andere opdrachtgever: mag nooit meetellen (scoping via de samenwerking-eigenaar).
  {
    counterpartyUserId: "c2",
    collabCompanyUserId: "c2",
    status: "PAID",
    lifecycleStatus: "PAID",
    totalCents: 456700,
  },
  // Legacy loose factuur op de samenwerking van een ándere opdrachtgever (counterpartyUserId NULL,
  // eigenaar c2): mag ook niet meetellen — isolatie loopt via de relatie, niet via de kolom.
  {
    counterpartyUserId: null,
    collabCompanyUserId: "c2",
    status: "SENT",
    lifecycleStatus: null,
    totalCents: 777000,
  },
];

const invoiceAggregate = vi.fn(async ({ where }: { where: InvoiceWhere }) => {
  const sum = INVOICES.filter((inv) => matchWhere(where, inv)).reduce(
    (acc, inv) => acc + inv.totalCents,
    0,
  );
  return { _sum: { totalCents: sum } };
});

vi.mock("@/lib/collaboration-alerts", () => ({
  clientCredentialAlerts: vi.fn(async () => []),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => ({ id: "co1" })) },
    invoice: { aggregate: (args: { where: InvoiceWhere }) => invoiceAggregate(args) },
    job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    collaboration: {
      groupBy: vi.fn(async () => []),
      count: vi.fn(async () => 0),
    },
    application: {
      groupBy: vi.fn(async () => []),
      aggregate: vi.fn(async () => ({ _min: { createdAt: null } })),
    },
  },
}));

describe("getClientStats — uitgaven (spentCents)", () => {
  beforeEach(() => {
    invoiceAggregate.mockClear();
  });

  it("telt cascade-PAID/PROCESSED én legacy loose PAID mee (regressie)", async () => {
    const stats = await getClientStats(USER_ID);
    // Legacy loose PAID (50000) + cascade PAID (99000) + cascade PROCESSED (12000).
    expect(stats?.spentCents).toBe(161000);
    // Onder de oude kolom-scope (`counterpartyUserId: userId`) viel de legacy loose PAID (50000) weg → 111000.
    expect(stats?.spentCents).not.toBe(111000);
  });

  it("sluit teruggedraaide (CREDITED)/geannuleerde/concept-facturen uit van de uitgaven", async () => {
    const stats = await getClientStats(USER_ID);
    expect(stats?.spentCents).toBe(161000);
  });

  it("scoopt op de eigen company (uitgaven van een andere eigenaar tellen niet mee)", async () => {
    const stats = await getClientStats(USER_ID);
    expect(stats?.spentCents).toBeLessThan(456700);
  });
});

describe("getClientStats — openstaand (openCents)", () => {
  beforeEach(() => {
    invoiceAggregate.mockClear();
  });

  it("telt legacy loose openstaand (counterpartyUserId NULL) mee — de regressie", async () => {
    const stats = await getClientStats(USER_ID);
    // Legacy loose SENT (10000) + legacy loose OVERDUE (5000) + cascade SUBMITTED (20000)
    // + APPROVED (30000) + cascade OVERDUE (7000).
    expect(stats?.openCents).toBe(72000);
    // Onder de oude kolom-scope vielen de legacy loose-rijen weg → 57000.
    expect(stats?.openCents).not.toBe(57000);
  });

  it("scoopt op de eigen company (openstaande factuur van een andere eigenaar telt niet mee)", async () => {
    const stats = await getClientStats(USER_ID);
    expect(stats?.openCents).toBeLessThan(777000);
  });
});
