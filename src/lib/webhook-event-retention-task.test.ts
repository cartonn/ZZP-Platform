// Unit-tests voor runWebhookEventRetentionTask — opt-in gedrag, gebatchte verwijdering, idempotentie
// en het snoei-auditrecord. Prisma-laag in-memory gemockt; klok + env geïnjecteerd.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface LedgerRow {
  id: string;
  provider: string;
  eventKey: string;
  createdAt: Date;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

const store = { ledger: [] as LedgerRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

vi.mock("@/lib/db", () => ({
  prisma: {
    processedWebhookEvent: {
      findMany: vi.fn(async (args: { where: { createdAt: { lt: Date } }; take: number }) => {
        const cutoff = args.where.createdAt.lt;
        return store.ledger
          .filter((r) => r.createdAt < cutoff)
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.ledger.length;
        store.ledger = store.ledger.filter((r) => !ids.has(r.id));
        return { count: before - store.ledger.length };
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

import {
  runWebhookEventRetentionTask,
  prunableWebhookEventWhere,
} from "@/lib/webhook-event-retention-task";

const NOW = new Date("2026-07-18T12:00:00.000Z");

function seed(count: number, ageDays: number, prefix = "old"): void {
  for (let i = 0; i < count; i++) {
    store.ledger.push({
      id: `${prefix}-${i}`,
      provider: "stripe",
      eventKey: `ref-${prefix}-${i}:paid`,
      createdAt: new Date(NOW.getTime() - ageDays * 24 * 60 * 60 * 1000),
    });
  }
}

beforeEach(() => {
  store.ledger = [];
  store.auditLogs = [];
  idSeq = 0;
  delete process.env.WEBHOOK_EVENT_RETENTION_DAYS;
});

afterEach(() => {
  delete process.env.WEBHOOK_EVENT_RETENTION_DAYS;
});

describe("runWebhookEventRetentionTask", () => {
  it("is een no-op als retentie uit staat (geen env)", async () => {
    seed(3, 1000);
    const res = await runWebhookEventRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.ledger).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("snoeit rijen ouder dan het venster en laat recente staan", async () => {
    process.env.WEBHOOK_EVENT_RETENTION_DAYS = "90";
    seed(2, 120, "stale"); // ouder dan 90 dagen → weg
    seed(2, 30, "recent"); // binnen 90 dagen → blijft
    const res = await runWebhookEventRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.pruned).toBe(2);
    expect(res.retentionDays).toBe(90);
    expect(store.ledger.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
    expect(store.ledger.filter((r) => r.id.startsWith("stale"))).toHaveLength(0);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    process.env.WEBHOOK_EVENT_RETENTION_DAYS = "90";
    seed(1, 120, "stale");
    await runWebhookEventRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "WEBHOOK_EVENT_LEDGER_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("ProcessedWebhookEvent");
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    process.env.WEBHOOK_EVENT_RETENTION_DAYS = "90";
    seed(2, 10, "recent");
    const res = await runWebhookEventRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    process.env.WEBHOOK_EVENT_RETENTION_DAYS = "90";
    seed(1200, 120, "stale"); // > 500 → meerdere batches
    const res = await runWebhookEventRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.ledger.filter((r) => r.id.startsWith("stale"))).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    process.env.WEBHOOK_EVENT_RETENTION_DAYS = "90";
    seed(3, 120, "stale");
    await runWebhookEventRetentionTask({ now: NOW });
    const second = await runWebhookEventRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });

  it("klemt een te korte termijn naar de minimumvloer (30 dagen)", async () => {
    process.env.WEBHOOK_EVENT_RETENTION_DAYS = "1"; // typefout → geklemd naar 30
    seed(2, 40, "stale"); // 40 dagen oud → buiten 30-dagen-vloer → weg
    seed(2, 20, "recent"); // 20 dagen oud → binnen 30 → blijft
    const res = await runWebhookEventRetentionTask({ now: NOW });
    expect(res.retentionDays).toBe(30);
    expect(res.pruned).toBe(2);
    expect(store.ledger.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
  });
});

describe("prunableWebhookEventWhere", () => {
  it("bouwt de gedeelde snoei-where (rijen ouder dan de cutoff) — één bron van waarheid met de gauge", () => {
    const cutoff = new Date("2026-01-01T00:00:00.000Z");
    // Exact de vorm die zowel de taak (findMany) als de /api/metrics-backlog-gauge (count) gebruiken;
    // ze mogen niet uit elkaar lopen, anders telt de gauge iets anders dan de cron snoeit.
    expect(prunableWebhookEventWhere(cutoff)).toEqual({ createdAt: { lt: cutoff } });
  });
});
