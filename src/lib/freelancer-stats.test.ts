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
  issuerUserId?: string | null;
  issuerKey?: string | null;
  status?: WhereValue;
  lifecycleStatus?: WhereValue;
  collaboration?: { is?: { freelancer?: { is?: { userId?: string } } } };
  OR?: InvoiceWhere[];
  AND?: InvoiceWhere[];
}

interface InvoiceFixture {
  issuerUserId: string | null;
  /** null = legacy (handmatige) factuur; "PLATFORM" = platform-fee; userId = cascade. */
  issuerKey: string | null;
  /** De ZZP'er van de gekoppelde samenwerking (voor de legacy-scoping via de relatie). */
  collaborationFreelancerUserId: string | null;
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
  if (where.issuerUserId !== undefined && inv.issuerUserId !== where.issuerUserId) return false;
  if (where.issuerKey !== undefined && inv.issuerKey !== where.issuerKey) return false;
  if (!matchField(where.status, inv.status)) return false;
  if (!matchField(where.lifecycleStatus, inv.lifecycleStatus)) return false;
  const collabUserId = where.collaboration?.is?.freelancer?.is?.userId;
  if (collabUserId !== undefined && inv.collaborationFreelancerUserId !== collabUserId)
    return false;
  if (where.OR && !where.OR.some((branch) => matchWhere(branch, inv))) return false;
  if (where.AND && !where.AND.every((branch) => matchWhere(branch, inv))) return false;
  return true;
}

const USER_ID = "u1";

// Gemengde fixture: legacy én cascade facturen. Cascade-facturen houden hun legacy `status` op DRAFT
// terwijl ze via `lifecycleStatus` door de keten bewegen — precies het gat dat de KPI eerder miste.
// Cascade/gemigreerde-legacy fixture: issuerUserId gezet → matcht de eerste scope-tak (issuerUserId).
const own = (
  status: string,
  lifecycleStatus: string | null,
  totalCents: number,
): InvoiceFixture => ({
  issuerUserId: USER_ID,
  issuerKey: USER_ID,
  collaborationFreelancerUserId: USER_ID,
  status,
  lifecycleStatus,
  totalCents,
});

