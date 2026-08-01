import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor een DOEL-1b-bevinding ("signaal op één oppervlak"): de /kandidaten-nav-badge
// telde alleen NEW-reacties (`application.count status:"NEW"`), terwijl twee taken die naar
// /kandidaten deep-linken óók op /acties + de dashboard-rail verschijnen:
//   - `proposeCollaborationTask`  → geaccepteerde reactie (ACCEPTED) zonder samenwerkingsvoorstel;
//   - `staleApplicationsTask`     → VIEWED/SHORTLIST-kandidaat die te lang op een beslissing wacht.
// Een opdrachtgever met 0 NEW maar een geaccepteerde-kandidaat-in-limbo (of stale kandidaat) zag
// een schone /kandidaten-nav — stiller dan de item-engine. De badge telt nu alle drie de
// (niet-overlappende) predicaten, gelijk aan de losse taken op /acties.

type Where = { where?: Record<string, unknown> };

// application.count telt alleen NEW; application.findMany levert de stale- resp. accepted-rijen op
// basis van de where.status-clausule (exact de predicaten uit pending-tasks.ts).
let newApplicationsValue = 0;
let staleRows: { status: string; createdAt: Date; collaboration: { id: string } | null }[] = [];
// acceptedAt/updatedAt voeden de leeftijd-klok in `pendingCollaborationProposals` (de badge telt alleen
// het aantal, maar de helper vereist een niet-null klok — updatedAt is de legacy-fallback).
let acceptedRows: {
  id: string;
  collaboration: { id: string } | null;
  acceptedAt: Date | null;
  updatedAt: Date;
}[] = [];

const applicationCount = vi.fn((): Promise<number> => Promise.resolve(newApplicationsValue));
const applicationFindMany = vi.fn((a: Where): Promise<unknown[]> => {
  const status = a.where?.status as unknown;
  if (status === "ACCEPTED") return Promise.resolve(acceptedRows);
  // status: { in: ["VIEWED","SHORTLIST"] }
  return Promise.resolve(staleRows);
});

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })),
      count: vi.fn(() => Promise.resolve(0)),
    },
    credential: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    invoice: { count: vi.fn(() => Promise.resolve(0)) },
    collaboration: {
      findMany: vi.fn(() => Promise.resolve([])),
      count: vi.fn(() => Promise.resolve(0)),
    },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
    supportTicket: { count: vi.fn(() => Promise.resolve(0)) },
    noShowReport: {
      count: vi.fn(() => Promise.resolve(0)),
      groupBy: vi.fn(() => Promise.resolve([])),
    },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    user: { count: vi.fn(() => Promise.resolve(0)) },
    company: { findUnique: vi.fn(() => Promise.resolve({ id: "c-1" })) },
    application: {
      count: () => applicationCount(),
      findMany: (a: Where) => applicationFindMany(a),
    },
    job: { count: vi.fn(() => Promise.resolve(0)) },
    performance: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

// `clientCredentialAlerts` (DB-query) inert houden; de pure regels blijven echt.
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: () => Promise.resolve([]) };
});

import { navBadges } from "./signals";

// Ver genoeg in het verleden dat de stale-drempel (VIEWED ≥ 14 / SHORTLIST ≥ 21 dagen) haalt.
const longAgo = new Date(Date.now() - 30 * 86_400_000);

describe("navBadges CLIENT — /kandidaten-badge telt alle kandidaat-acties (DOEL 1b)", () => {
  beforeEach(() => {
    newApplicationsValue = 0;
    staleRows = [];
    acceptedRows = [];
    applicationCount.mockClear();
    applicationFindMany.mockClear();
  });

  it("0 NEW maar 1 geaccepteerde reactie zonder voorstel → badge = 1 (attention)", async () => {
    acceptedRows = [{ id: "app-1", collaboration: null, acceptedAt: longAgo, updatedAt: longAgo }];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/kandidaten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("0 NEW maar 1 stale VIEWED-kandidaat → badge = 1 (attention)", async () => {
    staleRows = [{ status: "VIEWED", createdAt: longAgo, collaboration: null }];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/kandidaten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("NEW + stale + geaccepteerd-zonder-voorstel sommeren (niet-overlappende statussen)", async () => {
    newApplicationsValue = 2;
    staleRows = [
      { status: "VIEWED", createdAt: longAgo, collaboration: null },
      { status: "SHORTLIST", createdAt: longAgo, collaboration: null },
    ];
    acceptedRows = [{ id: "app-9", collaboration: null, acceptedAt: longAgo, updatedAt: longAgo }];
    const badges = await navBadges("CLIENT", "u-1");
    // 2 NEW + 2 stale + 1 voorstel = 5.
    expect(badges["/kandidaten"]).toEqual({ count: 5, tone: "attention" });
  });

  it("geaccepteerde reactie mét samenwerking telt niet (voorstel is al verstuurd)", async () => {
    acceptedRows = [
      { id: "app-2", collaboration: { id: "collab-1" }, acceptedAt: longAgo, updatedAt: longAgo },
    ];
    const badges = await navBadges("CLIENT", "u-1");
    // Reeds-voorgesteld → geen openstaande actie → geen badge.
    expect(badges["/kandidaten"]).toBeUndefined();
  });

  it("geen enkele kandidaat-actie → geen /kandidaten-badge", async () => {
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/kandidaten"]).toBeUndefined();
  });
});
