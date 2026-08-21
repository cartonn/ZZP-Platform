// Unit-tests voor runApplicationDecisionReminderTask — beslis-reminders naar de opdrachtgever.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  applications: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    application: {
      findMany: vi.fn(async () => store.applications),
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

import { runApplicationDecisionReminderTask } from "@/lib/application-decision-reminders-task";

const NOW = new Date("2026-08-21T12:00:00.000Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function appRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "app-1",
    status: "VIEWED",
    createdAt: daysAgo(14),
    job: {
      title: "Nachtdienst VVT",
      status: "PUBLISHED",
      company: { userId: "client-1" },
    },
    ...over,
  };
}

beforeEach(() => {
  store.applications = [];
  store.domainEvents = [];
  store.notifications = [];
  store.auditLogs = [];
});

describe("runApplicationDecisionReminderTask", () => {
  it("doet niets bij een lege wachtrij", async () => {
    const res = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("herinnert de opdrachtgever op de drempel (notificatie + event + audit)", async () => {
    store.applications = [appRow({ createdAt: daysAgo(14) })];
    const res = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 1 });
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.userId).toBe("client-1");
    expect(store.notifications[0]?.type).toBe("APPLICATION_DECISION_REMINDER");
    expect(store.notifications[0]?.link).toBe("/kandidaten");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("APPLICATION_DECISION_REMINDER");
    expect(store.domainEvents[0]?.subjectType).toBe("Application");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("APPLICATION_DECISION_REMINDER");
  });

  it("is idempotent: een tweede run op dezelfde dag stuurt niets", async () => {
    store.applications = [appRow({ createdAt: daysAgo(14) })];
    await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
    const res2 = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
    expect(res2).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(1);
  });

  it("slaat reacties zonder opdrachtgever-userId over", async () => {
    store.applications = [
      appRow({ job: { title: "X", status: "PUBLISHED", company: { userId: null } } }),
    ];
    const res = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0 });
  });
});
