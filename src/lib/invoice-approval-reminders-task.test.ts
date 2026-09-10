// Unit-tests voor runInvoiceApprovalReminderTask — herinneringen voor ongekeurde (SUBMITTED)
// cascade-facturen. Prisma-laag volledig gemockt; klok via vaste datum geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  invoices: [] as Array<Record<string, unknown>>,
  domainEvents: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  auditLogs: [] as Array<Record<string, unknown>>,
  admins: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(async () => store.invoices),
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
      findMany: vi.fn(async () => store.admins),
    },
    $transaction: vi.fn(async (ops: Array<Promise<unknown>>) => Promise.all(ops)),
  },
}));

import { runInvoiceApprovalReminderTask } from "@/lib/invoice-approval-reminders-task";

const NOW = new Date("2026-06-18T12:00:00.000Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
}

function invoiceRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "inv-1",
    lifecycleStatus: "SUBMITTED",
    issuedAt: daysAgo(3),
    counterpartyUserId: "client-1",
    partyInvoiceNumber: "2026-0007",
    collaboration: {
      status: "ACTIVE",
      disputedAt: null,
    },
    ...over,
  };
}

beforeEach(() => {
  store.invoices = [];
  store.domainEvents = [];
  store.notifications = [];
  store.auditLogs = [];
  store.admins = [{ id: "admin-1" }];
});

describe("runInvoiceApprovalReminderTask", () => {
  it("doet niets bij een lege wachtrij", async () => {
    const res = await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0, escalated: 0 });
    expect(store.notifications).toHaveLength(0);
  });

  it("herinnert de opdrachtgever op dag 3 (notificatie + event + audit)", async () => {
    store.invoices = [invoiceRow({ issuedAt: daysAgo(3) })];
    const res = await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 1, escalated: 0 });
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0]?.userId).toBe("client-1");
    expect(store.notifications[0]?.type).toBe("INVOICE_APPROVAL_REMINDER");
    expect(store.notifications[0]?.link).toBe("/facturen");
    expect(store.notifications[0]?.body).toContain("Factuur 2026-0007");
    expect(store.domainEvents).toHaveLength(1);
    expect(store.domainEvents[0]?.type).toBe("INVOICE_APPROVAL_REMINDER");
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]?.action).toBe("INVOICE_APPROVAL_REMINDER");
  });

  it("is idempotent: een tweede run op dezelfde dag stuurt niets", async () => {
    store.invoices = [invoiceRow({ issuedAt: daysAgo(3) })];
    await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    const res2 = await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res2).toEqual({ reminded: 0, escalated: 0 });
    expect(store.notifications).toHaveLength(1);
  });

  it("escaleert naar elke admin na de laatste herinnering (dag 8)", async () => {
    store.admins = [{ id: "admin-1" }, { id: "admin-2" }];
    store.invoices = [invoiceRow({ issuedAt: daysAgo(8) })];
    const res = await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0, escalated: 1 });
    expect(store.notifications).toHaveLength(2); // één per admin
    expect(store.notifications.every((n) => n.type === "INVOICE_APPROVAL_ESCALATION")).toBe(true);
    expect(store.notifications[0]?.link).toBe("/admin/samenwerkingen");
    expect(store.auditLogs[0]?.action).toBe("INVOICE_APPROVAL_ESCALATED");
  });

  it("valt terug op een neutraal label zonder factuurnummer", async () => {
    store.invoices = [invoiceRow({ partyInvoiceNumber: null, issuedAt: daysAgo(8) })];
    await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(store.notifications[0]?.body).toContain("Een ingediende factuur");
  });

  it("nudget niet op een betwiste samenwerking", async () => {
    store.invoices = [
      invoiceRow({
        issuedAt: daysAgo(3),
        collaboration: { status: "ACTIVE", disputedAt: daysAgo(1) },
      }),
    ];
    const res = await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 0, escalated: 0 });
  });

  it("verwerkt een losstaande factuur zonder samenwerking (collaboration = null)", async () => {
    store.invoices = [invoiceRow({ issuedAt: daysAgo(3), collaboration: null })];
    const res = await runInvoiceApprovalReminderTask({ actorId: null, now: NOW });
    expect(res).toEqual({ reminded: 1, escalated: 0 });
  });
});
