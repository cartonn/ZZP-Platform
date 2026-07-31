// Unit-tests voor runSubscriptionExpiryTask — betaalde-abonnements-verval/renewal-cyclus.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  subscriptions: [] as Array<Record<string, unknown>>,
  // Optionele findMany-snapshot die afwijkt van de live `subscriptions` — modelleert een
  // TOCTOU-venster (het plan leest de snapshot, de guarded write toetst de live rij). Null = de
  // live rijen zijn ook de snapshot (normaalgeval).
  snapshot: null as Array<Record<string, unknown>> | null,
  subscriptionUpdates: [] as Array<{ id: string; data: Record<string, unknown> }>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

// Faithful mock: subscription.updateMany honoreert de compound-guard (where.status +
// where.currentPeriodEnd), zodat een intussen verlengd/niet-ACTIEF abonnement NIET geflipt wordt.
const prismaMock = {
  subscription: {
    findMany: vi.fn(async () => store.snapshot ?? store.subscriptions),
    updateMany: vi.fn(
      async (args: {
        where: { id: string; status?: string; currentPeriodEnd?: Date };
        data: Record<string, unknown>;
      }) => {
        const sub = store.subscriptions.find(
          (s) =>
            s.id === args.where.id &&
            (args.where.status === undefined || s.status === args.where.status) &&
            (args.where.currentPeriodEnd === undefined ||
              (s.currentPeriodEnd as Date | null)?.getTime() ===
                args.where.currentPeriodEnd.getTime()),
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
  // Ondersteun beide vormen: de array-vorm (herinneringen) én de interactieve callback-vorm (verval).
  $transaction: vi.fn(
    async (arg: Array<Promise<unknown>> | ((tx: typeof prismaMock) => Promise<unknown>)) =>
      typeof arg === "function" ? arg(prismaMock) : Promise.all(arg),
  ),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

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
    store.snapshot = null;
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

  it("verval schrijft de status compound-guarded (where.status = ACTIVE + currentPeriodEnd)", async () => {
    store.subscriptions = [makeActiveSub("sub-guard", -1)];

    const { runSubscriptionExpiryTask } = await import("@/lib/subscription-expiry-task");
    await runSubscriptionExpiryTask({ actorId: null, now: NOW });

    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "sub-guard",
          status: "ACTIVE",
          currentPeriodEnd: expect.any(Date),
        }),
        data: expect.objectContaining({ status: "CANCELLED", currentPeriodEnd: null }),
      }),
    );
  });

  it("TOCTOU — in het venster verlengd abonnement (verse periode) wordt NIET vervallen", async () => {
    // Snapshot zag een verlopen periode (gisteren) → plan schedulet verval; maar de live rij is
    // intussen verlengd via de Mollie-webhook (currentPeriodEnd 30 dagen vooruit), status nog ACTIVE.
    // De compound-guard (currentPeriodEnd = snapshot) matcht niet meer → geen verval, geen valse
    // "verlopen"-notificatie, geen status-overschrijving van de net-betalende klant.
    const snapshotPeriodEnd = new Date(NOW.getTime() - 1 * DAY); // verlopen periode die het plan zag
    // De findMany-snapshot ziet de verlopen periode → plan schedulet verval.
    store.snapshot = [
      {
        id: "sub-renewed",
        userId: "user-1",
        status: "ACTIVE",
        currentPeriodEnd: snapshotPeriodEnd,
      },
    ];
    // De live rij is intussen (webhook) verlengd: nog ACTIVE, maar verse periode 30 dagen vooruit.
    store.subscriptions = [
      {
        id: "sub-renewed",
        userId: "user-1",
        status: "ACTIVE",
        currentPeriodEnd: new Date(NOW.getTime() + 30 * DAY),
      },
    ];

    const { runSubscriptionExpiryTask } = await import("@/lib/subscription-expiry-task");
    const result = await runSubscriptionExpiryTask({ actorId: null, now: NOW });

    // Het plan bevatte wél een verval (op basis van de oude snapshot-periode)...
    expect(snapshotPeriodEnd.getTime()).toBeLessThan(NOW.getTime());
    // ...maar de guarded write flipt niets omdat de live periode is opgeschoven.
    expect(result.expired).toBe(0);
    expect(store.subscriptionUpdates).toHaveLength(0);
    expect(store.subscriptions[0]?.status).toBe("ACTIVE");
    expect(store.subscriptions[0]?.currentPeriodEnd).not.toBeNull();
    expect(store.notifications.find((n) => n.type === "SUBSCRIPTION_EXPIRED")).toBeUndefined();
    expect(store.domainEvents.find((e) => e.type === "SUBSCRIPTION_EXPIRED")).toBeUndefined();
    expect(store.auditLogs).toHaveLength(0);
  });
});
