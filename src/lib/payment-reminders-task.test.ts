// Unit-tests voor runPaymentReminderTask — betaaltermijn-reminders + OVERDUE-markering.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  invoices: [] as Array<Record<string, unknown>>,
  invoiceUpdates: [] as Array<{ id: string; data: Record<string, unknown> }>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  users: [] as Array<Record<string, unknown>>,
  subscriptions: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(async () => store.invoices),
      update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const inv = store.invoices.find((i) => i.id === args.where.id);
        if (inv) Object.assign(inv, args.data);
        store.invoiceUpdates.push({ id: args.where.id, data: args.data });
        return inv ?? {};
      }),
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
    user: {
      findMany: vi.fn(async () => store.users),
    },
    subscription: {
      findMany: vi.fn(async () => store.subscriptions),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

// Mail-sender mock: doet niets
vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn(async () => {}) }),
}));
vi.mock("@/lib/services/reminder-emails", () => ({
  buildPaymentReminderEmail: vi.fn(() => ({ to: "", subject: "", text: "" })),
  buildPaymentOverdueEmail: vi.fn(() => ({ to: "", subject: "", text: "" })),
}));

// entitlement-guard mock: alle freelancers zijn entitled
vi.mock("@/lib/entitlement-guard", () => ({
  usersWithEntitlement: vi.fn(async (ids: string[]) => new Set(ids)),
}));

const NOW = new Date("2026-06-09T12:00:00.000Z");

function makeInvoice(
  id: string,
  lifecycleStatus: string,
  daysOverdue: number,
  freelancerId = "freelancer-1",
  clientId = "client-1",
) {
  const dueAt = new Date(NOW.getTime() - daysOverdue * 24 * 60 * 60 * 1000);
  return {
    id,
    lifecycleStatus,
    dueAt,
    issuerUserId: freelancerId,
    counterpartyUserId: clientId,
    partyInvoiceNumber: `F-${id}`,
  };
}

describe("runPaymentReminderTask", () => {
  beforeEach(async () => {
    store.invoices = [];
    store.invoiceUpdates = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    store.users = [];
    store.subscriptions = [];
    vi.resetModules();
  });

  it("lege toestand — geen facturen → nulresultaat", async () => {
    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const result = await runPaymentReminderTask({ actorId: null, now: NOW });
    expect(result).toEqual({ markedOverdue: 0, reminded: 0, escalated: 0 });
  });

  it("happy path — APPROVED factuur over vervaldag → markedOverdue, notificaties voor freelancer en client", async () => {
    // 1 dag over vervaldag
    store.invoices = [makeInvoice("inv-1", "APPROVED", 1)];
    store.users = [
      { id: "freelancer-1", email: "freelancer@test.nl", name: "ZZP'er" },
      { id: "client-1", email: "client@test.nl", name: "Opdrachtgever" },
    ];
    // freelancer heeft AUTO_REMINDERS entitlement
    store.subscriptions = [{ userId: "freelancer-1", status: "ACTIVE", plan: { key: "PRO" } }];

    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const result = await runPaymentReminderTask({ actorId: null, now: NOW });

    expect(result.markedOverdue).toBe(1);
    // bijgewerkte lifecycleStatus
    expect(store.invoiceUpdates[0]?.data.lifecycleStatus).toBe("OVERDUE");
    // herinneringen (voor freelancer en client)
    expect(result.reminded).toBeGreaterThanOrEqual(1);
    expect(store.domainEvents.length).toBeGreaterThan(0);
  });

  it("idempotentie — al-gevuurd DomainEvent wordt overgeslagen", async () => {
    store.invoices = [makeInvoice("inv-2", "OVERDUE", 5)];
    store.users = [
      { id: "freelancer-1", email: "f@test.nl", name: "ZZP" },
      { id: "client-1", email: "c@test.nl", name: "OG" },
    ];
    // Voeg al-bestaande DomainEvents toe met de verwachte dedupeKeys.
    store.domainEvents = [
      { dedupeKey: "payment-overdue-inv-2-REMINDER" },
      { dedupeKey: "payment-overdue-freelancer-inv-2-REMINDER" },
    ];

    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const before = store.domainEvents.length;
    await runPaymentReminderTask({ actorId: null, now: NOW });
    await runPaymentReminderTask({ actorId: null, now: NOW });
    // geen nieuwe events boven de al bestaande
    const added = store.domainEvents.length - before;
    expect(added).toBe(0);
  });

  it("lege freelancer-set → reminded = 0", async () => {
    // Factuur met nulls voor issuerUserId en counterpartyUserId
    store.invoices = [
      {
        id: "inv-3",
        lifecycleStatus: "APPROVED",
        dueAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
        issuerUserId: null,
        counterpartyUserId: null,
        partyInvoiceNumber: null,
      },
    ];
    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const result = await runPaymentReminderTask({ actorId: null, now: NOW });
    // Geen geldige kandidaten (issuerUserId/counterpartyUserId null)
    expect(result.reminded).toBe(0);
    expect(result.escalated).toBe(0);
  });
});
