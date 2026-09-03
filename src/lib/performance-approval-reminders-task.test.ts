// Unit-tests voor runPerformanceApprovalReminderTask — herinneringen voor ongekeurde prestaties.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  performances: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  admins: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    performance: {
      findMany: vi.fn(async () => store.performances),
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
    user: {
      findMany: vi.fn(async () => store.admins),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

import { runPerformanceApprovalReminderTask } from "@/lib/performance-approval-reminders-task";

const NOW = new Date("2026-06-18T12:00:00.000Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function perfRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "perf-1",
    type: "HOURS",
    status: "SUBMITTED",
    submittedAt: daysAgo(3),
    milestoneTitle: null,
    collaboration: {
      status: "ACTIVE",
      disputedAt: null,
      company: { userId: "client-1" },
    },
    ...over,
  };
}

beforeEach(() => {
  store.performances = [];
  store.domainEvents = [];
  store.notifications = [];
  store.auditLogs = [];
  store.admins = [{ id: "admin-1" }];
});

describe("runPerformanceApprovalReminderTask", () => {
  it("doet niets bij een lege wachtrij", async () => {
    const res = await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0, escalated: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("herinnert de opdrachtgever op dag 3 (notificatie + event + audit)", async () => {
    store.performances = [perfRow({ submittedAt: daysAgo(3) })];
    const res = await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 1, escalated: 0 });
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.userId).toBe("client-1");
    expect(store.notifications[0]?.type).toBe("PERFORMANCE_APPROVAL_REMINDER");
    expect(store.notifications[0]?.link).toBe("/prestaties");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("PERFORMANCE_APPROVAL_REMINDER");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("PERFORMANCE_APPROVAL_REMINDER");
  });

  it("is idempotent: een tweede run op dezelfde dag stuurt niets", async () => {
    store.performances = [perfRow({ submittedAt: daysAgo(3) })];
    await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    const res2 = await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res2).toEqual({ reminded: 0, escalated: 0 });
    expect(store.notifications).toHaveLength(1);
  });

  it("escaleert naar elke admin na de laatste herinnering (dag 8)", async () => {
    store.admins = [{ id: "admin-1" }, { id: "admin-2" }];
    store.performances = [perfRow({ submittedAt: daysAgo(8) })];
    const res = await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0, escalated: 1 });
    expect(store.notifications).toHaveLength(2); // één per admin
    expect(store.notifications.every((n) => n.type === "PERFORMANCE_APPROVAL_ESCALATION")).toBe(
      true,
    );
    expect(store.notifications[0]?.link).toBe("/admin/samenwerkingen");
    expect(store.auditLogs[0]?.action).toBe("PERFORMANCE_APPROVAL_ESCALATED");
  });

  it("gebruikt de milestone-titel in het label", async () => {
    store.performances = [
      perfRow({ type: "MILESTONE", milestoneTitle: "Fase 1", submittedAt: daysAgo(8) }),
    ];
    await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    expect(store.notifications[0]?.body).toContain('Oplevering "Fase 1"');
  });

  it("slaat prestaties zonder opdrachtgever-userId over", async () => {
    store.performances = [
      perfRow({ collaboration: { status: "ACTIVE", disputedAt: null, company: { userId: null } } }),
    ];
    const res = await runPerformanceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0, escalated: 0 });
  });
});
