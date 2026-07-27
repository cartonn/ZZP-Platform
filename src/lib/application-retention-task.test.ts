// Unit-tests voor runApplicationRetentionTask — standaard-AAN gedrag (het beloofde 28-dagen-venster
// wordt afgedwongen zonder env), wissen op updatedAt uitsluitend voor terminale niet-geaccepteerde
// reacties (REJECTED/WITHDRAWN), de kritieke cascade-veiligheidsguard (nooit een reactie MÉT
// samenwerking wissen), NEW/VIEWED/SHORTLIST/ACCEPTED die blijven staan, gebatchte verwijdering,
// idempotentie, het snoei-auditrecord (zonder PII) en de expliciete uit-override. Prisma-laag in-memory
// gemockt met een getrouwe evaluatie van álle drie where-predicaten; klok + env geïnjecteerd.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface ApplicationRow {
  id: string;
  status: string;
  updatedAt: Date;
  /** true = er hangt een Collaboration aan (mag NOOIT gewist worden — zou casceren). */
  hasCollaboration: boolean;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
}

const store = { applications: [] as ApplicationRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

interface WhereArg {
  status: { in: string[] };
  updatedAt: { lt: Date };
  collaboration: { is: null };
}

function matches(r: ApplicationRow, where: WhereArg): boolean {
  if (!where.status.in.includes(r.status)) return false;
  if (!(r.updatedAt < where.updatedAt.lt)) return false;
  // collaboration: { is: null } → alleen rijen zónder samenwerking.
  if (where.collaboration.is === null && r.hasCollaboration) return false;
  return true;
}

vi.mock("@/lib/db", () => ({
  prisma: {
    application: {
      findMany: vi.fn(async (args: { where: WhereArg; take: number }) => {
        return store.applications
          .filter((r) => matches(r, args.where))
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.applications.length;
        store.applications = store.applications.filter((r) => !ids.has(r.id));
        return { count: before - store.applications.length };
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

import { runApplicationRetentionTask } from "@/lib/application-retention-task";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seed(
  count: number,
  ageDays: number,
  prefix: string,
  status: string,
  hasCollaboration = false,
): void {
  for (let i = 0; i < count; i++) {
    store.applications.push({
      id: `${prefix}-${i}`,
      status,
      updatedAt: new Date(NOW.getTime() - ageDays * DAY),
      hasCollaboration,
    });
  }
}

beforeEach(() => {
  store.applications = [];
  store.auditLogs = [];
  idSeq = 0;
  delete process.env.APPLICATION_RETENTION_DAYS;
});

afterEach(() => {
  delete process.env.APPLICATION_RETENTION_DAYS;
});

describe("runApplicationRetentionTask", () => {
  it("dwingt standaard (geen env) het beloofde 28-dagen-venster af voor terminale reacties", async () => {
    seed(2, 40, "old-rejected", "REJECTED"); // > 28 dagen → weg
    seed(2, 40, "old-withdrawn", "WITHDRAWN"); // > 28 dagen → weg
    seed(2, 10, "recent-rejected", "REJECTED"); // binnen 28 → blijft
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.retentionDays).toBe(28);
    expect(res.pruned).toBe(4);
    expect(store.applications.map((r) => r.id).sort()).toEqual([
      "recent-rejected-0",
      "recent-rejected-1",
    ]);
  });

  it("laat niet-terminale reacties (NEW/VIEWED/SHORTLIST) met rust — selectie nog niet afgerond", async () => {
    seed(1, 100, "new", "NEW");
    seed(1, 100, "viewed", "VIEWED");
    seed(1, 100, "shortlist", "SHORTLIST");
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.applications).toHaveLength(3);
  });

  it("wist NOOIT een reactie mét samenwerking (cascade-veiligheid), ook niet als die terminaal & oud is", async () => {
    // Een REJECTED reactie die tóch een samenwerking draagt: verwijderen zou de samenwerking
    // (facturen/prestaties) mee-casceren. De guard `collaboration: { is: null }` moet dit blokkeren.
    seed(1, 100, "rejected-with-collab", "REJECTED", true);
    seed(1, 100, "accepted-with-collab", "ACCEPTED", true);
    seed(1, 100, "rejected-clean", "REJECTED", false);
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1); // alleen de schone REJECTED
    expect(store.applications.map((r) => r.id).sort()).toEqual([
      "accepted-with-collab-0",
      "rejected-with-collab-0",
    ]);
  });

  it("kan expliciet uit (env <= 0): niets sneuvelt", async () => {
    process.env.APPLICATION_RETENTION_DAYS = "0";
    seed(3, 1000, "old", "REJECTED");
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.applications).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("klemt een te kort venster naar de minimumvloer (7 dagen)", async () => {
    process.env.APPLICATION_RETENTION_DAYS = "1"; // typefout → geklemd naar 7
    seed(2, 10, "old", "REJECTED"); // > 7 → weg
    seed(2, 3, "recent", "REJECTED"); // binnen 7 → blijft
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res.retentionDays).toBe(7);
    expect(res.pruned).toBe(2);
    expect(store.applications.filter((r) => r.id.startsWith("recent"))).toHaveLength(2);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seed(1, 100, "old", "REJECTED");
    await runApplicationRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "APPLICATIONS_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("Application");
    expect(records[0]?.entityId).toBe("retention");
    // Metadata mag geen reactie-inhoud (motivatie/notitie) dragen — alleen telling + venster + cutoff.
    // auditData serialiseert de metadata naar een JSON-string; parse terug voor de assertie.
    expect(JSON.parse(records[0]?.metadata as string)).toEqual({
      pruned: 1,
      retentionDays: 28,
      cutoff: new Date(NOW.getTime() - 28 * DAY).toISOString(),
    });
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seed(2, 3, "recent", "REJECTED");
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seed(1200, 100, "old", "WITHDRAWN"); // > 500 → meerdere batches
    const res = await runApplicationRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.applications).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seed(3, 100, "old", "REJECTED");
    await runApplicationRetentionTask({ now: NOW });
    const second = await runApplicationRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });
});
