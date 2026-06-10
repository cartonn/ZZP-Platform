import { describe, expect, it } from "vitest";
import { type Prisma } from "@prisma/client";
import { applyCascadeEffects, type ApplyRefs } from "./apply";
import { emptyEffects, type CascadeEffects } from "./types";

// Transactietest voor de applier (audit-taak T2): applyCascadeEffects neemt de
// Prisma.TransactionClient als parameter, dus we injecteren een fake die elke
// schrijfactie vastlegt — geen module-mocks, geen database. De cascade-regels
// zelf zijn puur en elders getest (handlers.test.ts); hier bewaken we dat de
// applier alle effecten correct en in samenhang wegschrijft.

interface Call {
  table: string;
  method: string;
  args: Record<string, unknown>;
}

function fakeTx(opts?: { updateManyCount?: number }) {
  const calls: Call[] = [];
  const record =
    (table: string, method: string, result: unknown) => (args: Record<string, unknown>) => {
      calls.push({ table, method, args });
      return Promise.resolve(result);
    };
  const count = opts?.updateManyCount ?? 1;
  const tx = {
    invoice: {
      create: record("invoice", "create", { id: "inv-nieuw" }),
      updateMany: record("invoice", "updateMany", { count }),
    },
    collaboration: { updateMany: record("collaboration", "updateMany", { count }) },
    performance: { updateMany: record("performance", "updateMany", { count }) },
    administrationEntry: { createMany: record("administrationEntry", "createMany", { count: 0 }) },
    notification: { createMany: record("notification", "createMany", { count: 0 }) },
    auditLog: { create: record("auditLog", "create", { id: "audit-1" }) },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, calls };
}

const REFS: ApplyRefs = {
  owners: { FREELANCER: "user-zzp", CLIENT: "user-klant" },
  invoiceId: "inv-1",
  performanceId: "perf-1",
  correlationId: "corr-1",
  eventId: "evt-1",
  occurredAt: new Date("2026-06-09T12:00:00.000Z"),
};

/** Een realistisch Event B2-pakket: prestatie goedgekeurd → concept-factuur + gevolgen. */
function b2Effects(): CascadeEffects {
  return {
    ...emptyEffects(),
    newInvoice: {
      performanceId: "perf-1",
      collaborationId: "col-1",
      issuerUserId: "user-zzp",
      counterpartyUserId: "user-klant",
      issuerKey: "user-zzp",
      subtotalCents: 76800,
      vatCents: 16128,
      vatRegime: "STANDARD_HIGH",
      totalCents: 92928,
      correlationId: "corr-1",
    },
    statusChanges: [
      {
        entity: "Performance",
        id: "perf-1",
        field: "status",
        from: "SUBMITTED",
        to: "APPROVED",
        set: { approvedAt: new Date("2026-06-09T12:00:00.000Z") },
      },
    ],
    postings: [
      { party: "FREELANCER", account: "DEBITEUREN", debitCents: 92928, creditCents: 0 },
      { party: "FREELANCER", account: "OMZET", debitCents: 0, creditCents: 76800 },
    ],
    notifications: [
      { userId: "user-zzp", type: "INVOICE_DRAFT", title: "Concept-factuur klaar", link: "/x" },
    ],
    audits: [
      {
        actorId: "user-klant",
        action: "PERFORMANCE_APPROVED",
        entityType: "Performance",
        entityId: "perf-1",
      },
    ],
  };
}

