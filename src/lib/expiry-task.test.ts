// Unit-tests voor runExpiryTask — verloop + herinneringen van credentials.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  credentials: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  credentialUpdates: [] as Array<{ id: string; data: Record<string, unknown> }>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: {
      findMany: vi.fn(async () => store.credentials),
      updateMany: vi.fn(async (args: { where: { id: { in: string[] } }; data: unknown }) => {
        const ids = args.where.id.in;
        for (const cred of store.credentials) {
          if (ids.includes(cred.id as string)) {
            Object.assign(cred, args.data);
          }
        }
        return { count: ids.length };
      }),
      update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const cred = store.credentials.find((c) => c.id === args.where.id);
        if (cred) Object.assign(cred, args.data);
        store.credentialUpdates.push({ id: args.where.id, data: args.data });
        return cred ?? {};
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

function makeCredential(
  id: string,
  expiresAt: Date | null,
  expiryReminderFor: Date | null = null,
  userId = "user-1",
) {
  return {
    id,
    status: "VERIFIED",
    expiresAt,
    expiryReminderFor,
    title: `Certificaat ${id}`,
    freelancerProfile: { userId },
  };
}

describe("runExpiryTask", () => {
  beforeEach(async () => {
    store.credentials = [];
    store.auditLogs = [];
    store.notifications = [];
    store.credentialUpdates = [];
    vi.resetModules();
  });

  it("lege toestand — geen kandidaten → geen writes, nulresultaat", async () => {
    store.credentials = [];
    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });
    expect(result).toEqual({ expired: 0, reminded: 0 });
    expect(store.notifications).toHaveLength(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("happy path — verlopen credential → status EXPIRED, notificatie, auditregel", async () => {
    // Een credential die gisteren verlopen is.
    const expiredAt = new Date("2026-06-08T00:00:00.000Z");
    store.credentials = [makeCredential("cred-1", expiredAt)];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(1);
    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("CREDENTIAL_EXPIRED");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("CREDENTIALS_EXPIRED");
  });

  it("happy path — credential verloopt binnenkort → herinnering, auditregel, dedup-markering", async () => {
    // Een credential die over 20 dagen verloopt (binnen 30-dagenvenster).
    const expiresAt = new Date("2026-06-29T00:00:00.000Z");
    store.credentials = [makeCredential("cred-2", expiresAt, null)];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(0);
    expect(result.reminded).toBe(1);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("CREDENTIAL_EXPIRING");
    // dedup-markering: credential.update aangeroepen met expiryReminderFor
    expect(store.credentialUpdates).toHaveLength(1);
    expect(store.credentialUpdates[0]?.data.expiryReminderFor).toEqual(expiresAt);
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("CREDENTIALS_EXPIRING_REMINDED");
  });

  it("idempotentie — al herinnerd voor dezelfde vervaldatum → geen tweede herinnering", async () => {
    const expiresAt = new Date("2026-06-29T00:00:00.000Z");
    // expiryReminderFor = zelfde datum → al herinnerd, overslaan
    store.credentials = [makeCredential("cred-3", expiresAt, expiresAt)];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("mix verlopen + binnenkort → beide paden actief, aparte auditregels", async () => {
    const expiredAt = new Date("2026-06-08T00:00:00.000Z");
    const soonAt = new Date("2026-06-25T00:00:00.000Z");
    store.credentials = [
      makeCredential("cred-a", expiredAt, null, "user-a"),
      makeCredential("cred-b", soonAt, null, "user-b"),
    ];

    const { runExpiryTask } = await import("@/lib/expiry-task");
    const result = await runExpiryTask({ actorId: null, now: NOW });

    expect(result.expired).toBe(1);
    expect(result.reminded).toBe(1);
    expect(store.notifications).toHaveLength(2);
    // twee auditregels (één per batch-type)
    expect(store.auditLogs).toHaveLength(2);
  });
});
