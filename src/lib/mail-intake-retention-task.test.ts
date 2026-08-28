// Unit-tests voor runMailIntakeRetentionTask — wissen op receivedAt uitsluitend voor besliste intakes
// (ACCEPTED/DISMISSED; de kritieke scope-veiligheidsguard: nooit een NEW/heropende intake wissen),
// gebatchte verwijdering, idempotentie, het snoei-auditrecord (zonder PII) en de expliciete
// uit-override. `@/lib/config` gemockt om het venster te sturen; prisma-laag in-memory gemockt met een
// getrouwe evaluatie van béíde where-predicaten (receivedAt-cutoff + de status-guard); klok geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockbaar retentievenster: default 180 dagen, per test te overschrijven.
let retentionDaysValue = 180;
vi.mock("@/lib/config", () => ({
  mailIntakeRetentionDays: () => retentionDaysValue,
}));

interface IntakeRow {
  id: string;
  receivedAt: Date;
  status: string;
  fromAddress: string | null;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
}

const store = { intakes: [] as IntakeRow[], auditLogs: [] as AuditRow[] };
let idSeq = 0;

interface WhereArg {
  receivedAt: { lt: Date };
  status: { in: string[] };
}

function matches(r: IntakeRow, where: WhereArg): boolean {
  if (!(r.receivedAt < where.receivedAt.lt)) return false;
  return where.status.in.includes(r.status);
}

