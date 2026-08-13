import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor cross-surface next-action-drift (persona-sweep run 67, DOEL 1b): de nav-badge-
// queries in signals.ts moeten in WHERE/orderBy exact hun /acties-tegenhanger (pending-tasks.ts)
// spiegelen. Drie asymmetrieën waren teruggeslopen:
//   1. FRANCHISER openDiensten-badge miste de `collaborations: { none: { status: "ACTIVE" } }`-filter
//      die /acties (`franchiseAcuteDienstTask`) wél heeft → gevulde/start-loze diensten konden een
//      écht acute dienst uit de take-50-slice duwen (undercount t.o.v. /acties).
//   2. CLIENT staleCandidates-query miste `orderBy: { createdAt: "asc" }` → niet-deterministische slice.
//   3. CLIENT acceptedCandidates-query miste `orderBy: { updatedAt: "asc" }` → idem.
// We vangen de exacte findMany-argumenten en asserten de query-vorm (spiegelt pending-tasks.ts).

type Args = { where?: Record<string, unknown>; orderBy?: unknown; select?: unknown };

const jobFindMany = vi.fn((_a: Args) => Promise.resolve([] as unknown[]));
const applicationFindMany = vi.fn((_a: Args) => Promise.resolve([] as unknown[]));

// Generieke, permissieve prisma-mock: elke telling 0, elke lijst leeg, zodat navBadges de hele
// branch doorloopt zonder echte data — we meten alleen de query-vorm van de gespiede findMany-calls.
vi.mock("@/lib/db", () => ({
  prisma: {
    // fiscale-deadline-bron (BTW/IB) die navBadges nu leest; geen deadlines in deze test (run 73).
    administrationEntry: { findMany: () => Promise.resolve([]) },
    user: { findUnique: vi.fn(() => Promise.resolve({ tenantId: "t-1" })) },
    company: { findUnique: vi.fn(() => Promise.resolve({ id: "co-1" })) },
    application: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: (a: Args) => applicationFindMany(a),
    },
    job: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: (a: Args) => jobFindMany(a),
    },
    collaboration: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    performance: { count: vi.fn(() => Promise.resolve(0)) },
    invoice: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    lead: { count: vi.fn(() => Promise.resolve(0)) },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    credential: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    freelancerProfile: { findMany: vi.fn(() => Promise.resolve([])) },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
    notification: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  jobFindMany.mockClear();
  applicationFindMany.mockClear();
});

describe("FRANCHISER openDiensten-badge — spiegelt franchiseAcuteDienstTask (run 67)", () => {
  it("scopet de acute-dienst-query op ONGEVULDE diensten (collaborations: none ACTIVE)", async () => {
    await navBadges("FRANCHISER", "u-1");
    // De openDiensten-query is de job.findMany met een _count-select op PUBLISHED tenant-diensten.
    const acute = jobFindMany.mock.calls
      .map((c) => c[0])
      .find(
        (a) =>
          a.where?.status === "PUBLISHED" &&
          a.where?.tenantId === "t-1" &&
          // onderscheid van de stale-query (die een createdAt-drempel heeft)
          a.where?.createdAt === undefined,
      );
    expect(acute).toBeDefined();
    // De essentiële, eerder-teruggeslopen filter: gevulde diensten tellen niet mee in de slice.
    expect(acute!.where!.collaborations).toEqual({ none: { status: "ACTIVE" } });
    // Deterministische, acuut-eerst geordende slice, gelijk aan pending-tasks.ts.
    expect(acute!.orderBy).toEqual([
      { startDate: { sort: "asc", nulls: "first" } },
      { createdAt: "asc" },
    ]);
  });
});

describe("CLIENT kandidaat-badges — deterministische slice (orderBy) gelijk aan /acties (run 67)", () => {
  it("stale (VIEWED/SHORTLIST) query heeft orderBy createdAt asc", async () => {
    await navBadges("CLIENT", "u-1");
    const stale = applicationFindMany.mock.calls
      .map((c) => c[0])
      .find(
        (a) =>
          Array.isArray((a.where?.status as { in?: string[] })?.in) &&
          (a.where?.status as { in: string[] }).in.includes("VIEWED"),
      );
    expect(stale).toBeDefined();
    expect(stale!.orderBy).toEqual({ createdAt: "asc" });
  });

  it("accepted (ACCEPTED, nog geen voorstel) query heeft orderBy updatedAt asc", async () => {
    await navBadges("CLIENT", "u-1");
    const accepted = applicationFindMany.mock.calls
      .map((c) => c[0])
      .find((a) => a.where?.status === "ACCEPTED");
    expect(accepted).toBeDefined();
    expect(accepted!.orderBy).toEqual({ updatedAt: "asc" });
  });
});
