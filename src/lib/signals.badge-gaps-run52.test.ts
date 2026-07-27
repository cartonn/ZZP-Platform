import { beforeEach, describe, expect, it, vi } from "vitest";

import { countFranchiseDienstAlerts } from "./signals";

// Regressietests voor een cross-surface next-action-defect (DOEL 1b, "signaal op één oppervlak") voor
// de FRANCHISER-rol: `franchiserTasks` (/acties + de dashboard-rail) emit item-taken die naar
// /franchise/zzpers en /franchise/diensten wijzen, maar `navBadges` gaf die twee nav-items nooit een
// badge — een bemiddelaar die via de zijbalk navigeert kreeg nul visueel signaal.
//
// - /franchise/zzpers: niet-inzetbare roster-ZZP'ers (`franchiseNotEngageableTask`) + (bijna-)verlopende
//   certificaten (`franchiseCredentialExpiryTask`).
// - /franchise/diensten: acute open diensten (`franchiseAcuteDienstTask`) + te-lang-open/stale diensten
//   (`franchiseStaleDienstTask`/rollup).

// --- tenant-bewuste prisma-mock -------------------------------------------------------------------
// Elke query is gescoped op tenantId; de mock retourneert alleen de fixture van de tenant in de
// where-clause. Zo bewijst de isolatie-test dat een signaal in tenant B geen badge voor tenant A geeft.

interface RosterRow {
  id: string;
  completeness: number;
  availability: string;
  user: { identityVerifiedAt: Date | null; lastLoginAt: Date | null };
  credentials: { type: string; status: string; expiresAt: Date | null }[];
}
interface DienstRow {
  id: string;
  startDate: Date | null;
  _count: { collaborations: number };
}

let userTenant: string | null;
let lastExpiringQuery: { orderBy?: unknown; take?: number } | null = null;
let leadCount: number;
let handoffCount: number;
let expiringByTenant: Record<string, { freelancerProfileId: string }[]>;
let rosterByTenant: Record<string, RosterRow[]>;
let openDienstenByTenant: Record<string, DienstRow[]>;
let staleDienstenByTenant: Record<string, { id: string }[]>;

type Where = { where?: Record<string, unknown> };

function tenantOf(where: Record<string, unknown> | undefined): string {
  if (!where) return "";
  if (typeof where.tenantId === "string") return where.tenantId;
  const fp = where.freelancerProfile as { tenantId?: string } | undefined;
  return fp?.tenantId ?? "";
}

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: () => Promise.resolve({ tenantId: userTenant }) },
    lead: { count: () => Promise.resolve(leadCount) },
    shiftHandoff: { count: () => Promise.resolve(handoffCount) },
    credential: {
      findMany: (a: Where & { orderBy?: unknown; take?: number }) => {
        lastExpiringQuery = a;
        return Promise.resolve(expiringByTenant[tenantOf(a.where)] ?? []);
      },
    },
    freelancerProfile: {
      findMany: (a: Where) => Promise.resolve(rosterByTenant[tenantOf(a.where)] ?? []),
    },
    job: {
      findMany: (a: Where) => {
        const tenant = tenantOf(a.where);
        // Twee job.findMany-aanroepen: stale bevat `collaborations: { none: ... }`, open niet.
        const isStale = a.where != null && "collaborations" in a.where;
        return Promise.resolve(
          isStale ? (staleDienstenByTenant[tenant] ?? []) : (openDienstenByTenant[tenant] ?? []),
        );
      },
    },
  },
}));

import { navBadges } from "./signals";

const fresh = new Date();

/** Roster-lid dat inzetbaar (ACTIEF) is: beide verplichte documenten geldig, profiel compleet, id geverifieerd. */
function engageableRow(id: string): RosterRow {
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 400);
  return {
    id,
    completeness: 100,
    availability: "AVAILABLE",
    user: { identityVerifiedAt: fresh, lastLoginAt: fresh },
    credentials: [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
    ],
  };
}

/** Roster-lid dat NIET inzetbaar (INACTIEF) is: VOG verlopen → blokkerend verplicht document. */
function notEngageableRow(id: string): RosterRow {
  const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10);
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 400);
  return {
    id,
    completeness: 100,
    availability: "AVAILABLE",
    user: { identityVerifiedAt: fresh, lastLoginAt: fresh },
    credentials: [
      { type: "VOG", status: "VERIFIED", expiresAt: past }, // verlopen → INACTIEF
      { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
    ],
  };
}

beforeEach(() => {
  userTenant = "tenant-a";
  leadCount = 0;
  handoffCount = 0;
  expiringByTenant = {};
  rosterByTenant = {};
  openDienstenByTenant = {};
  staleDienstenByTenant = {};
});

describe("countFranchiseDienstAlerts — pariteit met de diensten-taken op /acties", () => {
  it("geen acuut, geen stale → 0", () => {
    expect(countFranchiseDienstAlerts({ hasAcute: false, staleTaskCount: 0 })).toBe(0);
  });
  it("alleen acuut → 1 (het aggregaat)", () => {
    expect(countFranchiseDienstAlerts({ hasAcute: true, staleTaskCount: 0 })).toBe(1);
  });
  it("acuut + 2 stale → 3", () => {
    expect(countFranchiseDienstAlerts({ hasAcute: true, staleTaskCount: 2 })).toBe(3);
  });
  it("5 stale (max 3 rijen + 1 rollup) → 4", () => {
    expect(countFranchiseDienstAlerts({ hasAcute: false, staleTaskCount: 5 })).toBe(4);
  });
  it("acuut + 5 stale → 1 + 3 + 1 = 5", () => {
    expect(countFranchiseDienstAlerts({ hasAcute: true, staleTaskCount: 5 })).toBe(5);
  });
});