const INVOICES: InvoiceFixture[] = [
  // Legacy openstaand (geen lifecycleStatus).
  own("SENT", null, 10000),
  own("OVERDUE", null, 5000),
  // Cascade openstaand: legacy status blijft DRAFT, lifecycleStatus is de waarheid.
  own("DRAFT", "SUBMITTED", 20000),
  own("DRAFT", "APPROVED", 30000),
  own("DRAFT", "OVERDUE", 7000),
  // Niet openstaand: cascade DRAFT (nog geen verplichting), betaald, gecancelled, legacy DRAFT.
  own("DRAFT", "DRAFT", 40000),
  own("PAID", "PAID", 99000),
  own("CANCELLED", null, 8000),
  own("DRAFT", null, 15000),
  own("PAID", null, 50000),
  // Betaalde cascade-facturen: legacy status blijft DRAFT, lifecycleStatus is PAID/PROCESSED. Deze
  // horen bij "betaald" (earnedCents) maar NIET bij "openstaand" — het gat dat earnedCents eerder miste.
  own("DRAFT", "PAID", 25000),
  own("DRAFT", "PROCESSED", 12000),
  // Teruggedraaid: cascade CREDITED telt niet als binnengekomen geld (en ook niet als openstaand).
  own("CANCELLED", "CREDITED", 33000),
  // Legacy (handmatige) facturen ZONDER issuerUserId/issuerKey: horen bij deze ZZP'er alleen via de
  // gekoppelde samenwerking. Het scoping-gat dat deze run dicht — vielen eerder volledig weg.
  {
    issuerUserId: null,
    issuerKey: null,
    collaborationFreelancerUserId: USER_ID,
    status: "SENT",
    lifecycleStatus: null,
    totalCents: 3000,
  },
  {
    issuerUserId: null,
    issuerKey: null,
    collaborationFreelancerUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 4000,
  },
  // Platform-fee op de samenwerking van deze ZZP'er (issuerKey "PLATFORM"): mag NOOIT als eigen omzet
  // meetellen — de legacy-tak sluit 'm uit via `issuerKey: null`.
  {
    issuerUserId: null,
    issuerKey: "PLATFORM",
    collaborationFreelancerUserId: USER_ID,
    status: "PAID",
    lifecycleStatus: "PAID",
    totalCents: 777000,
  },
  // Andere ZZP'er: mag nooit meetellen (scoping op issuerUserId én op de samenwerkings-freelancer).
  {
    issuerUserId: "u2",
    issuerKey: "u2",
    collaborationFreelancerUserId: "u2",
    status: "SENT",
    lifecycleStatus: null,
    totalCents: 123400,
  },
  {
    issuerUserId: "u2",
    issuerKey: "u2",
    collaborationFreelancerUserId: "u2",
    status: "DRAFT",
    lifecycleStatus: "PAID",
    totalCents: 456700,
  },
  // Legacy factuur van een ándere ZZP'er (geen issuerUserId): mag ook niet lekken via de relatie-tak.
  {
    issuerUserId: null,
    issuerKey: null,
    collaborationFreelancerUserId: "u2",
    status: "PAID",
    lifecycleStatus: null,
    totalCents: 888800,
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
    // 10000 (SENT) + 5000 (legacy OVERDUE) + 20000 (SUBMITTED) + 30000 (APPROVED) + 7000 (cascade OVERDUE)
    // + 3000 (legacy SENT zonder issuerUserId, via de samenwerking) = 75000.
    expect(stats?.pendingCents).toBe(75000);
  });

  it("sluit betaalde, geannuleerde en (cascade)concept-facturen uit van Openstaand", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // Betaald (99000/50000), geannuleerd (8000), cascade-concept (40000) en legacy-concept (15000)
    // zitten NIET in het totaal — het blijft precies 75000.
    expect(stats?.pendingCents).toBe(75000);
    // Zonder de fix (alleen legacy status IN (SENT,OVERDUE)) zou het totaal 15000 zijn.
    expect(stats?.pendingCents).not.toBe(15000);
  });

  it("telt een openstaande legacy-factuur zonder issuerUserId mee via de samenwerking (scoping-fix)", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De legacy SENT-factuur van 3000 (issuerUserId/issuerKey null) hoort bij deze ZZP'er alleen via
    // de gekoppelde samenwerking. Vóór de fix (scoping puur op issuerUserId) viel 'ie volledig weg →
    // 72000; met de fix telt 'ie mee → 75000.
    expect(stats?.pendingCents).toBe(75000);
    expect(stats?.pendingCents).not.toBe(72000);
  });

  it("scoopt op de ingelogde ZZP'er (facturen van een andere uitschrijver tellen niet mee)", async () => {
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
    // Legacy PAID (99000 status-PAID + 50000) + cascade PAID (25000) + cascade PROCESSED (12000)
    // + legacy PAID zonder issuerUserId (4000, via de samenwerking) = 190000.
    expect(stats?.earnedCents).toBe(190000);
    // Zonder de fix (alleen legacy `status: "PAID"`) zou het 149000 zijn — de cascade-facturen die
    // hun legacy status op DRAFT houden vielen weg.
    expect(stats?.earnedCents).not.toBe(149000);
  });

  it("sluit teruggedraaide (CREDITED) en openstaande facturen uit van betaalde omzet", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De CREDITED-factuur (33000) en alle openstaande/concept-facturen tellen niet als binnengekomen geld.
    expect(stats?.earnedCents).toBe(190000);
  });

  it("telt een betaalde legacy-factuur zonder issuerUserId mee, maar de platform-fee niet (scoping-fix)", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De legacy PAID-factuur van 4000 (issuerUserId/issuerKey null) telt mee via de samenwerking; de
    // platform-fee van 777000 (issuerKey "PLATFORM") NIET. Vóór de fix was het 186000.
    expect(stats?.earnedCents).toBe(190000);
    expect(stats?.earnedCents).not.toBe(186000);
    // De platform-fee lekt niet in de eigen omzet.
    expect(stats?.earnedCents).toBeLessThan(777000);
  });

  it("scoopt op de ingelogde ZZP'er (betaalde factuur van een andere samenwerking-eigenaar telt niet mee)", async () => {
    const stats = await getFreelancerStats(USER_ID);
    // De betaalde u2-cascade-factuur (456700) én de legacy u2-factuur (888800, via de samenwerking van
    // een ándere ZZP'er) zitten niet in het totaal.
    expect(stats?.earnedCents).toBeLessThan(456700);
  });
});
