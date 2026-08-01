// Unit-tests voor runPaymentReminderTask — betaaltermijn-reminders + OVERDUE-markering.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  invoices: [] as Array<Record<string, unknown>>,
  // Optionele findMany-snapshot die afwijkt van de live `invoices` — modelleert een TOCTOU-venster
  // (het plan leest de snapshot, de guarded write toetst de live rij). Null = live = snapshot.
  snapshot: null as Array<Record<string, unknown>> | null,
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
      // De kandidaat-query (where op lifecycleStatus/dueAt) leest de snapshot (TOCTOU-venster); de
      // live-herlezing vóór het signaleren (where op id.in) leest de ECHTE rijen, zodat een intussen
      // betaalde/bevroren factuur uit de signalering valt.
      findMany: vi.fn(async (args?: { where?: { id?: { in: string[] } } }) => {
        const ids = args?.where?.id?.in;
        if (ids) return store.invoices.filter((i) => ids.includes(i.id as string));
        return store.snapshot ?? store.invoices;
      }),
      // Faithful mock: updateMany honoreert de compound-guard (where.lifecycleStatus), zodat een
      // intussen betaalde (PAID) factuur NIET terug naar OVERDUE geflipt wordt.
      updateMany: vi.fn(
        async (args: {
          where: { id: string; lifecycleStatus?: string };
          data: Record<string, unknown>;
        }) => {
          const inv = store.invoices.find(
            (i) =>
              i.id === args.where.id &&
              (args.where.lifecycleStatus === undefined ||
                i.lifecycleStatus === args.where.lifecycleStatus),
          );
          if (!inv) return { count: 0 };
          Object.assign(inv, args.data);
          store.invoiceUpdates.push({ id: args.where.id, data: args.data });
          return { count: 1 };
        },
      ),
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
    store.snapshot = null;
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

  it("OVERDUE-markering is compound-guarded (where.lifecycleStatus = APPROVED)", async () => {
    store.invoices = [makeInvoice("inv-guard", "APPROVED", 1)];
    store.users = [
      { id: "freelancer-1", email: "f@test.nl", name: "ZZP" },
      { id: "client-1", email: "c@test.nl", name: "OG" },
    ];

    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    await runPaymentReminderTask({ actorId: null, now: NOW });

    const { prisma } = (await import("@/lib/db")) as unknown as {
      prisma: { invoice: { updateMany: ReturnType<typeof vi.fn> } };
    };
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "inv-guard", lifecycleStatus: "APPROVED" }),
        data: expect.objectContaining({ lifecycleStatus: "OVERDUE", status: "OVERDUE" }),
      }),
    );
  });

  it("TOCTOU — in het venster betaalde (PAID) factuur wordt NIET terug naar OVERDUE geschreven", async () => {
    // Snapshot zag een APPROVED factuur over de vervaldag → plan schedulet OVERDUE-markering; maar de
    // live rij is intussen via de cascade op PAID gezet (opdrachtgever bevestigde de betaling). De
    // compound-guard (lifecycleStatus = APPROVED) matcht niet meer → geen PAID → OVERDUE-overschrijving
    // (verboden overgang) en geen valse aanmaning over een al-betaalde factuur.
    store.snapshot = [makeInvoice("inv-paid", "APPROVED", 1)];
    store.invoices = [makeInvoice("inv-paid", "PAID", 1)];
    store.users = [
      { id: "freelancer-1", email: "f@test.nl", name: "ZZP" },
      { id: "client-1", email: "c@test.nl", name: "OG" },
    ];

    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const result = await runPaymentReminderTask({ actorId: null, now: NOW });

    expect(result.markedOverdue).toBe(0);
    expect(store.invoiceUpdates).toHaveLength(0);
    expect(store.invoices[0]?.lifecycleStatus).toBe("PAID");
  });

  it("TOCTOU-signalering — factuur in het venster PAID → geen herinnering/aanmaning ondanks stale plan", async () => {
    // De snapshot ziet de factuur nog fors te laat (aanmaningswaardig); de live rij is intussen via de
    // cascade op PAID gezet. Het plan (reminders + escalatie) komt uit de snapshot, maar de live-
    // herlezing vóór het signaleren moet de betaalde factuur eruit filteren: geen valse "betaal je
    // factuur"-melding aan de opdrachtgever, geen aanmaning-escalatie naar de admin.
    store.snapshot = [makeInvoice("inv-race", "OVERDUE", 40)];
    store.invoices = [makeInvoice("inv-race", "PAID", 40)];
    store.users = [
      { id: "freelancer-1", email: "f@test.nl", name: "ZZP" },
      { id: "client-1", email: "c@test.nl", name: "OG" },
      { id: "admin-1", email: "a@test.nl", name: "Admin", role: "ADMIN", status: "ACTIVE" },
    ];
    store.subscriptions = [{ userId: "freelancer-1", status: "ACTIVE", plan: { key: "PRO" } }];

    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const result = await runPaymentReminderTask({ actorId: null, now: NOW });

    expect(result.reminded).toBe(0);
    expect(result.escalated).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("TOCTOU-signalering — factuur blijft in het venster OVERDUE → herinnering vuurt normaal", async () => {
    // Controle dat de live-herlezing niet te veel wegfiltert: snapshot en live wijken af (los object),
    // maar de status blijft OVERDUE → de herinnering moet gewoon verstuurd worden.
    store.snapshot = [makeInvoice("inv-live", "OVERDUE", 5)];
    store.invoices = [makeInvoice("inv-live", "OVERDUE", 5)];
    store.users = [
      { id: "freelancer-1", email: "f@test.nl", name: "ZZP" },
      { id: "client-1", email: "c@test.nl", name: "OG" },
    ];
    store.subscriptions = [{ userId: "freelancer-1", status: "ACTIVE", plan: { key: "PRO" } }];

    const { runPaymentReminderTask } = await import("@/lib/payment-reminders-task");
    const result = await runPaymentReminderTask({ actorId: null, now: NOW });

    expect(result.reminded).toBeGreaterThanOrEqual(1);
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
