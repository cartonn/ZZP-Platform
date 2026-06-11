// Unit-tests voor runConceptInvoiceReminderTask — herinneringen voor niet-ingediende conceptfacturen.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  invoices: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  users: [] as Array<Record<string, unknown>>,
  admins: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(async () => store.invoices),
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
      findMany: vi.fn(async (args?: { where?: { role?: string } }) => {
        if (args?.where?.role === "ADMIN") return store.admins;
        return store.users;
      }),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn(async () => {}) }),
}));
vi.mock("@/lib/services/reminder-emails", () => ({
  buildConceptInvoiceReminderEmail: vi.fn(() => ({ to: "", subject: "", text: "" })),
}));

const NOW = new Date("2026-06-09T12:00:00.000Z");

// Maak een conceptfactuur aan; daysOld bepaalt hoe oud hij is ten opzichte van NOW.
function makeInvoice(id: string, daysOld: number, issuerUserId = "user-1") {
  return {
    id,
    lifecycleStatus: "DRAFT",
    createdAt: new Date(NOW.getTime() - daysOld * 24 * 60 * 60 * 1000),
    issuerUserId,
    partyInvoiceNumber: `F-${id}`,
  };
}

describe("runConceptInvoiceReminderTask", () => {
  beforeEach(async () => {
    store.invoices = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    store.users = [];
    store.admins = [];
    vi.resetModules();
  });

  it("lege toestand — geen conceptfacturen → nulresultaat", async () => {
    const { runConceptInvoiceReminderTask } = await import("@/lib/concept-invoice-reminders-task");
    const result = await runConceptInvoiceReminderTask({ actorId: null, now: NOW });
    expect(result).toEqual({ reminded: 0, escalated: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("happy path — dag 3 herinnering → notificatie + DomainEvent + auditregel", async () => {
    // Factuur precies 3 dagen oud (herinneringsdag)
    store.invoices = [makeInvoice("inv-3d", 3, "user-1")];
    store.users = [{ id: "user-1", email: "u@test.nl", name: "ZZP" }];

    const { runConceptInvoiceReminderTask } = await import("@/lib/concept-invoice-reminders-task");
    const result = await runConceptInvoiceReminderTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
    expect(result.escalated).toBe(0);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.type).toBe("INVOICE_DRAFT_REMINDER");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("INVOICE_DRAFT_REMINDER");
  });

  it("happy path — dag 7 herinnering → herinnering verstuurd", async () => {
    store.invoices = [makeInvoice("inv-7d", 7, "user-1")];
    store.users = [{ id: "user-1", email: "u@test.nl", name: "ZZP" }];

    const { runConceptInvoiceReminderTask } = await import("@/lib/concept-invoice-reminders-task");
    const result = await runConceptInvoiceReminderTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(1);
  });

  it("happy path — dag > 7 → escalatie naar admins", async () => {
    // 10 dagen oud: voorbij de laatste herinnering (dag 7)
    store.invoices = [makeInvoice("inv-10d", 10, "user-2")];
    store.admins = [{ id: "admin-1" }, { id: "admin-2" }];

    const { runConceptInvoiceReminderTask } = await import("@/lib/concept-invoice-reminders-task");
    const result = await runConceptInvoiceReminderTask({ actorId: null, now: NOW });

    expect(result.escalated).toBe(1);
    // Notificaties naar admins
    const adminNotifs = store.notifications.filter((n) => n.type === "INVOICE_DRAFT_ESCALATION");
    expect(adminNotifs).toHaveLength(2);
    expect(store.auditLogs[0]?.action).toBe("INVOICE_DRAFT_ESCALATED");
  });

  it("idempotentie — al-gevuurd DomainEvent wordt overgeslagen", async () => {
    store.invoices = [makeInvoice("inv-dup", 3, "user-3")];
    store.users = [{ id: "user-3", email: "u3@test.nl", name: "ZZP3" }];

    const { runConceptInvoiceReminderTask } = await import("@/lib/concept-invoice-reminders-task");
    await runConceptInvoiceReminderTask({ actorId: null, now: NOW });
    const afterFirst = store.notifications.length;
    await runConceptInvoiceReminderTask({ actorId: null, now: NOW });
    // Geen extra notificaties bij tweede run
    expect(store.notifications.length).toBe(afterFirst);
  });

  it("niet dag-3 of dag-7, niet over de grens → geen herinnering, geen escalatie", async () => {
    // 2 dagen oud: geen herinneringsdag
    store.invoices = [makeInvoice("inv-2d", 2, "user-4")];

    const { runConceptInvoiceReminderTask } = await import("@/lib/concept-invoice-reminders-task");
    const result = await runConceptInvoiceReminderTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(0);
    expect(result.escalated).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });
});
