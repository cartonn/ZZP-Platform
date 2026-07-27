// Unit-tests voor runNotificationRetentionTask — standaard-AAN gedrag (het beloofde 180-dagen-venster
// wordt afgedwongen zonder env), wissen op createdAt ongeacht lees-/digest-/push-status, gebatchte
// verwijdering, idempotentie, het snoei-auditrecord (zonder PII) en de expliciete uit-override.
// Prisma-laag in-memory gemockt; klok + env geïnjecteerd.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface NotificationRow {
  id: string;
  createdAt: Date;
  readAt: Date | null;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

const store = { notifications: [] as NotificationRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

vi.mock("@/lib/db", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(async (args: { where: { createdAt: { lt: Date } }; take: number }) => {
        const cutoff = args.where.createdAt.lt;
        return store.notifications
          .filter((r) => r.createdAt < cutoff)
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.notifications.length;
        store.notifications = store.notifications.filter((r) => !ids.has(r.id));
        return { count: before - store.notifications.length };
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
        const row: AuditRow = { id: `audit-${idSeq++}`, createdAt: new Date(), ...args.data };
        store.auditLogs.push(row);
        return row;
      }),
    },
  },
}));

import { runNotificationRetentionTask } from "@/lib/notification-retention-task";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seed(count: number, ageDays: number, prefix: string, readAt: Date | null = null): void {
  for (let i = 0; i < count; i++) {
    store.notifications.push({
      id: `${prefix}-${i}`,
      createdAt: new Date(NOW.getTime() - ageDays * DAY),
      readAt,
    });
  }
}

beforeEach(() => {
  store.notifications = [];
  store.auditLogs = [];
  idSeq = 0;
  delete process.env.NOTIFICATION_RETENTION_DAYS;
});

afterEach(() => {
  delete process.env.NOTIFICATION_RETENTION_DAYS;
});

describe("runNotificationRetentionTask", () => {
  it("dwingt standaard (geen env) het beloofde 180-dagen-venster af", async () => {
    seed(2, 200, "old"); // > 180 dagen → weg
    seed(2, 100, "recent"); // binnen 180 → blijft
    const res = await runNotificationRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.retentionDays).toBe(180);
    expect(res.pruned).toBe(2);
    expect(store.notifications.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
    expect(store.notifications.filter((r) => r.id.startsWith("old"))).toHaveLength(0);
  });

  it("wist oude notificaties ongeacht lees-status (max-bewaartermijn voor de hele historie)", async () => {
    seed(2, 200, "old-unread", null); // ongelezen én oud → toch weg
    seed(2, 200, "old-read", new Date(NOW.getTime() - 190 * DAY)); // gelezen én oud → weg
    const res = await runNotificationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(4);
    expect(store.notifications).toHaveLength(0);
  });

  it("kan expliciet uit (env <= 0): niets sneuvelt", async () => {
    process.env.NOTIFICATION_RETENTION_DAYS = "0";
    seed(3, 1000, "old");
    const res = await runNotificationRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.notifications).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("klemt een te kort venster naar de minimumvloer (30 dagen)", async () => {
    process.env.NOTIFICATION_RETENTION_DAYS = "1"; // typefout → geklemd naar 30
    seed(2, 45, "old"); // > 30 → weg
    seed(2, 10, "recent"); // binnen 30 → blijft
    const res = await runNotificationRetentionTask({ now: NOW });
    expect(res.retentionDays).toBe(30);
    expect(res.pruned).toBe(2);
    expect(store.notifications.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seed(1, 200, "old");
    await runNotificationRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "NOTIFICATIONS_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("Notification");
    expect(records[0]?.entityId).toBe("retention");
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seed(2, 10, "recent");
    const res = await runNotificationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seed(1200, 200, "old"); // > 500 → meerdere batches
    const res = await runNotificationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.notifications).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seed(3, 200, "old");
    await runNotificationRetentionTask({ now: NOW });
    const second = await runNotificationRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });
});
