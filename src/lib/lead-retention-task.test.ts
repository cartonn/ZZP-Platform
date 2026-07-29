// Unit-tests voor runLeadRetentionTask — standaard-AAN gedrag (het beloofde venster wordt afgedwongen
// zonder env), gebatchte verwijdering, dat alleen BESLISTE leads sneuvelen (KOUD/WARM overleven altijd),
// idempotentie en het snoei-auditrecord. Prisma-laag in-memory gemockt; klok + env geïnjecteerd.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface LeadRow {
  id: string;
  status: string;
  updatedAt: Date;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
}

const store = { leads: [] as LeadRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      findMany: vi.fn(
        async (args: {
          where: { status: { in: string[] }; updatedAt: { lt: Date } };
          take: number;
        }) => {
          const cutoff = args.where.updatedAt.lt;
          const eligible = new Set(args.where.status.in);
          return store.leads
            .filter((r) => eligible.has(r.status) && r.updatedAt < cutoff)
            .slice(0, args.take)
            .map((r) => ({ id: r.id }));
        },
      ),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.leads.length;
        store.leads = store.leads.filter((r) => !ids.has(r.id));
        return { count: before - store.leads.length };
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

import { runLeadRetentionTask, prunableLeadWhere } from "@/lib/lead-retention-task";

const NOW = new Date("2026-07-23T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seed(count: number, status: string, ageDays: number, prefix: string): void {
  for (let i = 0; i < count; i++) {
    store.leads.push({
      id: `${prefix}-${i}`,
      status,
      updatedAt: new Date(NOW.getTime() - ageDays * DAY),
    });
  }
}

beforeEach(() => {
  store.leads = [];
  store.auditLogs = [];
  idSeq = 0;
  delete process.env.LEAD_RETENTION_DAYS;
});

afterEach(() => {
  delete process.env.LEAD_RETENTION_DAYS;
});

describe("prunableLeadWhere", () => {
  it("dekt precies de beslíste statussen (KLANT/NO_DEAL) én ouder-dan-cutoff, en niets anders", () => {
    const cutoff = new Date(NOW.getTime() - 365 * DAY);
    const where = prunableLeadWhere(cutoff);
    expect(where.updatedAt).toEqual({ lt: cutoff });
    // Actieve prospects (KOUD/WARM) horen NOOIT in de sweep — spiegelt isLeadRetentionEligible.
    const statuses = (where.status as { in: string[] }).in;
    expect(new Set(statuses)).toEqual(new Set(["KLANT", "NO_DEAL"]));
    expect(statuses).not.toContain("KOUD");
    expect(statuses).not.toContain("WARM");
  });
});

describe("runLeadRetentionTask", () => {
  it("dwingt standaard (geen env) het beloofde 365-dagen-venster af", async () => {
    seed(2, "NO_DEAL", 400, "old"); // > 365 dagen → weg
    seed(2, "NO_DEAL", 100, "recent"); // binnen 365 → blijft
    const res = await runLeadRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.retentionDays).toBe(365);
    expect(res.pruned).toBe(2);
    expect(store.leads.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
    expect(store.leads.filter((r) => r.id.startsWith("old"))).toHaveLength(0);
  });

  it("snoeit NOOIT actieve prospects (KOUD/WARM), hoe oud ook", async () => {
    seed(3, "KOUD", 1000, "koud");
    seed(3, "WARM", 1000, "warm");
    seed(2, "KLANT", 1000, "klant"); // beslist → weg
    const res = await runLeadRetentionTask({ now: NOW });
    expect(res.pruned).toBe(2);
    expect(store.leads.filter((r) => r.status === "KOUD")).toHaveLength(3);
    expect(store.leads.filter((r) => r.status === "WARM")).toHaveLength(3);
    expect(store.leads.filter((r) => r.status === "KLANT")).toHaveLength(0);
  });

  it("kan expliciet uit (env <= 0): niets sneuvelt", async () => {
    process.env.LEAD_RETENTION_DAYS = "0";
    seed(3, "NO_DEAL", 1000, "old");
    const res = await runLeadRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.leads).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("klemt een te kort venster naar de minimumvloer (90 dagen)", async () => {
    process.env.LEAD_RETENTION_DAYS = "1"; // typefout → geklemd naar 90
    seed(2, "NO_DEAL", 120, "old"); // > 90 → weg
    seed(2, "NO_DEAL", 30, "recent"); // binnen 90 → blijft
    const res = await runLeadRetentionTask({ now: NOW });
    expect(res.retentionDays).toBe(90);
    expect(res.pruned).toBe(2);
    expect(store.leads.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seed(1, "NO_DEAL", 400, "old");
    await runLeadRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "LEADS_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("Lead");
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seed(2, "NO_DEAL", 10, "recent");
    const res = await runLeadRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seed(1200, "NO_DEAL", 400, "old"); // > 500 → meerdere batches
    const res = await runLeadRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.leads).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seed(3, "NO_DEAL", 400, "old");
    await runLeadRetentionTask({ now: NOW });
    const second = await runLeadRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });
});