describe("applyCascadeEffects", () => {
  it("schrijft een volledig B2-pakket weg: factuur, status, postings, notificatie, audit", async () => {
    const { tx, calls } = fakeTx();
    const result = await applyCascadeEffects(tx, b2Effects(), REFS);

    expect(result.createdInvoiceId).toBe("inv-nieuw");

    const create = calls.find((c) => c.table === "invoice" && c.method === "create");
    const invData = (create?.args as { data: Record<string, unknown> }).data;
    expect(invData).toMatchObject({
      number: "CONCEPT-perf-1",
      status: "DRAFT",
      lifecycleStatus: "DRAFT",
      performanceId: "perf-1",
      issuerUserId: "user-zzp",
      counterpartyUserId: "user-klant",
      issuerKey: "user-zzp",
      subtotalCents: 76800,
      vatCents: 16128,
      totalCents: 92928,
      correlationId: "corr-1",
    });

    // Statuswijziging: voorwaardelijk op de verwachte from-status, met de extra set-velden.
    const upd = calls.find((c) => c.table === "performance");
    expect(upd?.args).toMatchObject({
      where: { id: "perf-1", status: "SUBMITTED" },
      data: { status: "APPROVED", approvedAt: new Date("2026-06-09T12:00:00.000Z") },
    });

    // Postings: per regel verrijkt met eigenaar, refs en het vaste tijdstip.
    const entries = calls.find((c) => c.table === "administrationEntry");
    const rows = (entries?.args as { data: Array<Record<string, unknown>> }).data;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      party: "FREELANCER",
      ownerUserId: "user-zzp",
      account: "DEBITEUREN",
      debitCents: 92928,
      invoiceId: "inv-1",
      performanceId: "perf-1",
      correlationId: "corr-1",
      eventId: "evt-1",
      occurredAt: new Date("2026-06-09T12:00:00.000Z"),
    });

    // Notificatie: ontbrekende body wordt expliciet null (geen undefined naar de DB).
    const notif = calls.find((c) => c.table === "notification");
    const notifRows = (notif?.args as { data: Array<Record<string, unknown>> }).data;
    expect(notifRows[0]).toMatchObject({
      userId: "user-zzp",
      type: "INVOICE_DRAFT",
      body: null,
      link: "/x",
    });

    // Audit: via auditData (metadata-serialisatie en null-defaults).
    const audit = calls.find((c) => c.table === "auditLog");
    expect((audit?.args as { data: Record<string, unknown> }).data).toMatchObject({
      actorId: "user-klant",
      action: "PERFORMANCE_APPROVED",
      entityId: "perf-1",
    });
  });

  it("dispatcht statuswijzigingen naar de juiste tabel per entiteit", async () => {
    const { tx, calls } = fakeTx();
    const effects: CascadeEffects = {
      ...emptyEffects(),
      statusChanges: [
        { entity: "Collaboration", id: "col-1", field: "status", from: "PROPOSED", to: "ACTIVE" },
        { entity: "Performance", id: "perf-1", field: "status", from: "DRAFT", to: "SUBMITTED" },
        {
          entity: "Invoice",
          id: "inv-1",
          field: "lifecycleStatus",
          from: "DRAFT",
          to: "SUBMITTED",
        },
      ],
    };
    await applyCascadeEffects(tx, effects, REFS);

    expect(calls.filter((c) => c.method === "updateMany").map((c) => c.table)).toEqual([
      "collaboration",
      "performance",
      "invoice",
    ]);
    const inv = calls.find((c) => c.table === "invoice" && c.method === "updateMany");
    expect(inv?.args).toMatchObject({
      where: { id: "inv-1", lifecycleStatus: "DRAFT" },
      data: { lifecycleStatus: "SUBMITTED" },
    });
  });

  it("werpt bij een gelijktijdige statuswijziging (count ≠ 1) zodat de transactie terugrolt", async () => {
    const { tx, calls } = fakeTx({ updateManyCount: 0 });
    await expect(applyCascadeEffects(tx, b2Effects(), REFS)).rejects.toThrow(/intussen gewijzigd/);

    // Na de botsing zijn de vervolgstappen (postings/notificaties/audit) niet meer geschreven;
    // de omringende prisma.$transaction rolt de eerdere writes terug.
    expect(calls.some((c) => c.table === "administrationEntry")).toBe(false);
    expect(calls.some((c) => c.table === "notification")).toBe(false);
    expect(calls.some((c) => c.table === "auditLog")).toBe(false);
  });

  it("schrijft niets bij lege effecten", async () => {
    const { tx, calls } = fakeTx();
    const result = await applyCascadeEffects(tx, emptyEffects(), REFS);
    expect(result).toEqual({});
    expect(calls).toHaveLength(0);
  });

  it("vult occurredAt zelf in wanneer refs het niet meegeven", async () => {
    const { tx, calls } = fakeTx();
    const effects: CascadeEffects = {
      ...emptyEffects(),
      postings: [{ party: "CLIENT", account: "KOSTEN", debitCents: 100, creditCents: 0 }],
    };
    const before = Date.now();
    await applyCascadeEffects(tx, effects, { ...REFS, occurredAt: undefined });
    const rows = (
      calls.find((c) => c.table === "administrationEntry")?.args as {
        data: Array<{ occurredAt: Date; ownerUserId: string | null }>;
      }
    ).data;
    const [first] = rows;
    if (!first) throw new Error("geen posting geschreven");
    expect(first.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(first.ownerUserId).toBe("user-klant");
  });
});
