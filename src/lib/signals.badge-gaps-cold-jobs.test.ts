import { describe, it, expect, vi, beforeEach } from "vitest";

// Regressietest voor badge↔/acties-drift: een koud-lopende gepubliceerde opdracht geeft op /acties
// (pending-tasks.ts `jobNeedsAttentionTask`) een bijstuur-taak die naar /opdrachten linkt. Zonder een
// badge zou /opdrachten een /acties-taak zonder badge hebben (het "signaal op één oppervlak"-anti-
// patroon). Deze test grendelt vast dat de /opdrachten-badge het koud-signaal meetelt — via exact
// dezelfde gedeelde `getClientColdJobs`-bron als /acties — en concept-opdrachten combineert met een
// dynamische toon (attention zodra er een koude opdracht is).

const state = {
  draftJobs: 0,
  cold: [] as { jobId: string; title: string; headline: string }[],
};

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => ({ id: "c-1" })) },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => state.draftJobs) },
    performance: { count: vi.fn(async () => 0) },
    invoice: { count: vi.fn(async () => 0) },
    collaboration: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
  },
}));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({
  getClientColdJobs: vi.fn(async () => state.cold),
}));

import { navBadges } from "./signals";

beforeEach(() => {
  state.draftJobs = 0;
  state.cold = [];
});

describe("CLIENT /opdrachten-badge — koud-signaal telt mee (pariteit met /acties)", () => {
  it("geen concepten en geen koude opdracht → geen /opdrachten-badge", async () => {
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toBeUndefined();
  });

  it("alleen concept-opdrachten → info-toon (rustige telling)", async () => {
    state.draftJobs = 2;
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 2, tone: "info" });
  });

  it("koude opdracht → attention-toon, telt samen met de concepten", async () => {
    state.draftJobs = 1;
    state.cold = [
      { jobId: "job-1", title: "A", headline: "Weinig respons" },
      { jobId: "job-2", title: "B", headline: "Traag tempo" },
    ];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 3, tone: "attention" });
  });

  it("koude opdracht zonder concepten → attention-badge met alleen het koud-aantal", async () => {
    state.cold = [{ jobId: "job-1", title: "A", headline: "Weinig respons" }];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 1, tone: "attention" });
  });
});
