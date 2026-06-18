// Unit-tests voor runJobEngagementTask — koude-opdracht-signaal naar de opdrachtgever.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  jobs: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    job: {
      findMany: vi.fn(async () => store.jobs),
    },
    domainEvent: {
      findMany: vi.fn(async (args: { where: { dedupeKey: { in: string[] } } }) =>
        store.domainEvents.filter((e) => args.where.dedupeKey.in.includes(e.dedupeKey as string)),
      ),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.domainEvents.push(args.data);
        return args.data;
      }),
    },
    notification: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.notifications.push(args.data);
        return args.data;
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.auditLogs.push(args.data);
        return args.data;
      }),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

const NOW = new Date("2026-06-17T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

// Vorm zoals de prisma-select in de runner: company.userId + _count.applications.
function makeJob(id: string, ageDays: number, applicationCount: number) {
  return {
    id,
    title: `Opdracht ${id}`,
    publishedAt: daysAgo(ageDays),
    company: { userId: `owner-${id}` },
    _count: { applications: applicationCount },
  };
}

describe("runJobEngagementTask", () => {
  beforeEach(() => {
    store.jobs = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
  });

  it("lege toestand — geen opdrachten → alerted = 0, jobs = 0", async () => {
    const { runJobEngagementTask } = await import("@/lib/job-engagement-task");
    const result = await runJobEngagementTask({ actorId: null, now: NOW });
    expect(result).toEqual({ alerted: 0, jobs: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("happy path — koude opdracht → notificatie + event + audit naar de eigenaar", async () => {
    store.jobs = [makeJob("a", 10, 0)];
    const { runJobEngagementTask } = await import("@/lib/job-engagement-task");
    const result = await runJobEngagementTask({ actorId: null, now: NOW });

    expect(result).toEqual({ alerted: 1, jobs: 1 });
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]).toMatchObject({ userId: "owner-a", type: "JOB_COLD" });
    expect(store.domainEvents[0]).toMatchObject({ type: "JOB_COLD", subjectId: "a" });
    expect(store.auditLogs[0]).toMatchObject({ action: "JOB_ENGAGEMENT_ALERT_SENT" });
  });

  it("idempotentie — bestaand DomainEvent met dezelfde dedupeKey wordt overgeslagen", async () => {
    store.jobs = [makeJob("b", 10, 0)];
    store.domainEvents = [{ dedupeKey: "job-cold:b" }];
    const { runJobEngagementTask } = await import("@/lib/job-engagement-task");
    const result = await runJobEngagementTask({ actorId: null, now: NOW });

    expect(result).toEqual({ alerted: 0, jobs: 1 });
    expect(store.notifications).toHaveLength(0);
  });

  it("twee runs achter elkaar → tweede run stuurt niets extra (dedup via aangemaakt event)", async () => {
    store.jobs = [makeJob("c", 12, 1)];
    const { runJobEngagementTask } = await import("@/lib/job-engagement-task");
    await runJobEngagementTask({ actorId: null, now: NOW });
    const after = store.notifications.length;
    await runJobEngagementTask({ actorId: null, now: NOW });
    expect(store.notifications.length).toBe(after);
  });
});
