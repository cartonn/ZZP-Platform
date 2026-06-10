// Unit-tests voor runNotificationDigestTask — e-mail-fallback voor ongelezen notificaties.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd (zelfde patroon als
// vat-reminder-task.test.ts).

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  notifications: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  sentMails: [] as Array<Record<string, unknown>>,
  mailConfigured: true,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(async () => store.notifications.filter((n) => n.digestedAt == null)),
      updateMany: vi.fn(
        async (args: { where: { id: { in: string[] } }; data: { digestedAt: Date } }) => {
          for (const n of store.notifications) {
            if (args.where.id.in.includes(n.id as string)) n.digestedAt = args.data.digestedAt;
          }
          return { count: args.where.id.in.length };
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
    auditLog: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        store.auditLogs.push(args.data);
        return args.data;
      }),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({
    send: vi.fn(async (msg: Record<string, unknown>) => {
      store.sentMails.push(msg);
    }),
  }),
  isMailDeliveryConfigured: () => store.mailConfigured,
}));

const NOW = new Date("2026-06-10T12:00:00.000Z");
const OLD = new Date("2026-06-08T12:00:00.000Z"); // 48 uur — over de 24u-drempel
const RECENT = new Date("2026-06-10T06:00:00.000Z"); // 6 uur — onder de drempel

function notif(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "n-1",
    userId: "u-1",
    type: "PAYMENT_REMINDER",
    title: "Betalingsherinnering",
    createdAt: OLD,
    digestedAt: null,
    user: { email: "u1@test.nl", name: "ZZP 1" },
    ...overrides,
  };
}

describe("runNotificationDigestTask", () => {
  beforeEach(() => {
    store.notifications = [];
    store.domainEvents = [];
    store.auditLogs = [];
    store.sentMails = [];
    store.mailConfigured = true;
    vi.resetModules();
  });

  it("zonder echt mailkanaal → overslaan, niets gemarkeerd", async () => {
    store.mailConfigured = false;
    store.notifications = [notif({})];
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const result = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(result).toEqual({ digests: 0, notifications: 0, skipped: true });
    expect(store.notifications[0]?.digestedAt).toBeNull();
  });

  it("lege toestand → geen digests", async () => {
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const result = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(result).toEqual({ digests: 0, notifications: 0 });
  });

  it("alleen recente notificaties → drempel houdt ze tegen", async () => {
    store.notifications = [notif({ createdAt: RECENT })];
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const result = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(result).toEqual({ digests: 0, notifications: 0 });
    expect(store.sentMails).toHaveLength(0);
  });

  it("happy path — 2 gebruikers, 3 notificaties → 2 digests, markering + event + audit + mail", async () => {
    store.notifications = [
      notif({ id: "n-1", userId: "u-1" }),
      notif({ id: "n-2", userId: "u-1", type: "CREDENTIAL_EXPIRING", title: "VOG verloopt" }),
      notif({
        id: "n-3",
        userId: "u-2",
        user: { email: "u2@test.nl", name: "ZZP 2" },
      }),
    ];
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const result = await runNotificationDigestTask({ actorId: null, now: NOW });

    expect(result).toEqual({ digests: 2, notifications: 3 });
    expect(store.notifications.every((n) => n.digestedAt != null)).toBe(true);
    expect(store.domainEvents).toHaveLength(2);
    expect(store.domainEvents[0]?.type).toBe("NOTIFICATION_DIGEST");
    expect(store.auditLogs).toHaveLength(2);
    expect(store.auditLogs[0]?.action).toBe("NOTIFICATION_DIGEST_SENT");
    expect(store.sentMails).toHaveLength(2);
  });

  it("idempotentie — tweede run vindt geen kandidaten (digestedAt gezet)", async () => {
    store.notifications = [notif({})];
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const first = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(first.digests).toBe(1);
    const second = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(second).toEqual({ digests: 0, notifications: 0 });
    expect(store.sentMails).toHaveLength(1);
  });

  it("vangnet — bestaand DomainEvent met dezelfde dedupeKey blokkeert een dubbele digest", async () => {
    store.notifications = [notif({})];
    store.domainEvents = [{ dedupeKey: "notification-digest-u-1-n-1" }];
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const result = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(result).toEqual({ digests: 0, notifications: 0 });
    expect(store.sentMails).toHaveLength(0);
  });

  it("mailfout breekt de run niet — markering en event blijven staan", async () => {
    store.notifications = [notif({})];
    vi.doMock("@/lib/services/mail-sender", () => ({
      getMailSender: () => ({
        send: vi.fn(async () => {
          throw new Error("smtp down");
        }),
      }),
      isMailDeliveryConfigured: () => true,
    }));
    const { runNotificationDigestTask } = await import("@/lib/notification-digest-task");
    const result = await runNotificationDigestTask({ actorId: null, now: NOW });
    expect(result).toEqual({ digests: 1, notifications: 1 });
    expect(store.domainEvents).toHaveLength(1);
  });
});
