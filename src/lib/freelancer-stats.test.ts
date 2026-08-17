import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFreelancerStats, ratePercent } from "@/lib/freelancer-stats";

describe("ratePercent", () => {
  it("berekent een afgerond percentage", () => {
    expect(ratePercent(1, 4)).toBe(25);
    expect(ratePercent(2, 3)).toBe(67);
  });

  it("is 0 bij geen of negatief totaal (geen deling door nul)", () => {
    expect(ratePercent(0, 0)).toBe(0);
    expect(ratePercent(5, 0)).toBe(0);
    expect(ratePercent(1, -3)).toBe(0);
  });

  it("is 100 als het deel gelijk is aan het totaal", () => {
    expect(ratePercent(7, 7)).toBe(100);
  });
});

// --- getFreelancerStats: "Openstaand"-KPI over legacy + cascade facturen -------------------------

type WhereValue = string | null | { in?: readonly string[]; notIn?: readonly string[] };
interface InvoiceWhere {
  // Relationele scope: `collaboration: { freelancer: { userId } }` — de kolom `issuerUserId` wordt
  // niet meer gebruikt (die is NULL voor legacy loose-facturen).
  collaboration?: { freelancer?: { userId?: string } };
  status?: WhereValue;
  lifecycleStatus?: WhereValue;
  OR?: InvoiceWhere[];
}

interface InvoiceFixture {
  /** De kolom die alleen de cascade-handler zet — NULL voor legacy loose-facturen. */
  issuerUserId: string | null;
  /** `collaboration.freelancer.userId` — altijd gevuld (de eigenaar van de samenwerking). */
  collabFreelancerUserId: string;
  status: string;
  lifecycleStatus: string | null;
  totalCents: number;
}

/** Minimale interpretatie van de Prisma-where-vormen die getFreelancerStats gebruikt. */
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

// Gemengde fixture: legacy loose-facturen (issuerUserId NULL — nooit door de cascade-handler gezet)
// én cascade-facturen. Cascade-facturen houden hun legacy `status` op DRAFT terwijl ze via
// `lifecycleStatus` door de keten bewegen. De relationele scope (`collaboration.freelancer.userId`)
// telt beide paden mee; de oude kolom-scope (`issuerUserId: userId`) liet de legacy loose-rijen vallen.
const INVOICES: InvoiceFixture[] = [
  // Legacy loose openstaand: issuerUserId NULL, maar de samenwerking is van USER_ID. Onder de oude
  // kolom-scope vielen deze weg — dit is precies de regressie.
  {
    issuerUserId: null,
    collabFreelancerUserId: USER_ID,
    status: "SENT",
    lifecycleStatus: null,
    totalCents: 10000,
  },
  {
    issuerUserId: null,
    collabFreelancerUserId: USER_ID,
    status: "OVERDUE",
    lifecycleStatus: null,
    totalCents: 5000,
  },
  // Cascade openstaand: legacy status blijft DRAFT, lifecycleStatus is de waarheid.
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "SUBMITTED",
    totalCents: 20000,
  },
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "APPROVED",
    totalCents: 30000,
  },
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "OVERDUE",
    totalCents: 7000,
  },
  // Niet openstaand: cascade DRAFT (nog geen verplichting), betaald, gecancelled, legacy DRAFT.
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "DRAFT",
    totalCents: 40000,
  },
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: "PAID",
    totalCents: 99000,
  },
  {
    issuerUserId: null,
    collabFreelancerUserId: USER_ID,
    status: "CANCELLED",
    lifecycleStatus: null,
    totalCents: 8000,
  },
  {
    issuerUserId: null,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: null,
    totalCents: 15000,
  },
  // Legacy loose betaald: issuerUserId NULL, samenwerking van USER_ID. Regressie: onder de oude
  // kolom-scope viel deze betaalde omzet weg.
  {
    issuerUserId: null,
    collabFreelancerUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 50000,
  },
  // Betaalde cascade-facturen: legacy status blijft DRAFT, lifecycleStatus is PAID/PROCESSED. Deze
  // horen bij "betaald" (earnedCents) maar NIET bij "openstaand".
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PAID",
    totalCents: 25000,
  },
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "DRAFT",
    lifecycleStatus: "PROCESSED",
    totalCents: 12000,
  },
  // Teruggedraaid: cascade CREDITED telt niet als binnengekomen geld (en ook niet als openstaand).
  {
    issuerUserId: USER_ID,
    collabFreelancerUserId: USER_ID,
    status: "CANCELLED",
    lifecycleStatus: "CREDITED",
    totalCents: 33000,
  },
  // Andere ZZP'er: mag nooit meetellen (scoping via de samenwerking-eigenaar).
  {
    issuerUserId: "u2",
    collabFreelancerUserId: "u2",
    status: "SENT",
    lifecycleStatus: null,
    totalCents: 123400,
  },
  {
    issuerUserId: "u2",
    collabFreelancerUserId: "u2",
    status: "DRAFT",
    lifecycleStatus: "PAID",
    totalCents: 456700,
  },
  // Legacy loose factuur op de samenwerking van een ándere ZZP'er (issuerUserId NULL, eigenaar u2):
  // mag ook niet meetellen — isolatie loopt via de relatie, niet via de kolom.
  {
    issuerUserId: null,
    collabFreelancerUserId: "u2",
    status: "PAID",
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

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findUnique: vi.fn(async () => ({ id: "p1", availability: "AVAILABLE" })),
    },
    invoice: { aggregate: (args: { where: InvoiceWhere }) => invoiceAggregate(args) },
    performance: { aggregate: vi.fn(async () => ({ _sum: { hours: 0 } })) },
    collaboration: { groupBy: vi.fn(async () => []) },
    application: {
      groupBy: vi.fn(async () => []),
      aggregate: vi.fn(async () => ({ _avg: { matchScore: null } })),
    },
  },
}));

