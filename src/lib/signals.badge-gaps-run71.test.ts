import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor badge↔/acties-drift (persona-sweep run 71, DOEL 1b): een aflopende plaatsing binnen
// de tenant geeft op /acties (pending-tasks.ts `franchiseCollaborationRenewalTask`) een "plan een
// vervolg"-taak die naar /franchise/samenwerkingen linkt, maar de FRANCHISER-nav-badges telden alleen
// leads/shift-overnames/roster/diensten → /franchise/samenwerkingen had als enige franchiser-navitem een
// /acties-taak zonder badge (het "signaal op één oppervlak"-anti-patroon; de partij-zijde kreeg deze
// pariteit al in #1034). Deze test grendelt vast dat de badge het vervolgsignaal nu meetelt — via exact
// dezelfde gedeelde `renewalAttentionBadgeCount`/`countAttentionRenewals`-bron als /acties.

type Args = { where?: Record<string, unknown> };

const NOW = new Date();
const inDays = (d: number) => new Date(NOW.getTime() + d * 86_400_000);

// Eén aflopende, niet-gedisputeerde ACTIEVE plaatsing die binnen het aandacht-venster valt.
const endingSoon = { endDate: inDays(2) };

const state = { renewals: [] as { endDate: Date | null }[] };

const collaborationFindMany = vi.fn((_a: Args) => Promise.resolve(state.renewals));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(() => Promise.resolve({ tenantId: "t-1" })) },
    lead: { count: vi.fn(() => Promise.resolve(0)) },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    credential: { findMany: vi.fn(() => Promise.resolve([])) },
    freelancerProfile: { findMany: vi.fn(() => Promise.resolve([])) },
    job: { findMany: vi.fn(() => Promise.resolve([])) },
    collaboration: { findMany: (a: Args) => collaborationFindMany(a) },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  collaborationFindMany.mockClear();
  state.renewals = [];
});

describe("FRANCHISER /franchise/samenwerkingen-badge — vervolgsignaal telt mee (run 71)", () => {
  it("toont de badge wanneer een plaatsing binnen het venster afloopt (pariteit met /acties)", async () => {
    state.renewals = [endingSoon];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toEqual({ count: 1, tone: "attention" });
  });

  it("geen badge wanneer er geen aflopende plaatsing is (spiegelt geen taak op /acties)", async () => {
    state.renewals = [];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toBeUndefined();
  });

  it("scoopt de vervolg-query op de eigen tenant via job.tenantId (geen cross-tenant lek)", async () => {
    state.renewals = [endingSoon];
    await navBadges("FRANCHISER", "u-1");
    const arg = collaborationFindMany.mock.calls[0]?.[0];
    const where = arg?.where as
      | { job?: { tenantId?: string }; status?: string; disputedAt?: null }
      | undefined;
    expect(where?.job?.tenantId).toBe("t-1");
    expect(where?.status).toBe("ACTIVE");
    expect(where?.disputedAt).toBeNull();
  });
});