vi.mock("@/lib/db", () => ({
  prisma: {
    mailIntake: {
      findMany: vi.fn(
        async (args: { where: WhereArg | { id: { in: string[] } }; take?: number }) => {
          // Survivor-diff-query ná de delete: `{ where: { id: { in: [...] } } }` zonder status/cutoff.
          if ("id" in args.where && !("receivedAt" in args.where)) {
            const ids = new Set((args.where as { id: { in: string[] } }).id.in);
            return store.intakes.filter((r) => ids.has(r.id)).map((r) => ({ id: r.id }));
          }
          const where = args.where as WhereArg;
          return store.intakes
            .filter((r) => matches(r, where))
            .slice(0, args.take ?? store.intakes.length)
            .map((r) => ({ id: r.id, fromAddress: r.fromAddress }));
        },
      ),
      // Honoreert het VOLLEDIGE where-predicaat (receivedAt-cutoff + status-guard) én de id-set — niet
      // alleen `id.in`. Zo maakt een regressie op de fail-closed guard (het weglaten van `...where` op de
      // delete) zichtbaar: een rij die tussen selectie en delete niet meer aan `where` voldoet (bv. een
      // DISMISSED→NEW-reopen) mag niet gewist worden.
      deleteMany: vi.fn(async (args: { where: WhereArg & { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.intakes.length;
        store.intakes = store.intakes.filter((r) => !(ids.has(r.id) && matches(r, args.where)));
        return { count: before - store.intakes.length };
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
        const row: AuditRow = { id: `audit-${idSeq++}`, createdAt: new Date(), ...args.data };
        store.auditLogs.push(row);
        return row;
      }),
      findMany: vi.fn(
        async (args: {
          where: { action: string; entityType: string; entityId: { in: string[] } };
        }) => {
          const ids = new Set(args.where.entityId.in);
          return store.auditLogs
            .filter(
              (r) =>
                r.action === args.where.action &&
                r.entityType === args.where.entityType &&
                ids.has(r.entityId),
            )
            .map((r) => ({ id: r.id, entityId: r.entityId, metadata: r.metadata }));
        },
      ),
      update: vi.fn(async (args: { where: { id: string }; data: { metadata: unknown } }) => {
        const row = store.auditLogs.find((r) => r.id === args.where.id);
        if (row) row.metadata = args.data.metadata;
        return row;
      }),
    },
  },
}));

import {
  runMailIntakeRetentionTask,
  prunableMailIntakeWhere,
} from "@/lib/mail-intake-retention-task";
import { prisma } from "@/lib/db";

const NOW = new Date("2026-08-28T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seed(count: number, ageDays: number, prefix: string, status: string): void {
  for (let i = 0; i < count; i++) {
    store.intakes.push({
      id: `${prefix}-${i}`,
      receivedAt: new Date(NOW.getTime() - ageDays * DAY),
      status,
      fromAddress: `${prefix}-${i}@extern.example`,
    });
  }
}

// Spiegelt het MAIL_INTAKE_RECEIVED-auditrecord dat de inbound-webhook schrijft: metadata als
// JSON-string (net als auditData in productie), met de derde-partij-PII `fromAddress`.
function seedReceivedAudit(intakeId: string, fromAddress: string): void {
  store.auditLogs.push({
    id: `audit-${idSeq++}`,
    action: "MAIL_INTAKE_RECEIVED",
    entityType: "MailIntake",
    entityId: intakeId,
    metadata: JSON.stringify({ messageId: `msg-${intakeId}`, fromAddress }),
    createdAt: NOW,
  });
}

function receivedAuditFor(intakeId: string): AuditRow | undefined {
  return store.auditLogs.find(
    (r) => r.action === "MAIL_INTAKE_RECEIVED" && r.entityId === intakeId,
  );
}

beforeEach(() => {
  store.intakes = [];
  store.auditLogs = [];
  idSeq = 0;
  retentionDaysValue = 180;
});

describe("runMailIntakeRetentionTask", () => {
  it("snoeit oude besliste intakes (ACCEPTED/DISMISSED) op het geconfigureerde venster", async () => {
    seed(2, 200, "old-accepted", "ACCEPTED"); // > 180, beslist → weg
    seed(2, 200, "old-dismissed", "DISMISSED"); // > 180, beslist → weg
    seed(2, 100, "recent-accepted", "ACCEPTED"); // binnen 180 → blijft
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.enabled).toBe(true);
    expect(res.retentionDays).toBe(180);
    expect(res.pruned).toBe(4);
    expect(store.intakes.map((r) => r.id).sort()).toEqual([
      "recent-accepted-0",
      "recent-accepted-1",
    ]);
  });

  it("wist NOOIT een NEW intake (nog te beoordelen / heropend), ook niet als 'ie oud is", async () => {
    seed(3, 500, "pending", "NEW"); // oud maar nog in de queue → blijft
    seed(1, 500, "done", "DISMISSED"); // oud + beslist → weg
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1);
    expect(store.intakes.map((r) => r.id).sort()).toEqual(["pending-0", "pending-1", "pending-2"]);
  });

  it("kan expliciet uit (venster <= 0): niets sneuvelt, geen audit", async () => {
    retentionDaysValue = 0;
    seed(3, 1000, "old", "DISMISSED");
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res).toEqual({ enabled: false, pruned: 0, retentionDays: 0, cutoff: null });
    expect(store.intakes).toHaveLength(3);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seed(1, 200, "old", "ACCEPTED");
    await runMailIntakeRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "MAIL_INTAKE_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("MailIntake");
    expect(records[0]?.entityId).toBe("retention");
    // Metadata mag geen mailinhoud (fromAddress/subject/textBody) dragen — alleen telling + venster + cutoff.
    // auditData serialiseert de metadata naar een JSON-string; parse terug voor de assertie.
    expect(JSON.parse(records[0]?.metadata as string)).toEqual({
      pruned: 1,
      auditScrubbed: 0,
      retentionDays: 180,
      cutoff: new Date(NOW.getTime() - 180 * DAY).toISOString(),
    });
  });

  it("redact fromAddress uit het MAIL_INTAKE_RECEIVED-auditrecord van een gewiste intake (AVG art. 5(1)(e))", async () => {
    seed(1, 200, "old", "ACCEPTED"); // > 180, beslist → wordt gewist
    seedReceivedAudit("old-0", "old-0@extern.example");
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1);
    // De PII-kopie in de auditlog is geredact, operationele velden blijven staan.
    const audit = receivedAuditFor("old-0");
    expect(JSON.parse(audit?.metadata as string)).toEqual({
      messageId: "msg-old-0",
      fromAddress: "[verwijderd]",
    });
    // De snoei-auditrecord telt de geredacte records mee (art. 5(2) verantwoording).
    const prune = store.auditLogs.find((r) => r.action === "MAIL_INTAKE_PRUNED");
    expect(JSON.parse(prune?.metadata as string).auditScrubbed).toBe(1);
  });

  it("laat het auditrecord van een TOCTOU-heropende (niet-gewiste) intake ongemoeid", async () => {
    seed(1, 200, "reopened", "DISMISSED");
    seedReceivedAudit("reopened-0", "reopened-0@extern.example");
    const findManyMock = prisma.mailIntake.findMany as unknown as {
      mockImplementationOnce: (
        impl: (args: { where: WhereArg; take: number }) => Promise<{ id: string }[]>,
      ) => void;
    };
    // Reopen (DISMISSED→NEW) net ná de selectie: de fail-closed deleteMany wist niets, dus het
    // auditspoor (met fromAddress) hoort te blijven staan zolang de bronrij bestaat.
    findManyMock.mockImplementationOnce(async (args) => {
      const selected = store.intakes
        .filter((r) => matches(r, args.where))
        .slice(0, args.take)
        .map((r) => ({ id: r.id, fromAddress: r.fromAddress }));
      for (const r of store.intakes) if (r.id === "reopened-0") r.status = "NEW";
      return selected;
    });
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    const audit = receivedAuditFor("reopened-0");
    expect(JSON.parse(audit?.metadata as string).fromAddress).toBe("reopened-0@extern.example");
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seed(2, 100, "recent", "DISMISSED");
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seed(1200, 200, "old", "DISMISSED"); // > 500 → meerdere batches
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.pruned).toBe(1200);
    expect(store.intakes).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seed(3, 200, "old", "ACCEPTED");
    await runMailIntakeRetentionTask({ now: NOW });
    const second = await runMailIntakeRetentionTask({ now: NOW });
    expect(second.pruned).toBe(0);
  });

  it("wist NOOIT een intake die tussen selectie en delete live heropend werd naar NEW (TOCTOU fail-closed)", async () => {
    seed(1, 200, "reopened", "DISMISSED"); // oud + beslist → wordt door findMany geselecteerd
    // Simuleer een concurrente reopen (DISMISSED→NEW) net ná de selectie, vóór de delete: de findMany
    // levert de rij nog als kandidaat, maar de status verandert direct erna. De fail-closed deleteMany
    // (die het volledige where-predicaat honoreert) mag die nu-NEW rij dan niet meer wissen. De mock is
    // los getypeerd (de echte Prisma-findMany-signatuur doet hier niet ter zake — de vi.mock-factory
    // levert een simpele stub).
    const findManyMock = prisma.mailIntake.findMany as unknown as {
      mockImplementationOnce: (
        impl: (args: { where: WhereArg; take: number }) => Promise<{ id: string }[]>,
      ) => void;
    };
    findManyMock.mockImplementationOnce(async (args) => {
      const selected = store.intakes
        .filter((r) => matches(r, args.where))
        .slice(0, args.take)
        .map((r) => ({ id: r.id }));
      for (const r of store.intakes) if (r.id === "reopened-0") r.status = "NEW";
      return selected;
    });
    const res = await runMailIntakeRetentionTask({ now: NOW });
    expect(res.pruned).toBe(0);
    expect(store.intakes.map((r) => r.id)).toEqual(["reopened-0"]);
    // Geen snoei → geen auditrecord.
    expect(store.auditLogs).toHaveLength(0);
  });

  it("prunableMailIntakeWhere bevat de receivedAt-cutoff én de besliste-status-guard", () => {
    const cutoff = new Date(NOW.getTime() - 180 * DAY);
    expect(prunableMailIntakeWhere(cutoff)).toEqual({
      receivedAt: { lt: cutoff },
      status: { in: ["ACCEPTED", "DISMISSED"] },
    });
  });
});