describe("getFreelancerStats — Openstaand-KPI", () => {
  beforeEach(() => {
    invoiceAggregate.mockClear();
  });

  it("telt openstaande cascade-facturen (SUBMITTED/APPROVED/OVERDUE) mee ondanks legacy status DRAFT", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // 10000 (legacy loose SENT) + 5000 (legacy loose OVERDUE) + 20000 (SUBMITTED) + 30000 (APPROVED)
    // + 7000 (cascade OVERDUE)
    expect(stats?.pendingCents).toBe(72000);
  });

  it("telt legacy loose-facturen (issuerUserId NULL) mee in Openstaand — de regressie", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De twee legacy loose-facturen (issuerUserId NULL, samenwerking van USER_ID) leveren 15000. Onder
    // de oude kolom-scope (`issuerUserId: userId`) vielen die weg → 57000; met de relationele scope 72000.
    expect(stats?.pendingCents).toBe(72000);
    expect(stats?.pendingCents).not.toBe(57000);
  });

  it("sluit betaalde, geannuleerde en (cascade)concept-facturen uit van Openstaand", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // Betaald (99000/50000), geannuleerd (8000), cascade-concept (40000) en legacy-concept (15000)
    // zitten NIET in het totaal — het blijft precies 72000.
    expect(stats?.pendingCents).toBe(72000);
  });

  it("scoopt op de ingelogde ZZP'er (facturen van een andere samenwerking-eigenaar tellen niet mee)", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De u2-factuur van 123400 zit niet in het totaal.
    expect(stats?.pendingCents).toBeLessThan(123400);
  });
});

describe("getFreelancerStats — betaalde omzet (earnedCents)", () => {
  beforeEach(() => {
    invoiceAggregate.mockClear();
  });

  it("telt cascade-PAID/PROCESSED mee ondanks legacy status DRAFT (naast legacy PAID)", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // Cascade PAID (99000) + legacy loose PAID (50000) + cascade PAID (25000) + cascade PROCESSED (12000).
    expect(stats?.earnedCents).toBe(186000);
  });

  it("telt de legacy loose betaalde factuur (issuerUserId NULL) mee — de regressie", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De legacy loose PAID-factuur (50000, issuerUserId NULL, samenwerking van USER_ID) hoort in het
    // totaal. Onder de oude kolom-scope (`issuerUserId: userId`) viel die weg → 136000.
    expect(stats?.earnedCents).toBe(186000);
    expect(stats?.earnedCents).not.toBe(136000);
  });

  it("sluit teruggedraaide (CREDITED) en openstaande facturen uit van betaalde omzet", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De CREDITED-factuur (33000) en alle openstaande/concept-facturen tellen niet als binnengekomen geld.
    expect(stats?.earnedCents).toBe(186000);
  });

  it("scoopt op de ingelogde ZZP'er (betaalde factuur van een andere samenwerking-eigenaar telt niet mee)", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De betaalde u2-cascade-factuur (456700) én de legacy loose u2-factuur (777000) tellen niet mee.
    expect(stats?.earnedCents).toBeLessThan(456700);
  });
});
