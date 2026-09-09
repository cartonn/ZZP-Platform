import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor cross-surface next-action-drift (persona-sweep, DOEL 1b): de CLIENT
// /samenwerkingen-nav-badge telt de onderteken-bare PROPOSED-samenwerkingen
// (`countClientSignableProposals`, signals.ts). De list-bron `proposedCollabs` (pending-tasks.ts) is
// in run 81 bewust van `updatedAt desc` naar `createdAt asc` omgezet: `Collaboration.updatedAt` staat
// voor een PROPOSED-rij effectief bevroren op het aanmaakmoment, dus `updatedAt desc` capte de
// NIEUWSTE voorstellen en liet de OUDSTE — de langst-wachtende hires die om ondertekening vragen —
// buiten het (op CASCADE_SCAN_LIMIT) gecapte venster vallen (outer-window-blindheid). De badge droeg
// die bug nog (`updatedAt desc`): bij >CASCADE_SCAN_LIMIT gelijktijdige PROPOSED-samenwerkingen voor
// één opdrachtgever pakte de badge de nieuwste 50 terwijl /acties de oudste 50 toont → de twee
// subsets verschillen en de badge undercountte de gestrande, oudste voorstellen. Deze test grendelt
// de gedeelde ordening (`createdAt asc`) vast zodat beide oppervlakken op DEZELFDE rijen redeneren.

type Args = {
  where?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: unknown;
  take?: number;
};

const collaborationFindMany = vi.fn((_a: Args) => Promise.resolve([] as unknown[]));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(() => Promise.resolve({ tenantId: "t-1" })) },
    company: { findUnique: vi.fn(() => Promise.resolve({ id: "co-1" })) },
    freelancerProfile: {
      findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    application: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    job: { count: vi.fn(() => Promise.resolve(0)), findMany: vi.fn(() => Promise.resolve([])) },
    collaboration: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: (a: Args) => collaborationFindMany(a),
    },
    performance: { count: vi.fn(() => Promise.resolve(0)) },
    invoice: { count: vi.fn(() => Promise.resolve(0)), findMany: vi.fn(() => Promise.resolve([])) },
    lead: { count: vi.fn(() => Promise.resolve(0)) },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    credential: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
    notification: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

function isSignableProposalQuery(a: Args): boolean {
  const freelancer = a.select?.freelancer as { select?: Record<string, unknown> } | undefined;
  return a.where?.status === "PROPOSED" && freelancer?.select?.credentials !== undefined;
}

beforeEach(() => {
  collaborationFindMany.mockClear();
});

describe("CLIENT /samenwerkingen-badge — signable-proposals-ordening gelijk aan /acties", () => {
  it("ordent de PROPOSED-teken-query op createdAt asc (niet updatedAt desc) — gedeeld met pending-tasks.ts", async () => {
    await navBadges("CLIENT", "u-1");
    const signable = collaborationFindMany.mock.calls
      .map((c) => c[0])
      .find(isSignableProposalQuery);
    expect(signable).toBeDefined();
    // De list-bron (`proposedCollabs`, pending-tasks.ts:1149) ordent `createdAt asc`; de badge moet
    // identiek ordenen zodat de gecapte subsets samenvallen. `updatedAt desc` = de gerepareerde bug.
    expect(signable?.orderBy).toEqual({ createdAt: "asc" });
    expect(signable?.orderBy).not.toEqual({ updatedAt: "desc" });
  });
});
