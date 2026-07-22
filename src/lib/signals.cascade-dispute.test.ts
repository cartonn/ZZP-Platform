import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor de persona-sweep-bevinding (DOEL 1b): de CLIENT-cascadebadges
// (`cascadeWork` + `pendingPerformances`) telden werk op een BEVROREN (dispuut) samenwerking mee,
// terwijl `/acties` (pending-tasks) en de cascade-fase ("Dispuut — werkproces bevroren", youAreUp
// false) dat juist uitsluiten en de goedkeur-knop server-side weigert (assertNotDisputed). De
// FREELANCER-tak had de `disputedAt: null`-grens wél; de CLIENT-tak miste die → dode/tegenstrijdige
// badge. We asserten dat beide CLIENT-cascadequery's nu op een niet-bevroren samenwerking scopen.

type CountArgs = { where: Record<string, unknown> };

const performanceCount = vi.fn((_a: CountArgs): Promise<number> => Promise.resolve(0));
const invoiceCount = vi.fn((_a: CountArgs): Promise<number> => Promise.resolve(0));
const collaborationCount = vi.fn((_a: CountArgs): Promise<number> => Promise.resolve(0));
const applicationCount = vi.fn((): Promise<number> => Promise.resolve(0));
const jobCount = vi.fn((): Promise<number> => Promise.resolve(0));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(() => Promise.resolve({ id: "co-1" })),
    },
    application: { count: () => applicationCount() },
    job: { count: () => jobCount() },
    // unreadConversationCount: geen deelnames → 0, geen message.groupBy nodig.
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    performance: { count: (a: CountArgs) => performanceCount(a) },
    invoice: { count: (a: CountArgs) => invoiceCount(a) },
    collaboration: { count: (a: CountArgs) => collaborationCount(a) },
  },
}));

import { navBadges } from "./signals";

describe("navBadges CLIENT — bevroren (dispuut) cascadewerk uitgesloten", () => {
  beforeEach(() => {
    performanceCount.mockClear();
    invoiceCount.mockClear();
    collaborationCount.mockClear();
  });

  it("contract-ondertekentelling (PROPOSED) scopt op een niet-bevroren samenwerking", async () => {
    await navBadges("CLIENT", "cl-1");
    const proposedCall = collaborationCount.mock.calls.find(
      (c) => (c[0].where as { status?: string }).status === "PROPOSED",
    );
    expect(proposedCall).toBeTruthy();
    expect(proposedCall![0].where).toMatchObject({
      company: { userId: "cl-1" },
      status: "PROPOSED",
      disputedAt: null,
    });
  });

  it("prestatie-goedkeurtelling scopt op een niet-bevroren samenwerking", async () => {
    await navBadges("CLIENT", "cl-1");
    // performance.count wordt aangeroepen voor de SUBMITTED-prestaties.
    const perfCall = performanceCount.mock.calls.find(
      (c) => (c[0].where as { status?: string }).status === "SUBMITTED",
    );
    expect(perfCall).toBeTruthy();
    expect(perfCall![0].where).toMatchObject({
      status: "SUBMITTED",
      collaboration: { company: { userId: "cl-1" }, disputedAt: null },
    });
  });

  it("factuur-goedkeurtelling scopt op een niet-bevroren samenwerking", async () => {
    await navBadges("CLIENT", "cl-1");
    // De SUBMITTED-cascadefactuurtelling (counterpartyUserId) — niet de overdue-roll-up.
    const invCall = invoiceCount.mock.calls.find(
      (c) => (c[0].where as { lifecycleStatus?: string }).lifecycleStatus === "SUBMITTED",
    );
    expect(invCall).toBeTruthy();
    expect(invCall![0].where).toMatchObject({
      counterpartyUserId: "cl-1",
      lifecycleStatus: "SUBMITTED",
      collaboration: { disputedAt: null },
    });
  });
});
