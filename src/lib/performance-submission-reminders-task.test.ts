// Unit-tests voor runPerformanceSubmissionReminderTask — herinneringen voor open urenstaten.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  collaborations: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findMany: vi.fn(async () => store.collaborations),
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

const NOW = new Date("2026-06-19T12:00:00.000Z");

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

// Bouw een ACTIVE+SIGNED samenwerking met een laatste goedgekeurde uren-prestatie `daysOld` dagen terug.
function makeCollab(
  id: string,
  daysOld: number,
  opts: { userId?: string; extraPerformances?: Array<Record<string, unknown>> } = {},
) {
  return {
    id,
    freelancer: { userId: opts.userId ?? "user-1" },
    job: { title: "Verpleegkundige" },
    performances: [
      { type: "HOURS", status: "APPROVED", submittedAt: daysAgo(daysOld) },
      ...(opts.extraPerformances ?? []),
    ],
  };
}

describe("runPerformanceSubmissionReminderTask", () => {
  beforeEach(() => {
    store.collaborations = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
  });

  it("lege toestand — geen samenwerkingen → nulresultaat", async () => {
    const { runPerformanceSubmissionReminderTask } =
      await import("@/lib/performance-submission-reminders-task");
    const result = await runPerformanceSubmissionReminderTask({ actorId: null, now: NOW });
    expect(result).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("happy path — dag 7 → notificatie + DomainEvent + auditregel", async () => {
    store.collaborations = [makeCollab("c-7d", 7, { userId: "user-1" })];

    const { runPerformanceSubmissionReminderTask } =
      await import("@/lib/performance-submission-reminders-task");
    const result = await runPerformanceSubmissionReminderTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("PERFORMANCE_SUBMISSION_REMINDER");
    expect(store.notifications[0]?.link).toBe("/samenwerkingen/c-7d");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("PERFORMANCE_REMINDER");
    expect(store.auditLogs[0]?.action).toBe("PERFORMANCE_SUBMISSION_REMINDER");
  });

  it("slaat een samenwerking met iets in concept/ter beoordeling over", async () => {
    store.collaborations = [
      makeCollab("c-open", 7, {
        extraPerformances: [{ type: "HOURS", status: "SUBMITTED", submittedAt: daysAgo(1) }],
      }),
    ];

    const { runPerformanceSubmissionReminderTask } =
      await import("@/lib/performance-submission-reminders-task");
    const result = await runPerformanceSubmissionReminderTask({ actorId: null, now: NOW });
    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("idempotentie — al-gevuurd DomainEvent wordt overgeslagen", async () => {
    store.collaborations = [makeCollab("c-dup", 7, { userId: "user-3" })];

    const { runPerformanceSubmissionReminderTask } =
      await import("@/lib/performance-submission-reminders-task");
    await runPerformanceSubmissionReminderTask({ actorId: null, now: NOW });
    const afterFirst = store.notifications.length;
    await runPerformanceSubmissionReminderTask({ actorId: null, now: NOW });
    expect(store.notifications.length).toBe(afterFirst);
  });

  it("niet op een tussenliggende dag → geen herinnering", async () => {
    store.collaborations = [makeCollab("c-10d", 10)];

    const { runPerformanceSubmissionReminderTask } =
      await import("@/lib/performance-submission-reminders-task");
    const result = await runPerformanceSubmissionReminderTask({ actorId: null, now: NOW });
    expect(result.reminded).toBe(0);
  });
});
