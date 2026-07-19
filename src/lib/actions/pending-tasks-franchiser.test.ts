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
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    credential: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    freelancerProfile: { findMany: vi.fn(async () => state.roster) },
    // job.findMany wordt twee keer aangeroepen: open-diensten (voor de acute-taak) en de stale-lijst.
    // De stale-query is te herkennen aan het collaborations-none-filter; open-diensten geven we leeg
    // terug zodat de acute-tak (fill-signals/summarize) inert blijft en de test de twee nieuwe taken
    // isoleert.
    job: {
      findMany: vi.fn(async (args: { where?: { collaborations?: unknown } }) =>
        args?.where?.collaborations ? state.stale : [],
      ),
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
});

describe("bemiddelaar next-actions — niet-inzetbare ZZP'er telt op /acties + badge", () => {
  it("emitteert franchise-not-engageable voor een INACTIEF roster-lid, niet voor een inzetbare", async () => {
    state.roster = [engaged, notEngaged];
    const tasks = await pendingTasks(ACTOR);
    const notEng = tasks.filter((t) => t.kind === "franchise-not-engageable");
    expect(notEng).toHaveLength(1);
    expect(notEng[0].id).toBe("franchise-not-engageable:prof-inactief");
    expect(notEng[0].tone).toBe("attention");
    expect(notEng[0].href).toBe("/franchise/zzpers/prof-inactief");
    expect(notEng[0].title).toContain("Niet-inzetbare ZZP'er");
    expect(notEng[0].title).toContain("nog niet inzetbaar");
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
    expect(stale[0].id).toBe("franchise-stale-service:dienst-1");
    expect(stale[0].href).toBe("/franchise/diensten/dienst-1");
    expect(stale[0].tone).toBe("attention");
    expect(stale[0].title).toContain("Nachtdienst IC");
    expect(stale[0].title).toMatch(/10 dagen/);
  });

  it("toont geen stale-taak wanneer er geen te lang open dienst is", async () => {
    state.stale = [];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.some((t) => t.kind === "franchise-stale-service")).toBe(false);
  });
});
