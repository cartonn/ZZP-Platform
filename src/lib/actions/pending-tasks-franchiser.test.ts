// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie): de operationele
// bemiddelaar-attentiepunten "roster-ZZP'er niet inzetbaar" en "dienst staat te lang open zonder
// plaatsing" hoorden alléén op de dashboard-rail thuis, maar ontbraken op /acties en in de zijbalk-
// badge (beide gevoed door de item-engine `pendingTasks` → `franchiserTasks`). Een bemiddelaar die
// aantoonbaar "aan zet" was, zag daardoor op /acties/badge minder (of niets). Deze test borgt dat de
// item-engine die twee taken nu wél emitteert, met de juiste id/tone/prioriteit/deep-link, en dat ze
// verdwijnen zodra de onderliggende conditie is opgelost (inzetbaar / gevulde dienst).

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  roster: [] as {
    id: string;
    completeness: number;
    availability: string;
    user: { name: string | null; identityVerifiedAt: Date | null; lastLoginAt: Date | null };
    credentials: { type: string; status: string; expiresAt: Date | null }[];
  }[],
  stale: [] as { id: string; title: string; createdAt: Date }[],
  // Geleide-opzet-tellingen — default een volledig opgezette franchise, zodat de opzet-taken
  // standaard NIET verschijnen en de operationele-taak-tests geïsoleerd blijven.
  counts: { companies: 1, freelancers: 1, publishedDiensten: 1, companiesWithoutDiensten: 0 },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    credential: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    // company.count wordt twee keer aangeroepen: alle opdrachtgevers (`{tenantId}`) en
    // opdrachtgevers-zonder-gepubliceerde-dienst (`jobs: { none: … }`). De tweede is te herkennen
    // aan het jobs-filter.
    company: {
      count: vi.fn(async (args: { where?: { jobs?: unknown } }) =>
        args?.where?.jobs ? state.counts.companiesWithoutDiensten : state.counts.companies,
      ),
    },
    freelancerProfile: {
      findMany: vi.fn(async () => state.roster),
      count: vi.fn(async () => state.counts.freelancers),
    },
    // job.findMany wordt twee keer aangeroepen: open-diensten (voor de acute-taak) en de stale-lijst.
    // De stale-query is te herkennen aan het collaborations-none-filter; open-diensten geven we leeg
    // terug zodat de acute-tak (fill-signals/summarize) inert blijft en de test de twee nieuwe taken
    // isoleert. job.count telt de gepubliceerde diensten voor de geleide opzet.
    job: {
      findMany: vi.fn(async (args: { where?: { collaborations?: unknown } }) =>
        args?.where?.collaborations ? state.stale : [],
      ),
      count: vi.fn(async () => state.counts.publishedDiensten),
    },
  },
}));

