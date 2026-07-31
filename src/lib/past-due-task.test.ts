// Unit-tests voor runSubscriptionPastDueTask — PAST_DUE-abonnementsladder.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  subscriptions: [] as Array<Record<string, unknown>>,
  subscriptionUpdates: [] as Array<{ id: string; data: Record<string, unknown> }>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

// Faithful mock: subscription.updateMany honoreert de compound status-guard
// (where.status), zodat een intussen naar ACTIVE herstelde rij NIET geflipt wordt.
const prismaMock = {
  subscription: {
    findMany: vi.fn(async () => store.subscriptions),
    updateMany: vi.fn(
      async (args: { where: { id: string; status?: string }; data: Record<string, unknown> }) => {
        const sub = store.subscriptions.find(
          (s) =>
            s.id === args.where.id &&
            (args.where.status === undefined || s.status === args.where.status),
        );
        if (!sub) return { count: 0 };
        Object.assign(sub, args.data);
        store.subscriptionUpdates.push({ id: args.where.id, data: args.data });
        return { count: 1 };
      },
    ),
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
  // Ondersteun beide vormen: de array-vorm (herinneringen) én de interactieve
  // callback-vorm (downgrade). Bij de callback krijgt de body dezelfde mock als `tx`.
  $transaction: vi.fn(
    async (arg: Array<Promise<unknown>> | ((tx: typeof prismaMock) => Promise<unknown>)) =>
      typeof arg === "function" ? arg(prismaMock) : Promise.all(arg),
  ),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const NOW = new Date("2026-06-09T12:00:00.000Z");

// Maak een PAST_DUE-abonnement aan. daysAgo = dagen geleden dat het PAST_DUE werd.
function makePastDueSub(id: string, daysAgo: number, userId = "user-1") {
  const pastDueAt = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id,
    userId,
    status: "PAST_DUE",
    pastDueAt,
    updatedAt: pastDueAt,
  };
}

describe("runSubscriptionPastDueTask", () => {
  beforeEach(async () => {
    store.subscriptions = [];
    store.subscriptionUpdates = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
  });

  it("lege toestand — geen PAST_DUE-abonnementen → nulresultaat", async () => {
    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    const result = await runSubscriptionPastDueTask({ actorId: null, now: NOW });
    expect(result).toEqual({ reminded: 0, downgraded: 0 });
  });

  it("happy path — dag 1 herinnering → notificatie + DomainEvent + auditregel", async () => {
    store.subscriptions = [makePastDueSub("sub-1", 1)];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    const result = await runSubscriptionPastDueTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
    expect(result.downgraded).toBe(0);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("SUBSCRIPTION_PAST_DUE");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("SUBSCRIPTION_PAST_DUE_REMINDER");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("SUBSCRIPTION_PAST_DUE_REMINDER");
  });

  it("happy path — dag 3 herinnering → notificatie verstuurd", async () => {
    store.subscriptions = [makePastDueSub("sub-3", 3)];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    const result = await runSubscriptionPastDueTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
    expect(result.downgraded).toBe(0);
  });

  it("happy path — dag > 7 → downgrade naar CANCELLED + notificatie", async () => {
    store.subscriptions = [makePastDueSub("sub-8", 8)];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    const result = await runSubscriptionPastDueTask({ actorId: null, now: NOW });

    expect(result.downgraded).toBe(1);
    expect(result.reminded).toBe(0);
    // Subscription bijgewerkt naar CANCELLED
    expect(store.subscriptionUpdates).toHaveLength(1);
    expect(store.subscriptionUpdates[0]?.data.status).toBe("CANCELLED");
    // Notificatie verstuurd
    const notif = store.notifications.find((n) => n.type === "SUBSCRIPTION_DOWNGRADED");
    expect(notif).toBeDefined();
    expect(store.domainEvents[0]?.type).toBe("SUBSCRIPTION_DOWNGRADED");
  });

  it("TOCTOU — intussen naar ACTIVE hersteld abonnement wordt NIET gedowngraded", async () => {
    // Snapshot zag PAST_DUE (>7 dagen) → plan schedulet een downgrade; maar de live rij is
    // intussen ACTIVE (betaling hersteld via de webkook). De compound-guarded updateMany mag
    // die rij niet flippen: geen downgrade, geen notificatie, geen valse "teruggezet"-melding.
    const sub = makePastDueSub("sub-recovered", 8);
    sub.status = "ACTIVE";
    store.subscriptions = [sub];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    const result = await runSubscriptionPastDueTask({ actorId: null, now: NOW });

    expect(result.downgraded).toBe(0);
    expect(store.subscriptionUpdates).toHaveLength(0);
    expect(store.subscriptions[0]?.status).toBe("ACTIVE");
    expect(store.notifications.find((n) => n.type === "SUBSCRIPTION_DOWNGRADED")).toBeUndefined();
    expect(store.domainEvents.find((e) => e.type === "SUBSCRIPTION_DOWNGRADED")).toBeUndefined();
    expect(store.auditLogs).toHaveLength(0);
  });

  it("downgrade schrijft de status compound-guarded (where.status = PAST_DUE)", async () => {
    store.subscriptions = [makePastDueSub("sub-guard", 8)];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    await runSubscriptionPastDueTask({ actorId: null, now: NOW });

    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "sub-guard", status: "PAST_DUE" }),
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
  });

  it("idempotentie — al-gevuurd DomainEvent wordt overgeslagen bij tweede run", async () => {
    store.subscriptions = [makePastDueSub("sub-d", 1)];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    await runSubscriptionPastDueTask({ actorId: null, now: NOW });
    const notifsAfterFirst = store.notifications.length;
    await runSubscriptionPastDueTask({ actorId: null, now: NOW });
    expect(store.notifications.length).toBe(notifsAfterFirst);
  });

  it("dag 2 (geen herinneringsdag) → geen herinnering, geen downgrade", async () => {
    store.subscriptions = [makePastDueSub("sub-2", 2)];

    const { runSubscriptionPastDueTask } = await import("@/lib/past-due-task");
    const result = await runSubscriptionPastDueTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(0);
    expect(result.downgraded).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });
});
