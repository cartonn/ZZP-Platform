// Unit-tests voor runVatReminderTask — kwartaal-BTW-herinnering voor actieve ZZP'ers.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  users: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(async () => store.users),
    },
    notificationPreference: {
      findMany: vi.fn(async () => []), // geen rijen = standaard aan (opt-out-model)
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

vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn(async () => {}) }),
}));
vi.mock("@/lib/services/reminder-emails", () => ({
  buildVatReminderEmail: vi.fn(() => ({ to: "", subject: "", text: "" })),
}));

// Q2 eindigt 30 juni; 7 dagen vóór = 24-30 juni. 27 juni = in het venster.
const NOW_IN_WINDOW = new Date("2026-06-27T12:00:00.000Z");
// Buiten venster: 1 juni
const NOW_OUTSIDE = new Date("2026-06-01T12:00:00.000Z");

describe("runVatReminderTask", () => {
  beforeEach(async () => {
    store.users = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    vi.resetModules();
  });

  it("lege toestand — geen ZZP'ers → reminded = 0", async () => {
    store.users = [];
    const { runVatReminderTask } = await import("@/lib/vat-reminder-task");
    const result = await runVatReminderTask({ actorId: null, now: NOW_IN_WINDOW });
    expect(result).toEqual({ reminded: 0 });
  });

  it("buiten het herinneringsvenster → geen herinneringen", async () => {
    store.users = [{ id: "u-1", email: "u@test.nl", name: "ZZP" }];
    const { runVatReminderTask } = await import("@/lib/vat-reminder-task");
    const result = await runVatReminderTask({ actorId: null, now: NOW_OUTSIDE });
    expect(result.reminded).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("happy path — in venster, 2 ZZP'ers → 2 herinneringen + DomainEvents + auditregels", async () => {
    store.users = [
      { id: "u-1", email: "u1@test.nl", name: "ZZP 1" },
      { id: "u-2", email: "u2@test.nl", name: "ZZP 2" },
    ];
    const { runVatReminderTask } = await import("@/lib/vat-reminder-task");
    const result = await runVatReminderTask({ actorId: null, now: NOW_IN_WINDOW });

    expect(result.reminded).toBe(2);
    expect(store.notifications).toHaveLength(2);
    expect(store.notifications[0]?.type).toBe("VAT_REMINDER");
    expect(store.domainEvents).toHaveLength(2);
    expect(store.auditLogs).toHaveLength(2);
    expect(store.auditLogs[0]?.action).toBe("VAT_REMINDER_SENT");
  });

  it("idempotentie — tweede run slaat al-gevuurde herinneringen over", async () => {
    store.users = [{ id: "u-3", email: "u3@test.nl", name: "ZZP 3" }];
    const { runVatReminderTask } = await import("@/lib/vat-reminder-task");
    await runVatReminderTask({ actorId: null, now: NOW_IN_WINDOW });
    const afterFirst = store.notifications.length;
    await runVatReminderTask({ actorId: null, now: NOW_IN_WINDOW });
    // Geen extra notificaties bij tweede run
    expect(store.notifications.length).toBe(afterFirst);
  });
});
