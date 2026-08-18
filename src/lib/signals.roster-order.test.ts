// Cross-surface next-action-defect (DOEL 1b) voor de FRANCHISER-rol; geparkeerde bevinding uit
// persona-sweep run 81 (outer-window-blindheid op de roster-inzetbaarheidsscan).
//
// Defect: de roster-`freelancerProfile.findMany({ where: { tenantId } })` draait op TWEE oppervlakken —
// de /franchise/zzpers-nav-badge (`navBadges` → `rosterAlerts` in signals.ts) én de autoritaire
// /acties-bron (`pendingTasks` → `franchiserTasks`, pending-tasks.ts). Beide capten op 50 (`id: asc`),
// dus een niet-inzetbaar (plaatsing-blokkerend, INACTIEF) roster-lid voorbij de 50e viel op BEIDE
// oppervlakken permanent weg — en omdat de blokkerende actie (ontbrekend/verlopen verplicht document)
// geen venster bumpt, was dat niet self-healing (undercount t.o.v. de onbegrensde /franchise/zzpers-lijst).
//
// Fix: beide roster-queries scannen ONGEWINDOWD de volledige tenant-roster (geen `take`), via de
// gedeelde `roster-engageability.ts`-select/evaluatie → geen 50-cap-blindheid meer én geen drift tussen
// badge en /acties. Deze test is rood zodra de nav-badge-query weer een `take` krijgt.

import { beforeEach, describe, expect, it, vi } from "vitest";

type RosterQuery = { where?: { tenantId?: string }; orderBy?: unknown; take?: number };
let rosterQueries: RosterQuery[] = [];

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ tenantId: "tenant-1" })) },
    company: { findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
    shiftHandoff: { count: vi.fn(async () => 0) },
    credential: { findMany: vi.fn(async () => []) },
    freelancerProfile: {
      findMany: vi.fn(async (a: RosterQuery) => {
        rosterQueries.push(a);
        return [];
      }),
    },
    job: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []), groupBy: vi.fn(async () => []) },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  rosterQueries = [];
});

describe("navBadges FRANCHISER — roster-inzetbaarheid scant ongewindowd (DOEL 1b)", () => {
  it("de roster-query scant de volledige tenant-roster (geen take-cap → geen 50-cap-blindheid)", async () => {
    await navBadges("FRANCHISER", "u-1");
    // De FRANCHISER-badge draait één roster-`freelancerProfile.findMany` (gescoped op tenantId); die
    // voedt de niet-inzetbaar-telling. Assert dat de query ONGEWINDOWD is (geen `take`), zodat een
    // niet-inzetbaar roster-lid voorbij de 50e niet stil uit de badge valt — gelijk aan de /acties-bron
    // (pending-tasks.ts), die exact dezelfde ongewindowde scan draait.
    const roster = rosterQueries.find((q) => q.where?.tenantId === "tenant-1");
    expect(roster).toBeDefined();
    expect(roster?.take).toBeUndefined();
  });
});
