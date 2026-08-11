import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor cross-surface next-action-drift (persona-sweep run 70, DOEL 1b): de
// /samenwerkingen-nav-badge telde voor beide rollen een contract-onderteken-actie op elke PROPOSED
// samenwerking, terwijl /acties (pending-tasks.ts, run 58) die taak juist ONDERDRUKT zodra de
// plaatsing door een certificaat-gat is geblokkeerd (signContract weigert dan server-side). De badge
// toonde zo een fantoom-actie zonder tegenhanger op /acties + het samenwerkingsdetail. De fix laat de
// badge-tellers dezelfde `collaborationPlacementBlocked`-gate spiegelen; die kan alleen als de
// badge-queries de vereiste certificaat-types én het certificaatdossier ophalen. Deze test grendelt
// die query-vorm vast (zonder de gate-data zou de badge terugvallen op de onvoorwaardelijke telling).

type Args = {
  where?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: unknown;
};

const collaborationFindMany = vi.fn((_a: Args) => Promise.resolve([] as unknown[]));
const credentialFindMany = vi.fn((_a: Args) => Promise.resolve([] as unknown[]));

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
      findMany: (a: Args) => credentialFindMany(a),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
    notification: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

function hasCredentialRequirements(select?: Record<string, unknown>): boolean {
  const job = select?.job as { select?: Record<string, unknown> } | undefined;
  return job?.select?.credentialRequirements !== undefined;
}

beforeEach(() => {
  collaborationFindMany.mockClear();
  credentialFindMany.mockClear();
});

describe("FREELANCER /samenwerkingen-badge — plaatsings-gate gespiegeld (run 70)", () => {
  it("de cascade-query haalt de vereiste certificaat-types op (job.credentialRequirements)", async () => {
    await navBadges("FREELANCER", "u-1");
    const cascade = collaborationFindMany.mock.calls
      .map((c) => c[0])
      .find(
        (a) =>
          (a.where?.status as { in?: string[] })?.in?.includes("PROPOSED") &&
          (a.select?.invoices !== undefined || a.select?.performances !== undefined),
      );
    expect(cascade).toBeDefined();
    expect(hasCredentialRequirements(cascade!.select)).toBe(true);
  });

  it("haalt het volledige certificaatdossier op (findMany zonder status-filter) voor de gate", async () => {
    await navBadges("FREELANCER", "u-1");
    const fullSet = credentialFindMany.mock.calls
      .map((c) => c[0])
      .find((a) => a.where?.freelancerProfileId === "fp-1" && a.where?.status === undefined);
    expect(fullSet).toBeDefined();
  });
});

describe("CLIENT /samenwerkingen-badge — signable-proposals-gate gespiegeld (run 70)", () => {
  it("de PROPOSED-teller haalt vereiste types én het ZZP-certificaatdossier op", async () => {
    await navBadges("CLIENT", "u-1");
    const signable = collaborationFindMany.mock.calls
      .map((c) => c[0])
      .find((a) => {
        const freelancer = a.select?.freelancer as { select?: Record<string, unknown> } | undefined;
        return (
          a.where?.status === "PROPOSED" &&
          hasCredentialRequirements(a.select) &&
          freelancer?.select?.credentials !== undefined
        );
      });
    expect(signable).toBeDefined();
  });
});
