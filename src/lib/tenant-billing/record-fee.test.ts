// Tenant-fee grondslag telt PAID én PROCESSED (persona-sweep 2026-08-25, run 93).
//
// Defect (should-fix, geld-integriteit — CLAUDE.md regel 1 & 2, server-side waarheid): de transactie-fee
// per samenwerking (`recordTenantFeeForCollaboration`) berekende de grondslag over `lifecycleStatus:
// "PAID"` alléén. Een betaalde cascadefactuur beweegt na administratieve verwerking door naar
// `PROCESSED` (lifecycle-map `lifecycles.ts`: PAID → PROCESSED) en de cutover-migratie
// (`scripts/migrate-legacy-invoices.mjs`) zet legacy-PAID → PROCESSED. Elke andere "betaalde omzet"-
// teller telt PAID + PROCESSED (canoniek `PAID_REVENUE_LIFECYCLE`); alleen deze teller was de uitzondering.
// Gevolg: op een tenant-samenwerking met één (of meer) PROCESSED-facturen viel die waarde stil uit de
// fee-grondslag → structurele ONDERfacturatie. Omdat de fee bij facturatie bevriest (status != PENDING),
// corrigeert dat zich daarna nooit meer → permanent omzetlek voor de franchise.
//
// Fix: grondslag over `lifecycleStatus in PAID_REVENUE_LIFECYCLE` (= ["PAID","PROCESSED"]).
// Deze test is rood zonder de fix (de aggregate-where telt dan alleen PAID → te lage fee).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TENANT_BILLING } from "@/lib/config";
import { planCollaborationFeeRecord } from "@/lib/tenant-billing/collaboration-fee";

// Vaste factuurset op dezelfde samenwerking: één PAID (€ 100 excl.), één PROCESSED (€ 200 excl.).
const INVOICES = [
  { lifecycleStatus: "PAID", subtotalCents: 10_000 },
  { lifecycleStatus: "PROCESSED", subtotalCents: 20_000 },
  { lifecycleStatus: "CREDITED", subtotalCents: 5_000 }, // teruggedraaid → telt NOOIT mee
  { lifecycleStatus: "SUBMITTED", subtotalCents: 9_999 }, // nog niet betaald → telt niet mee
];

// Aggregate-mock die de doorgegeven `where.lifecycleStatus` daadwerkelijk honoreert, zodat de test het
// gedrag test en niet de implementatie: accepteert zowel een string ("PAID", de oude bug) als `{ in: [] }`.
const aggregateMock = vi.fn(async (args: { where: { lifecycleStatus: unknown } }) => {
  const ls = args.where.lifecycleStatus as string | { in: string[] };
  const allowed = typeof ls === "string" ? [ls] : ls.in;
  const sum = INVOICES.filter((i) => allowed.includes(i.lifecycleStatus)).reduce(
    (acc, i) => acc + i.subtotalCents,
    0,
  );
  return { _sum: { subtotalCents: sum } };
});

type UpsertArg = { create: { feeCents: number; vatCents: number } };
const upsertMock = vi.fn((_args: UpsertArg): Promise<void> => Promise.resolve());

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn(async () => ({ id: "col-1", job: { tenantId: "tenant-1" } })),
    },
    invoice: {
      aggregate: (args: { where: { lifecycleStatus: unknown } }) => aggregateMock(args),
    },
    tenantSubscription: {
      findUnique: vi.fn(async () => ({ planKey: TENANT_BILLING.defaultPlanKey })),
    },
    collaborationFee: {
      findUnique: vi.fn(async () => null),
      upsert: (args: unknown) => upsertMock(args as UpsertArg),
    },
  },
}));

vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => undefined) }));

beforeEach(() => {
  aggregateMock.mockClear();
  upsertMock.mockClear();
});

describe("recordTenantFeeForCollaboration — grondslag", () => {
  it("telt PAID én PROCESSED (niet alleen PAID) mee in de fee-grondslag", async () => {
    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    // De aggregate-where moet beide betaalde statussen bevatten.
    const call = aggregateMock.mock.calls[0]![0];
    const ls = call.where.lifecycleStatus as { in: string[] };
    expect(ls.in).toContain("PAID");
    expect(ls.in).toContain("PROCESSED");
    expect(ls.in).not.toContain("CREDITED");

    // De fee wordt berekend over € 300 (100 PAID + 200 PROCESSED), niet over € 100.
    const expected = planCollaborationFeeRecord({
      collaborationId: "col-1",
      tenantId: "tenant-1",
      valueCents: 30_000,
      planKey: TENANT_BILLING.defaultPlanKey,
    });
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const upsertArg = upsertMock.mock.calls[0]![0];
    // Regressie-anker: met de oude "PAID"-only grondslag zou de grondslag € 100 zijn → lagere fee.
    if (expected) {
      expect(upsertArg.create.feeCents).toBe(expected.feeCents);
      expect(upsertArg.create.vatCents).toBe(expected.vatCents);
    }
  });
});