describe("navBadges FRANCHISER — /franchise/zzpers (DOEL 1b)", () => {
  it("één niet-inzetbare roster-ZZP'er (VOG verlopen) → /franchise/zzpers-badge count ≥1", async () => {
    rosterByTenant["tenant-a"] = [notEngageableRow("fp-1")];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/zzpers"]).toEqual({ count: 1, tone: "attention" });
  });

  it("(bijna-)verlopende certificaten tellen ook mee — som van beide signalen (geen dedup)", async () => {
    // Eén niet-inzetbaar profiel + twee profielen met binnenkort-verlopende certificaten.
    rosterByTenant["tenant-a"] = [notEngageableRow("fp-1"), engageableRow("fp-2")];
    expiringByTenant["tenant-a"] = [
      { freelancerProfileId: "fp-2" },
      { freelancerProfileId: "fp-3" },
    ];
    const badges = await navBadges("FRANCHISER", "u-1");
    // 1 niet-inzetbaar + 2 distinct verloop-profielen = 3.
    expect(badges["/franchise/zzpers"]).toEqual({ count: 3, tone: "attention" });
  });

  it("alle roster-ZZP'ers inzetbaar en geen verloop → geen /franchise/zzpers-badge", async () => {
    rosterByTenant["tenant-a"] = [engageableRow("fp-1"), engageableRow("fp-2")];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/zzpers"]).toBeUndefined();
  });

  it("de verloop-badge-query truncateert deterministisch (orderBy expiresAt asc, gelijk aan /acties)", async () => {
    // Regressie (run 54): de badge- en /acties-query cappen beide op 50, maar de badge-query miste
    // `orderBy`. Boven 50 verlopende certificaten binnen één tenant pakten de twee queries een andere
    // 50-rij-subset → een ander distinct-profiel-aantal → de badge divergeerde van /acties. Beide
    // moeten identiek ordenen zodat ze dezelfde 50 rijen truncaten.
    rosterByTenant["tenant-a"] = [engageableRow("fp-1")];
    await navBadges("FRANCHISER", "u-1");
    expect(lastExpiringQuery?.orderBy).toEqual({ expiresAt: "asc" });
    expect(lastExpiringQuery?.take).toBe(50);
  });
});

describe("navBadges FRANCHISER — /franchise/diensten (DOEL 1b)", () => {
  it("één acute open dienst (geen startdatum) → /franchise/diensten-badge count ≥1", async () => {
    openDienstenByTenant["tenant-a"] = [
      { id: "job-1", startDate: null, _count: { collaborations: 0 } },
    ];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/diensten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("een gevulde dienst telt niet als acuut → geen badge", async () => {
    openDienstenByTenant["tenant-a"] = [
      { id: "job-1", startDate: null, _count: { collaborations: 1 } },
    ];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/diensten"]).toBeUndefined();
  });

  it("acute dienst wordt uit de stale-lijst gefilterd (geen dubbeltelling)", async () => {
    // Dezelfde dienst is zowel acuut (geen start, ongevuld) als stale (oud); telt precies één keer.
    openDienstenByTenant["tenant-a"] = [
      { id: "job-1", startDate: null, _count: { collaborations: 0 } },
    ];
    staleDienstenByTenant["tenant-a"] = [{ id: "job-1" }];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/diensten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("een puur-stale dienst (niet acuut) telt als aparte rij", async () => {
    // Open dienst start ver in de toekomst → niet acuut; wel stale.
    openDienstenByTenant["tenant-a"] = [
      {
        id: "job-2",
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
        _count: { collaborations: 0 },
      },
    ];
    staleDienstenByTenant["tenant-a"] = [{ id: "job-2" }];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/diensten"]).toEqual({ count: 1, tone: "attention" });
  });
});

describe("navBadges FRANCHISER — cross-tenant isolatie + opgelost signaal", () => {
  it("een signaal in tenant B geeft GEEN badge voor de franchiser van tenant A", async () => {
    userTenant = "tenant-a";
    // Alle signalen staan onder tenant-b.
    rosterByTenant["tenant-b"] = [notEngageableRow("fp-b")];
    openDienstenByTenant["tenant-b"] = [
      { id: "job-b", startDate: null, _count: { collaborations: 0 } },
    ];
    const badges = await navBadges("FRANCHISER", "u-a");
    expect(badges["/franchise/zzpers"]).toBeUndefined();
    expect(badges["/franchise/diensten"]).toBeUndefined();
  });

  it("opgelost/afgehandeld signaal → badge verdwijnt (count 0, geen key)", async () => {
    // Roster is inzetbaar geworden en de acute dienst is gevuld.
    rosterByTenant["tenant-a"] = [engageableRow("fp-1")];
    openDienstenByTenant["tenant-a"] = [
      { id: "job-1", startDate: null, _count: { collaborations: 1 } },
    ];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/zzpers"]).toBeUndefined();
    expect(badges["/franchise/diensten"]).toBeUndefined();
  });

  it("bestaande leads/handoff-badges blijven onaangetast naast de nieuwe badges", async () => {
    leadCount = 2;
    handoffCount = 1;
    rosterByTenant["tenant-a"] = [notEngageableRow("fp-1")];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/leads"]).toEqual({ count: 2, tone: "attention" });
    expect(badges["/franchise/shift-overnames"]).toEqual({ count: 1, tone: "attention" });
    expect(badges["/franchise/zzpers"]).toEqual({ count: 1, tone: "attention" });
  });

  it("geen tenant → geen badges", async () => {
    userTenant = null;
    rosterByTenant["tenant-a"] = [notEngageableRow("fp-1")];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges).toEqual({});
  });
});
