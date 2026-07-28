// Cross-surface next-action-defect (DOEL 1b, "signaal op één oppervlak" — badge-divergentie boven 50)
// voor de FREELANCER-rol; persona-sweep 2026-07-28 (run 55).
//
// Defect (LOW-MED): de FREELANCER `/samenwerkingen`-nav-badge (`cascadeWork`, `navBadges` in signals.ts)
// telt lopende/voorgestelde samenwerkingen via een `collaboration.findMany` die — anders dan de
// autoritaire /acties-bron (`freelancerTasks`, pending-tasks.ts, `orderBy: { updatedAt: "desc" }`) —
// GÉÉN `orderBy` had. Beide cappen op 50 (`CASCADE_SCAN_LIMIT === MAX === 50`); bij >50 lopende/
// voorgestelde samenwerkingen pakten de twee (structureel verschillende) queries een andere 50-rij-
// subset → een ander cascade-taakaantal → de badge divergeerde van /acties + de dashboard-rail.
// Exact dezelfde klasse als de run-54-fix voor de FRANCHISER credential-expiry-badge.
//
// Fix: `orderBy: { updatedAt: "desc" }` op de badge-query → beide truncaten identiek. Deze test is rood
// zonder die orderBy.

import { beforeEach, describe, expect, it, vi } from "vitest";

let lastCollabQuery: { orderBy?: unknown; take?: number } | null = null;

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: vi.fn(async () => ({ id: "fp-1" })) },
    credential: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
    },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    invoice: { count: vi.fn(async () => 0) },
    collaboration: {
      findMany: vi.fn(async (a: { orderBy?: unknown; take?: number }) => {
        lastCollabQuery = a;
        return [];
      }),
    },
    savedJob: { count: vi.fn(async () => 0) },
    message: { groupBy: vi.fn(async () => []) },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  lastCollabQuery = null;
});

describe("navBadges FREELANCER — cascade-badge truncateert deterministisch (DOEL 1b)", () => {
  it("de cascade-collab-query heeft orderBy updatedAt desc + take 50 (gelijk aan /acties)", async () => {
    await navBadges("FREELANCER", "u-1");
    expect(lastCollabQuery?.orderBy).toEqual({ updatedAt: "desc" });
    expect(lastCollabQuery?.take).toBe(50);
  });
});
