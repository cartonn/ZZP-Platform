// Unit-tests voor runMessageRetentionTask — wissen op createdAt uitsluitend voor berichten waarvan het
// gesprek niet (meer) aan een lopende samenwerking hangt (de kritieke scope-veiligheidsguard: nooit
// berichten van een PROPOSED/ACTIVE-samenwerking wissen), gebatchte verwijdering, idempotentie, het
// snoei-auditrecord (zonder PII) en de expliciete uit-override. `@/lib/config` gemockt om het venster
// te sturen; prisma-laag in-memory gemockt met een getrouwe evaluatie van béíde where-predicaten
// (createdAt-cutoff + de conversation-OR-guard); klok geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockbaar retentievenster: default 365 dagen (12 maanden), per test te overschrijven.
let retentionDaysValue = 365;
vi.mock("@/lib/config", () => ({
  messageRetentionDays: () => retentionDaysValue,
}));

interface MessageRow {
  id: string;
  createdAt: Date;
  /** null = gesprek zonder opdracht; anders het opdracht-id. */
  jobId: string | null;
  /** true = de opdracht heeft nog een niet-terminale (PROPOSED/ACTIVE) samenwerking → mag NOOIT weg. */
  liveCollaboration: boolean;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
}

const store = { messages: [] as MessageRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

interface WhereArg {
  createdAt: { lt: Date };
  conversation: {
    OR: [{ jobId: null }, { job: { collaborations: { none: { status: { in: string[] } } } } }];
  };
}

function matches(r: MessageRow, where: WhereArg): boolean {
  if (!(r.createdAt < where.createdAt.lt)) return false;
  // conversation-OR-guard: prunebaar als het gesprek geen opdracht heeft (jobId null) OF de opdracht
  // geen niet-terminale samenwerking draagt. Een levende samenwerking (jobId gezet én liveCollaboration)
  // valt buiten de sweep.
  const liveStatuses = where.conversation.OR[1].job.collaborations.none.status.in;
  const joblessAllowed = where.conversation.OR[0].jobId === null && r.jobId === null;
  const noLiveCollab = !(r.jobId !== null && r.liveCollaboration && liveStatuses.length > 0);
  return joblessAllowed || noLiveCollab;
}

vi.mock("@/lib/db", () => ({
  prisma: {
    message: {
      findMany: vi.fn(async (args: { where: WhereArg; take: number }) => {
        return store.messages
          .filter((r) => matches(r, args.where))
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.messages.length;
        store.messages = store.messages.filter((r) => !ids.has(r.id));
        return { count: before - store.messages.length };
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

import { runMessageRetentionTask, prunableMessageWhere } from "@/lib/message-retention-task";

const NOW = new Date("2026-07-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seed(
  count: number,
  ageDays: number,
  prefix: string,
  opts: { jobId?: string | null; liveCollaboration?: boolean } = {},
): void {
  for (let i = 0; i < count; i++) {
    store.messages.push({
      id: `${prefix}-${i}`,
      createdAt: new Date(NOW.getTime() - ageDays * DAY),
      jobId: opts.jobId ?? null,
      liveCollaboration: opts.liveCollaboration ?? false,
    });
  }
}

beforeEach(() => {
  store.messages = [];
  store.auditLogs = [];
  idSeq = 0;
  retentionDaysValue = 365;
});

describe("runMessageRetentionTask", () => {
  it("snoeit oude berichten van gesprekken zonder lopende samenwerking op het geconfigureerde venster", async () => {
    seed(2, 400, "old-jobless", { jobId: null }); // > 365, geen opdracht → weg
    seed(2, 400, "old-terminal", { jobId: "job-a", liveCollaboration: false }); // > 365, terminale collab → weg
    seed(2, 100, "recent-jobless", { jobId: null }); // binnen 365 → blijft
    const res = await runMessageRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.retentionDays).toBe(365);
    expect(res.pruned).toBe(4);
    expect(store.messages.map((r) => r.id).sort()).toEqual([
      "recent-jobless-0",
      "recent-jobless-1",
    ]);
  });

  it("wist NOOIT berichten van een lopende samenwerking (PROPOSED/ACTIVE), ook niet als ze oud zijn", async () => {
    seed(2, 500, "live", { jobId: "job-live", liveCollaboration: true }); // levend → blijft
    seed(1, 500, "terminal", { jobId: "job-done", liveCollaboration: false }); // terminaal → weg
    const res = await runMessageRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1);
    expect(store.messages.map((r) => r.id).sort()).toEqual(["live-0", "live-1"]);
  });

  it("kan expliciet uit (venster <= 0): niets sneuvelt, geen audit", async () => {
    retentionDaysValue = 0;
    seed(3, 1000, "old", { jobId: null });
    const res = await runMessageRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.messages).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seed(1, 400, "old", { jobId: null });
    await runMessageRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "MESSAGES_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("Message");
    expect(records[0]?.entityId).toBe("retention");
    // Metadata mag geen berichtinhoud (body) dragen — alleen telling + venster + cutoff.
    // auditData serialiseert de metadata naar een JSON-string; parse terug voor de assertie.
    expect(JSON.parse(records[0]?.metadata as string)).toEqual({
      pruned: 1,
      retentionDays: 365,
      cutoff: new Date(NOW.getTime() - 365 * DAY).toISOString(),
    });
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seed(2, 100, "recent", { jobId: null });
    const res = await runMessageRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seed(1200, 400, "old", { jobId: null }); // > 500 → meerdere batches
    const res = await runMessageRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.messages).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seed(3, 400, "old", { jobId: null });
    await runMessageRetentionTask({ now: NOW });
    const second = await runMessageRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });

  it("prunableMessageWhere bevat de createdAt-cutoff én de conversation-OR-guard", () => {
    const cutoff = new Date(NOW.getTime() - 365 * DAY);
    expect(prunableMessageWhere(cutoff)).toEqual({
      createdAt: { lt: cutoff },
      conversation: {
        OR: [
          { jobId: null },
          { job: { collaborations: { none: { status: { in: ["PROPOSED", "ACTIVE"] } } } } },
        ],
      },
    });
  });
});
