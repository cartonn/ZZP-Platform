// Unit-tests voor runAuditRetentionTask — opt-in gedrag, gebatchte verwijdering, idempotentie en
// het verantwoordings-auditrecord. Prisma-laag in-memory gemockt; klok + env geïnjecteerd.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  metadata?: string | null;
}

const store = { auditLogs: [] as AuditRow[] };
let idSeq = 0;

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(async (args: { where: { createdAt: { lt: Date } }; take: number }) => {
        const cutoff = args.where.createdAt.lt;
        return store.auditLogs
          .filter((r) => r.createdAt < cutoff)
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.auditLogs.length;
        store.auditLogs = store.auditLogs.filter((r) => !ids.has(r.id));
        return { count: before - store.auditLogs.length };
      }),
      create: vi.fn(async (args: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
        const row: AuditRow = { id: `new-${idSeq++}`, createdAt: new Date(), ...args.data };
        store.auditLogs.push(row);
        return row;
      }),
    },
  },
}));

import { runAuditRetentionTask } from "@/lib/audit-retention-task";

const NOW = new Date("2026-07-14T12:00:00.000Z");

function seed(count: number, ageDays: number, prefix = "old"): void {
  for (let i = 0; i < count; i++) {
    store.auditLogs.push({
      id: `${prefix}-${i}`,
      action: "LOGIN",
      entityType: "User",
      entityId: `u${i}`,
      createdAt: new Date(NOW.getTime() - ageDays * 24 * 60 * 60 * 1000),
    });
  }
}

beforeEach(() => {
  store.auditLogs = [];
  idSeq = 0;
  delete process.env.AUDIT_LOG_RETENTION_DAYS;
});

afterEach(() => {
  delete process.env.AUDIT_LOG_RETENTION_DAYS;
});

describe("runAuditRetentionTask", () => {
  it("is een no-op als retentie uit staat (geen env)", async () => {
    seed(3, 1000);
    const res = await runAuditRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.auditLogs).toHaveLength(3);
  });

  it("snoeit regels ouder dan het venster en laat recente staan", async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "365";
    seed(2, 400, "stale"); // ouder dan een jaar → weg
    seed(2, 100, "recent"); // binnen een jaar → blijft
    const res = await runAuditRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.pruned).toBe(2);
    expect(res.retentionDays).toBe(365);
    // 2 recente + 1 verantwoordings-auditrecord
    expect(store.auditLogs.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
    expect(store.auditLogs.filter((r) => r.id.startsWith("stale"))).toHaveLength(0);
  });

  it("schrijft één verantwoordings-auditrecord (AVG art. 5 lid 2) alleen bij daadwerkelijk snoeien", async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "365";
    seed(1, 400, "stale");
    await runAuditRetentionTask({ now: NOW });
    const pruneRecords = store.auditLogs.filter((r) => r.action === "AUDIT_LOG_PRUNED");
    expect(pruneRecords).toHaveLength(1);
    expect(pruneRecords[0]?.entityType).toBe("AuditLog");
  });

  it("schrijft geen verantwoordingsrecord als er niets te snoeien is", async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "365";
    seed(2, 10, "recent");
    const res = await runAuditRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs.filter((r) => r.action === "AUDIT_LOG_PRUNED")).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "365";
    seed(1200, 400, "stale"); // > 500 → meerdere batches
    const res = await runAuditRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.auditLogs.filter((r) => r.id.startsWith("stale"))).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "365";
    seed(3, 400, "stale");
    await runAuditRetentionTask({ now: NOW });
    const second = await runAuditRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });

  it("klemt een te korte termijn naar de minimumvloer (30 dagen)", async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = "1"; // typefout → geklemd naar 30
    seed(2, 40, "stale"); // 40 dagen oud → buiten 30-dagen-vloer → weg
    seed(2, 20, "recent"); // 20 dagen oud → binnen 30 → blijft
    const res = await runAuditRetentionTask({ now: NOW });
    expect(res.retentionDays).toBe(30);
    expect(res.pruned).toBe(2);
    expect(store.auditLogs.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
  });
});
