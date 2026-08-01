// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie / determinisme):
// vier admin-wachtrijen in `adminTasks()` (SUBMITTED-verificaties, PENDING-gebruikers, open disputen,
// AVG-verwijderverzoeken) worden met `take: MAX` begrensd. Zonder expliciete `orderBy` garandeert
// Prisma geen rijvolgorde → wélke MAX-van-N rijen /acties toont is arbitrair en kan per request
// verschuiven, terwijl de nav-badges (signals.ts) deze wachtrijen exact/onbegrensd tellen en
// gelijkheid met /acties claimen. Zodra een wachtrij > MAX groeit valt een concrete, actie-behoevende
// rij willekeurig weg (een "ontbrekende taak" die de badge tegenspreekt). Deze test borgt dat elk van
// de vier queries een deterministische `orderBy` meekrijgt — dezelfde fix als run 61 (franchiser
// acute-onbezet) en consistent met de zuster-queries in dezelfde Promise.all.

import { describe, it, expect, vi, beforeEach } from "vitest";

type FindManyArgs = { where?: Record<string, unknown>; orderBy?: unknown };

const credentialFindMany = vi.hoisted(() => vi.fn(async (_a: FindManyArgs) => []));
const userFindMany = vi.hoisted(() => vi.fn(async (_a: FindManyArgs) => []));
const collaborationFindMany = vi.hoisted(() => vi.fn(async (_a: FindManyArgs) => []));
const noShowFindMany = vi.hoisted(() => vi.fn(async () => []));
const noShowGroupBy = vi.hoisted(() => vi.fn(async () => []));
const supportFindMany = vi.hoisted(() => vi.fn(async () => []));
const shiftHandoffFindMany = vi.hoisted(() => vi.fn(async () => []));

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findMany: credentialFindMany },
    user: { findMany: userFindMany },
    collaboration: { findMany: collaborationFindMany },
    noShowReport: { findMany: noShowFindMany, groupBy: noShowGroupBy },
    supportTicket: { findMany: supportFindMany },
    shiftHandoff: { findMany: shiftHandoffFindMany },
  },
}));

import { pendingTasks } from "./pending-tasks";

beforeEach(() => {
  credentialFindMany.mockClear();
  userFindMany.mockClear();
  collaborationFindMany.mockClear();
});

describe("adminTasks — deterministische ordering op de begrensde admin-wachtrijen", () => {
  it("elke begrensde admin-query (verificaties/pending-users/disputen/verwijderverzoeken) heeft een orderBy náást take", async () => {
    // Unieke id → omzeilt de React.cache-memoisatie tussen tests.
    await pendingTasks({ id: "admin-ordering-test", role: "ADMIN", status: "ACTIVE" } as never);

    // SUBMITTED-verificatiewachtrij.
    const credArgs = credentialFindMany.mock.calls[0]![0];
    expect(credArgs.orderBy).toBeDefined();

    // Twee user.findMany-aanroepen: PENDING-activatie en AVG-verwijderverzoeken — beide begrensd,
    // beide moeten deterministisch geordend zijn.
    expect(userFindMany).toHaveBeenCalledTimes(2);
    const pendingCall = userFindMany.mock.calls.find(
      (c) => (c[0] as FindManyArgs).where?.status === "PENDING",
    );
    const deletionCall = userFindMany.mock.calls.find(
      (c) => (c[0] as FindManyArgs).where?.deletionRequestedAt !== undefined,
    );
    expect(pendingCall?.[0].orderBy).toBeDefined();
    expect(deletionCall?.[0].orderBy).toBeDefined();

    // Open-dispuutwachtrij.
    const disputeArgs = collaborationFindMany.mock.calls[0]![0];
    expect(disputeArgs.orderBy).toBeDefined();
  });
});
