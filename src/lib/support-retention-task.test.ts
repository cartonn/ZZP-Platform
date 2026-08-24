// Unit-tests voor runSupportTicketRetentionTask — wissen op resolvedAt uitsluitend voor afgehandelde
// (RESOLVED) tickets met een gezet afhandelmoment (de kritieke scope-veiligheidsguard: nooit een
// lopend/legacy ticket wissen), gebatchte verwijdering, idempotentie, het snoei-auditrecord (zonder
// PII) en de expliciete uit-override. `@/lib/config` gemockt om het venster te sturen; prisma-laag
// in-memory gemockt met een getrouwe evaluatie van het where-predicaat (status + resolvedAt-cutoff);
// klok geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockbaar retentievenster: default 365 dagen (12 maanden), per test te overschrijven.
let retentionDaysValue = 365;
vi.mock("@/lib/config", () => ({
  supportTicketRetentionDays: () => retentionDaysValue,
}));

interface TicketRow {
  id: string;
  status: string;
  resolvedAt: Date | null;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
}

const store = { tickets: [] as TicketRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

interface WhereArg {
  status: string;
  resolvedAt: { not: null; lt: Date };
}

function matches(r: TicketRow, where: WhereArg): boolean {
  if (r.status !== where.status) return false;
  if (r.resolvedAt === null) return false; // `not: null`-guard
  return r.resolvedAt < where.resolvedAt.lt;
}

vi.mock("@/lib/db", () => ({
  prisma: {
    supportTicket: {
      findMany: vi.fn(async (args: { where: WhereArg; take: number }) => {
        return store.tickets
          .filter((r) => matches(r, args.where))
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } & Partial<WhereArg> }) => {
        const ids = new Set(args.where.id.in);
        const hasGuard = args.where.status !== undefined || args.where.resolvedAt !== undefined;
        const before = store.tickets.length;
        store.tickets = store.tickets.filter((r) => {
          if (!ids.has(r.id)) return true; // niet in deze batch → blijft
          // Een echte DB-delete honoreert de VOLLEDIGE where: een rij die op verwijdermoment niet
          // meer aan status/resolvedAt voldoet (bv. heropend in het TOCTOU-venster) wordt overgeslagen.
          if (hasGuard) return !matches(r, args.where as WhereArg);
          return false; // alleen id-filter → verwijderen
        });
        return { count: before - store.tickets.length };
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
  runSupportTicketRetentionTask,
  prunableSupportTicketWhere,
} from "@/lib/support-retention-task";

const NOW = new Date("2026-08-24T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seed(
  count: number,
  prefix: string,
  opts: { status?: string; resolvedAgeDays?: number | null },
): void {
  for (let i = 0; i < count; i++) {
    store.tickets.push({
      id: `${prefix}-${i}`,
      status: opts.status ?? "RESOLVED",
      resolvedAt:
        opts.resolvedAgeDays === null || opts.resolvedAgeDays === undefined
          ? null
          : new Date(NOW.getTime() - opts.resolvedAgeDays * DAY),
    });
  }
}

beforeEach(() => {
  store.tickets = [];
  store.auditLogs = [];
  idSeq = 0;
  retentionDaysValue = 365;
});

describe("runSupportTicketRetentionTask", () => {
  it("snoeit afgehandelde tickets ouder dan het venster", async () => {
    seed(3, "old", { status: "RESOLVED", resolvedAgeDays: 400 }); // > 365 → weg
    seed(2, "recent", { status: "RESOLVED", resolvedAgeDays: 100 }); // binnen 365 → blijft
    const res = await runSupportTicketRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.retentionDays).toBe(365);
    expect(res.pruned).toBe(3);
    expect(store.tickets.map((r) => r.id).sort()).toEqual(["recent-0", "recent-1"]);
  });

  it("wist NOOIT een nog-open ticket, ook niet als het oud is", async () => {
    seed(1, "new", { status: "NEW", resolvedAgeDays: 500 });
    seed(1, "triaged", { status: "TRIAGED", resolvedAgeDays: 500 });
    seed(1, "awaiting", { status: "AWAITING_USER", resolvedAgeDays: 500 });
    seed(1, "reopened", { status: "REOPENED", resolvedAgeDays: 500 });
    seed(1, "resolved", { status: "RESOLVED", resolvedAgeDays: 500 }); // enige die weg mag
    const res = await runSupportTicketRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1);
    expect(store.tickets.map((r) => r.id).sort()).toEqual([
      "awaiting-0",
      "new-0",
      "reopened-0",
      "triaged-0",
    ]);
  });

  it("slaat een RESOLVED-ticket zonder resolvedAt (legacy) over — geen anker, niet wissen", async () => {
    seed(2, "no-anchor", { status: "RESOLVED", resolvedAgeDays: null });
    const res = await runSupportTicketRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.tickets).toHaveLength(2);
  });

  it("kan expliciet uit (venster <= 0): niets sneuvelt, geen audit", async () => {
    retentionDaysValue = 0;
    seed(3, "old", { status: "RESOLVED", resolvedAgeDays: 1000 });
    const res = await runSupportTicketRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.tickets).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seed(1, "old", { status: "RESOLVED", resolvedAgeDays: 400 });
    await runSupportTicketRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "SUPPORT_TICKETS_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("SupportTicket");
    expect(records[0]?.entityId).toBe("retention");
    // Metadata mag geen ticket-/berichtinhoud (subject/body) dragen — alleen telling + venster + cutoff.
    expect(JSON.parse(records[0]?.metadata as string)).toEqual({
      pruned: 1,
      retentionDays: 365,
      cutoff: new Date(NOW.getTime() - 365 * DAY).toISOString(),
    });
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seed(2, "recent", { status: "RESOLVED", resolvedAgeDays: 100 });
    const res = await runSupportTicketRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seed(1200, "old", { status: "RESOLVED", resolvedAgeDays: 400 });
    const res = await runSupportTicketRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.tickets).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seed(3, "old", { status: "RESOLVED", resolvedAgeDays: 400 });
    await runSupportTicketRetentionTask({ now: NOW });
    const second = await runSupportTicketRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });

  it("wist geen ticket dat in het TOCTOU-venster is heropend (deleteMany her-checkt de guard)", async () => {
    // Eén afgehandeld, verlopen ticket dat in aanmerking komt voor snoeien.
    seed(1, "old", { status: "RESOLVED", resolvedAgeDays: 400 });
    const { prisma } = await import("@/lib/db");
    const findManyMock = prisma.supportTicket.findMany as unknown as ReturnType<typeof vi.fn>;
    // Simuleer een concurrent heropening in het venster tussen findMany en deleteMany: de helpdesk
    // heropent het ticket (RESOLVED → REOPENED) nádat het als "stale" is geselecteerd, maar vóór de
    // delete. Een weer-actief ticket mag NOOIT sneuvelen (AVG art. 5(1)(d) juistheid + gegevensverlies).
    findManyMock.mockImplementationOnce(async (args: { where: WhereArg; take: number }) => {
      const rows = store.tickets
        .filter((r) => matches(r, args.where))
        .slice(0, args.take)
        .map((r) => ({ id: r.id }));
      const reopened = store.tickets.find((r) => r.id === "old-0");
      if (reopened) reopened.status = "REOPENED";
      return rows;
    });
    const res = await runSupportTicketRetentionTask({ now: NOW });
    // Zonder de `...where`-guard op de deleteMany zou het heropende ticket alsnog gewist zijn (pruned 1).
    expect(res.pruned).toBe(0);
    expect(store.tickets.map((r) => r.id)).toEqual(["old-0"]); // overleeft
  });

  it("prunableSupportTicketWhere bevat de status- én resolvedAt-guard", () => {
    const cutoff = new Date(NOW.getTime() - 365 * DAY);
    expect(prunableSupportTicketWhere(cutoff)).toEqual({
      status: "RESOLVED",
      resolvedAt: { not: null, lt: cutoff },
    });
  });
});
