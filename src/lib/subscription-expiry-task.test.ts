// Unit-tests voor runSubscriptionExpiryTask — betaalde-abonnements-verval/renewal-cyclus.
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

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(async () => store.subscriptions),
      update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const sub = store.subscriptions.find((s) => s.id === args.where.id);
        if (sub) Object.assign(sub, args.data);
        store.subscriptionUpdates.push({ id: args.where.id, data: args.data });
        return sub ?? {};
      }),
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

const NOW = new Date("2026-06-09T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

// Maak een betaald ACTIVE-abonnement aan. daysUntilEnd = dagen tot currentPeriodEnd (negatief = verleden).
function makeActiveSub(id: string, daysUntilEnd: number, userId = "user-1") {
  return {
    id,
    userId,
    status: "ACTIVE",
    currentPeriodEnd: new Date(NOW.getTime() + daysUntilEnd * DAY),
  };
}

describe("runSubscriptionExpiryTask", () => {
  beforeEach(async () => {
    store.subscriptions = [];
    store.subscriptionUpdates = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
  });

  it("lege toestand — geen kandidaten → nulresultaat", async () => {
    const { runSubscriptionExpiryTask } = await import("@/lib/subscription-expiry-task");
    const result = await runSubscriptionExpiryTask({ actorId: null, now: NOW });
    expect(result).toEqual({ reminded: 0, expired: 0 });
  });

  it("renewal-herinnering — periode over 5 dagen → notificatie + DomainEvent + audit, geen status-update", async () => {
    store.subscriptions = [makeActiveSub("sub-1", 5)];

    const { runSubscriptionExpiryTask } = await import("@/lib/subscription-expiry-task");
    const result = await runSubscriptionExpiryTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
    expect(result.expired).toBe(0);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("SUBSCRIPTION_RENEWAL");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("SUBSCRIPTION_RENEWAL_REMINDER");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("SUBSCRIPTION_RENEWAL_REMINDER");
    // Geen status-update bij een herinnering.
    expect(store.subscriptionUpdates).toHaveLength(0);
  });

  it("verval — periode gisteren → status CANCELLED + currentPeriodEnd null + notificatie + audit", async () => {
    store.subscriptions = [makeActiveSub("sub-x", -1)];

    const { runSubscriptionExpiryTask } = await import("@/lib/subscription-expiry-task");
    const result = await runSubscriptionExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(1);
    expect(result.reminded).toBe(0);
    expect(store.subscriptionUpdates).toHaveLength(1);
    expect(store.subscriptionUpdates[0]?.data.status).toBe("CANCELLED");
    expect(store.subscriptionUpdates[0]?.data.currentPeriodEnd).toBeNull();

    const notif = store.notifications.find((n) => n.type === "SUBSCRIPTION_EXPIRED");
    expect(notif).toBeDefined();
    expect(store.domainEvents[0]?.type).toBe("SUBSCRIPTION_EXPIRED");
    const audit = store.auditLogs.find((a) => a.action === "SUBSCRIPTION_EXPIRED");
    expect(audit).toBeDefined();
  });

  it("idempotentie — tweede run met reeds-gemaakte DomainEvents doet niets", async () => {
    store.subscriptions = [makeActiveSub("sub-r", 5)];

    const { runSubscriptionExpiryTask } = await import("@/lib/subscription-expiry-task");
    const first = await runSubscriptionExpiryTask({ actorId: null, now: NOW });
    expect(first.reminded).toBe(1);
    const notifsAfterFirst = store.notifications.length;

    const second = await runSubscriptionExpiryTask({ actorId: null, now: NOW });
    expect(second).toEqual({ reminded: 0, expired: 0 });
    expect(store.notifications.length).toBe(notifsAfterFirst);
  });
});
