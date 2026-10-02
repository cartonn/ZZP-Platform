import { describe, it, expect, vi, beforeEach } from "vitest";

// Regressietest voor badge↔/acties-drift: een overdue-onbezette gepubliceerde opdracht (startdatum
// verstreken, niemand vastgelegd) geeft op /acties (pending-tasks.ts `jobStaffingOverdueTask`,
// P=51) + de dashboard-rail een actie die naar /opdrachten linkt. De /opdrachten-nav-badge telde
// echter alléén concept-opdrachten + koud-lopende opdrachten (`getClientColdJobs`, cap ≤ 2 reacties),
// en raadpleegde `getClientOverdueJobs` niet. Een overdue opdracht met ≥ 3 reacties kan nooit "koud"
// zijn → /acties toonde de verstreken-planning-taak zonder bijbehorende /opdrachten-badge: het
// "signaal op één oppervlak"-anti-patroon. Deze test grendelt vast dat de badge het overdue-signaal
// meetelt uit exact dezelfde gedeelde `getClientOverdueJobs`-bron als /acties, met dezelfde
// ontdubbeling tegen de koud-tak (een opdracht die zowel overdue als koud is telt één keer, net als
// de dominante P=51-taak op /acties die de zachtere koud-nudge subsumeert).

import type { StaffingRiskAction } from "./job-staffing-risk";

const state = {
  draftJobs: 0,
  overdue: [] as {
    jobId: string;
    title: string;
    daysUntilStart: number;
    action: StaffingRiskAction;
  }[],
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
vi.mock("@/lib/data/client-overdue-jobs", () => ({
  getClientOverdueJobs: vi.fn(async () => state.overdue),
}));
vi.mock("@/lib/data/client-cold-jobs", () => ({
  getClientColdJobs: vi.fn(async () => state.cold),
}));

import { navBadges } from "./signals";

beforeEach(() => {
  state.draftJobs = 0;
  state.overdue = [];
  state.cold = [];
});

describe("CLIENT /opdrachten-badge — overdue-onbezet telt mee (pariteit met /acties)", () => {
  it("overdue opdracht zonder concepten/koud → attention-badge met count 1", async () => {
    state.overdue = [
      { jobId: "job-1", title: "Nachtdienst ZZP", daysUntilStart: -1, action: "review_applicants" },
    ];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("overdue + concepten → telt samen, attention wint", async () => {
    state.draftJobs = 2;
    state.overdue = [{ jobId: "job-1", title: "A", daysUntilStart: -3, action: "widen_reach" }];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 3, tone: "attention" });
  });

  it("overdue + koude opdracht (verschillende opdrachten) → som van beide", async () => {
    state.overdue = [
      { jobId: "job-1", title: "A", daysUntilStart: -2, action: "review_shortlist" },
    ];
    state.cold = [{ jobId: "job-2", title: "B", headline: "Weinig respons" }];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 2, tone: "attention" });
  });

  it("opdracht die zowel overdue als koud is → één keer geteld (ontdubbeling zoals /acties)", async () => {
    state.overdue = [
      { jobId: "job-1", title: "A", daysUntilStart: -1, action: "review_applicants" },
    ];
    state.cold = [{ jobId: "job-1", title: "A", headline: "Weinig respons" }];
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toEqual({ count: 1, tone: "attention" });
  });

  it("geen overdue/koud/concept → geen /opdrachten-badge", async () => {
    const badges = await navBadges("CLIENT", "u-1");
    expect(badges["/opdrachten"]).toBeUndefined();
  });
});