// Geen open diensten → geen fill-signals nodig; toch stubben zodat er geen prisma-pad opengaat.
vi.mock("@/lib/franchise/dienst-fill-signal", () => ({
  getRosterFillSignalsForTenant: vi.fn(async () => new Map()),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-franchiser", role: "FRANCHISER", status: "ACTIVE" } as const;

const now = new Date();
const engaged = {
  id: "prof-actief",
  completeness: 100,
  availability: "AVAILABLE",
  user: { name: "Actieve ZZP'er", identityVerifiedAt: now, lastLoginAt: now },
  credentials: [
    { type: "VOG", status: "VERIFIED", expiresAt: null },
    { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
  ],
};
const notEngaged = {
  id: "prof-inactief",
  completeness: 40,
  availability: "AVAILABLE",
  // Geen VOG/verzekering → verplichte documenten ontbreken → computeEngageability = INACTIEF.
  user: { name: "Niet-inzetbare ZZP'er", identityVerifiedAt: null, lastLoginAt: now },
  credentials: [] as { type: string; status: string; expiresAt: Date | null }[],
};

beforeEach(() => {
  state.roster = [];
  state.stale = [];
  state.counts = {
    companies: 1,
    freelancers: 1,
    publishedDiensten: 1,
    companiesWithoutDiensten: 0,
  };
});

describe("bemiddelaar next-actions — niet-inzetbare ZZP'er telt op /acties + badge", () => {
  it("emitteert franchise-not-engageable voor een INACTIEF roster-lid, niet voor een inzetbare", async () => {
    state.roster = [engaged, notEngaged];
    const tasks = await pendingTasks(ACTOR);
    const notEng = tasks.filter((t) => t.kind === "franchise-not-engageable");
    expect(notEng).toHaveLength(1);
    const task = notEng[0];
    expect(task).toBeDefined();
    expect(task?.id).toBe("franchise-not-engageable:prof-inactief");
    expect(task?.tone).toBe("attention");
    expect(task?.href).toBe("/franchise/zzpers/prof-inactief");
    expect(task?.title).toContain("Niet-inzetbare ZZP'er");
    expect(task?.title).toContain("nog niet inzetbaar");
  });

  it("verdwijnt zodra het roster volledig inzetbaar is", async () => {
    state.roster = [engaged];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-not-engageable")).toBe(false);
  });
});

describe("bemiddelaar next-actions — te lang open dienst telt op /acties + badge", () => {
  it("emitteert franchise-stale-service met de juiste deep-link en dagentelling", async () => {
    const created = new Date(now.getTime() - 10 * 86_400_000);
    state.stale = [{ id: "dienst-1", title: "Nachtdienst IC", createdAt: created }];
    const tasks = await pendingTasks(ACTOR);
    const stale = tasks.filter((t) => t.kind === "franchise-stale-service");
    expect(stale).toHaveLength(1);
    const task = stale[0];
    expect(task).toBeDefined();
    expect(task?.id).toBe("franchise-stale-service:dienst-1");
    expect(task?.href).toBe("/franchise/diensten/dienst-1");
    expect(task?.tone).toBe("attention");
    expect(task?.title).toContain("Nachtdienst IC");
    expect(task?.title).toMatch(/10 dagen/);
  });

  it("toont geen stale-taak wanneer er geen te lang open dienst is", async () => {
    state.stale = [];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-stale-service")).toBe(false);
  });
});

// Single-source-invariant (persona-sweep run 40): de geleide-opzet-stappen leefden alléén op de
// dashboard-rail, niet op /acties + de zijbalk-badge (item-engine). Deze test borgt dat de item-engine
// ze nu wél emitteert, met de canonieke id/tone/href/prioriteit uit franchiserNextActions.
describe("bemiddelaar next-actions — geleide opzet telt op /acties + badge", () => {
  it("emitteert de opzet-stappen als item-taken voor een lege tenant", async () => {
    state.counts = {
      companies: 0,
      freelancers: 0,
      publishedDiensten: 0,
      companiesWithoutDiensten: 0,
    };
    const tasks = await pendingTasks(ACTOR);
    const guided = tasks.filter((t) => t.kind === "franchise-guided-setup");
    // Lege tenant: eerste-opdrachtgever (90) + roster (70) — geen zinloze dienst-stap.
    expect(guided.map((t) => t.id)).toEqual([
      "franchise-guided-setup:franchiser-first-client",
      "franchise-guided-setup:franchiser-roster-empty",
    ]);
    const first = guided[0];
    expect(first?.tone).toBe("info");
    expect(first?.href).toBe("/franchise/opdrachtgevers/nieuw");
    expect(first?.resolver).toBe("link");
    // Ranking (badge/lijst-volgorde): first-client (90) staat boven roster (70).
    expect((guided[0]?.priority ?? 0) > (guided[1]?.priority ?? 0)).toBe(true);
  });

  it("nudget opdrachtgevers-zonder-diensten zodra de franchise draait", async () => {
    state.counts = {
      companies: 2,
      freelancers: 1,
      publishedDiensten: 1,
      companiesWithoutDiensten: 1,
    };
    const tasks = await pendingTasks(ACTOR);
    const guided = tasks.filter((t) => t.kind === "franchise-guided-setup");
    expect(guided.map((t) => t.id)).toEqual([
      "franchise-guided-setup:franchiser-clients-without-service",
    ]);
    expect(guided[0]?.title).toContain("1 opdrachtgever");
    expect(guided[0]?.href).toBe("/franchise/opdrachtgevers");
  });

  it("toont geen opzet-taak zodra de franchise volledig staat", async () => {
    state.counts = {
      companies: 3,
      freelancers: 4,
      publishedDiensten: 5,
      companiesWithoutDiensten: 0,
    };
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-guided-setup")).toBe(false);
  });
});
