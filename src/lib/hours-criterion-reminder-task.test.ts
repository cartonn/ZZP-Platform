// Unit-tests voor runHoursCriterionReminderTask. Prisma-laag + entitlement-poort gemockt;
// klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Per-user urenstore die de aggregaten voeden.
const store = {
  users: [] as Array<{ id: string }>,
  gated: new Set<string>(),
  directByUser: new Map<string, number>(),
  indirectByUser: new Map<string, number>(),
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(async () => store.users),
    },
    performance: {
      aggregate: vi.fn(
        async (args: { where: { collaboration: { freelancer: { userId: string } } } }) => {
          const uid = args.where.collaboration.freelancer.userId;
          return { _sum: { hours: store.directByUser.get(uid) ?? 0 } };
        },
      ),
    },
    indirectHoursEntry: {
      aggregate: vi.fn(async (args: { where: { userId: string } }) => ({
        _sum: { hours: store.indirectByUser.get(args.where.userId) ?? 0 },
      })),
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

vi.mock("@/lib/entitlement-guard", () => ({
  usersWithEntitlement: vi.fn(async () => store.gated),
}));

// Halverwege het jaar (H2-checkpoint), elapsed=182 → prognose = 2× de uren.
const NOW_H2 = new Date("2026-07-02T12:00:00.000Z");
const NOW_EARLY = new Date("2026-03-01T12:00:00.000Z");

describe("runHoursCriterionReminderTask", () => {
  beforeEach(() => {
    store.users = [];
    store.gated = new Set();
    store.directByUser = new Map();
    store.indirectByUser = new Map();
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
  });

  it("buiten het venster (jan–jun) → reminded 0, geen queries", async () => {
    store.users = [{ id: "u-1" }];
    store.gated = new Set(["u-1"]);
    store.directByUser.set("u-1", 500);
    const { runHoursCriterionReminderTask } = await import("@/lib/hours-criterion-reminder-task");
    const result = await runHoursCriterionReminderTask({ actorId: null, now: NOW_EARLY });
    expect(result).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("geen ZZP'ers → reminded 0", async () => {
    const { runHoursCriterionReminderTask } = await import("@/lib/hours-criterion-reminder-task");
    const result = await runHoursCriterionReminderTask({ actorId: null, now: NOW_H2 });
    expect(result).toEqual({ reminded: 0 });
  });

  it("happy path — achterlopende gerechtigde ZZP'er → 1 herinnering, notificatie/dedupe/audit", async () => {
    store.users = [{ id: "at-risk" }, { id: "on-track" }];
    store.gated = new Set(["at-risk", "on-track"]);
    store.directByUser.set("at-risk", 500); // prognose ~1000 → nudge
    store.directByUser.set("on-track", 700); // prognose ~1400 → geen nudge
    const { runHoursCriterionReminderTask } = await import("@/lib/hours-criterion-reminder-task");
    const result = await runHoursCriterionReminderTask({ actorId: null, now: NOW_H2 });

    expect(result.reminded).toBe(1);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.userId).toBe("at-risk");
    expect(store.notifications[0]?.type).toBe("HOURS_CRITERION_REMINDER");
    expect(store.notifications[0]?.link).toBe("/financien?tab=ontzorgd");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("HOURS_CRITERION_REMINDER_SENT");
  });

  it("entitlement-poort — niet-gerechtigde ZZP'er krijgt geen nudge", async () => {
    store.users = [{ id: "free-user" }];
    store.gated = new Set(); // geen IB_VOORBEREIDING
    store.directByUser.set("free-user", 500);
    const { runHoursCriterionReminderTask } = await import("@/lib/hours-criterion-reminder-task");
    const result = await runHoursCriterionReminderTask({ actorId: null, now: NOW_H2 });
    expect(result).toEqual({ reminded: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("idempotentie — tweede run stuurt niets extra", async () => {
    store.users = [{ id: "at-risk" }];
    store.gated = new Set(["at-risk"]);
    store.directByUser.set("at-risk", 500);
    const { runHoursCriterionReminderTask } = await import("@/lib/hours-criterion-reminder-task");
    await runHoursCriterionReminderTask({ actorId: null, now: NOW_H2 });
    const afterFirst = store.notifications.length;
    await runHoursCriterionReminderTask({ actorId: null, now: NOW_H2 });
    expect(store.notifications.length).toBe(afterFirst);
  });
});
