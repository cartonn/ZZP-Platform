// Unit-tests voor runDbaMonitorTask — DBA-risicosignalering voor actieve samenwerkingen.
// Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- In-memory store --------------------------------------------------------
const store = {
  collaborations: [] as Array<Record<string, unknown>>,
  administrationEntries: [] as Array<Record<string, unknown>>,
  invoices: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  users: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findMany: vi.fn(async () => store.collaborations),
    },
    administrationEntry: {
      findMany: vi.fn(async () => store.administrationEntries),
    },
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
      findMany: vi.fn(async () => store.users),
    },
    platformConfig: {
      findUnique: vi.fn(async () => null), // valt terug op statische defaults
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

vi.mock("@/lib/services/mail-sender", () => ({
  getMailSender: () => ({ send: vi.fn(async () => {}) }),
}));
vi.mock("@/lib/services/reminder-emails", () => ({
  buildDbaSignalEmail: vi.fn(() => ({ to: "", subject: "", text: "" })),
}));

// Vaste datum: meer dan 12 maanden na startDate hieronder → "HOOG" signaal
const NOW = new Date("2026-06-09T12:00:00.000Z");

function makeCollaboration(
  id: string,
  startDate: Date,
  freelancerUserId = "f-1",
  clientUserId = "c-1",
) {
  return {
    id,
    startDate,
    freelancer: { userId: freelancerUserId },
    company: { userId: clientUserId },
    job: { dbaDirectSupervision: false, dbaEmbedded: false, dbaFixedSchedule: false },
  };
}

describe("runDbaMonitorTask", () => {
  beforeEach(async () => {
    store.collaborations = [];
    store.administrationEntries = [];
    store.invoices = [];
    store.domainEvents = [];
    store.notifications = [];
    store.auditLogs = [];
    store.users = [];
    vi.resetModules();
  });

  it("lege toestand — geen samenwerkingen → raised = 0", async () => {
    const { runDbaMonitorTask } = await import("@/lib/dba-monitor-task");
    const result = await runDbaMonitorTask({ actorId: null, now: NOW });
    expect(result).toEqual({ raised: 0 });
    expect(store.domainEvents).toHaveLength(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("happy path — samenwerking > 12 maanden → DBA-signaal HOOG, notificaties bij beide partijen + audit", async () => {
    // Gestart meer dan 12 maanden geleden
    const startDate = new Date("2024-12-01T00:00:00.000Z");
    store.collaborations = [makeCollaboration("col-1", startDate, "f-1", "c-1")];
    store.users = [
      { id: "f-1", email: "f@test.nl", name: "ZZP'er" },
      { id: "c-1", email: "c@test.nl", name: "OG" },
    ];

    const { runDbaMonitorTask } = await import("@/lib/dba-monitor-task");
    const result = await runDbaMonitorTask({ actorId: null, now: NOW });

    expect(result.raised).toBeGreaterThan(0);
    // DomainEvent aangemaakt
    expect(store.domainEvents.length).toBeGreaterThan(0);
    expect(store.domainEvents[0]?.type).toBe("DBA_SIGNAL_RAISED");
    // Notificaties: 2 per signaal (freelancer + client)
    expect(store.notifications.length).toBeGreaterThanOrEqual(2);
    const notifTypes = store.notifications.map((n) => n.type);
    expect(notifTypes.every((t) => t === "DBA_SIGNAL")).toBe(true);
    // Auditregel
    expect(store.auditLogs.length).toBeGreaterThan(0);
    expect(store.auditLogs[0]?.action).toBe("DBA_SIGNAL_RAISED");
  });

  it("idempotentie — al-gevuurd DomainEvent → geen nieuw signaal bij tweede run", async () => {
    const startDate = new Date("2024-12-01T00:00:00.000Z");
    store.collaborations = [makeCollaboration("col-2", startDate, "f-2", "c-2")];

    const { runDbaMonitorTask } = await import("@/lib/dba-monitor-task");
    const first = await runDbaMonitorTask({ actorId: null, now: NOW });
    // Markeer alle gegenereerde dedupeKeys als bestaand
    const beforeCount = store.domainEvents.length;
    const second = await runDbaMonitorTask({ actorId: null, now: NOW });
    expect(second.raised).toBe(0);
    // Geen nieuwe DomainEvents
    expect(store.domainEvents.length).toBe(beforeCount);
    expect(first.raised).toBeGreaterThan(0);
  });

  it("recente samenwerking < 6 maanden → geen signalen", async () => {
    // Net gestart, geen DBA-indicatoren
    const startDate = new Date("2026-04-01T00:00:00.000Z");
    store.collaborations = [makeCollaboration("col-3", startDate)];

    const { runDbaMonitorTask } = await import("@/lib/dba-monitor-task");
    const result = await runDbaMonitorTask({ actorId: null, now: NOW });

    expect(result.raised).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });

  it("hoge omzetconcentratie (>80%) → signaal VERHOOGD", async () => {
    // Samenwerking 3 maanden (geen duur-signaal), maar 100% omzet bij één opdrachtgever
    const startDate = new Date("2026-03-01T00:00:00.000Z");
    store.collaborations = [makeCollaboration("col-4", startDate, "f-4", "c-4")];
    // Administratie-invoer: alle omzet bij c-4
    store.administrationEntries = [
      { ownerUserId: "f-4", creditCents: 10000, debitCents: 0, invoiceId: "inv-c4" },
    ];
    store.invoices = [{ id: "inv-c4", counterpartyUserId: "c-4" }];
    store.users = [
      { id: "f-4", email: "f4@test.nl", name: "ZZP 4" },
      { id: "c-4", email: "c4@test.nl", name: "OG 4" },
    ];

    const { runDbaMonitorTask } = await import("@/lib/dba-monitor-task");
    const result = await runDbaMonitorTask({ actorId: null, now: NOW });

    expect(result.raised).toBeGreaterThan(0);
    expect(store.domainEvents[0]?.type).toBe("DBA_SIGNAL_RAISED");
  });
});
