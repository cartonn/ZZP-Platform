// Cross-surface next-action-defect (DOEL 1b, "signaal op één oppervlak" — badge-divergentie boven 50)
// voor de FRANCHISER-rol; geparkeerde NIT uit persona-sweep run 68.
//
// Defect (NIT → drift-preventie): de roster-`freelancerProfile.findMany({ where: { tenantId } })` draait
// op TWEE oppervlakken — de /franchise/zzpers-nav-badge (`navBadges` → `rosterAlerts` in signals.ts) én
// de autoritaire /acties-bron (`pendingTasks` → `franchiserTasks`, pending-tasks.ts). Beide cappen op 50
// (`CASCADE_SCAN_LIMIT === MAX === 50`), maar de badge-query had GÉÉN `orderBy`. Bij >50 roster-leden per
// tenant pakken de twee onafhankelijke queries niet-gegarandeerd hetzelfde 50-rij-subset → een andere
// `notEngageable`-telling → de badge divergeert van /acties. Exact dezelfde klasse als de freelancer-
// cascade-badge (signals.freelancer-cascade-order.test.ts) en de franchiser credential-expiry-badge.
//
// Fix: `orderBy: { id: "asc" }` op beide roster-queries → beide truncaten identiek. Deze test is rood
// zonder die orderBy op de nav-badge-query.

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

describe("navBadges FRANCHISER — roster-badge truncateert deterministisch (DOEL 1b)", () => {
  it("de roster-query heeft orderBy { id: asc } + take 50 (gelijk aan /acties)", async () => {
    await navBadges("FRANCHISER", "u-1");
    // De FRANCHISER-badge draait één roster-`freelancerProfile.findMany` (gescoped op tenantId, take 50);
    // die voedt de niet-inzetbaar-telling. Assert de deterministische-truncatie-invariant zodat de badge
    // hetzelfde 50-rij-subset pakt als de /acties-bron (pending-tasks.ts).
    const roster = rosterQueries.find((q) => q.where?.tenantId === "tenant-1");
    expect(roster).toBeDefined();
    expect(roster?.orderBy).toEqual({ id: "asc" });
    expect(roster?.take).toBe(50);
  });
});
