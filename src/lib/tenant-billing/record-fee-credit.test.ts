// Tenant-fee volgt een creditnota (persona-sweep 2026-08-26).
//
// Defect (should-fix, geld-integriteit — CLAUDE.md regel 1 & 2, server-side waarheid): de transactie-fee
// per samenwerking wordt bij betaling (`confirmPayment`) eenmalig geboekt uit een punt-in-tijd-momentopname
// van de betaalde omzet. Crediteert de ZZP'er die factuur daarna (`creditInvoice` → `INVOICE_CREDITED`,
// lifecycle PAID/PROCESSED → CREDITED), dan draaide de cascade wél het grootboek terug, maar niets raakte
// de `CollaborationFee`. Bij een enkele-factuur-samenwerking (zeer gangbaar) triggert geen latere betaling
// een herberekening → de PENDING-fee bleef op de oude, teruggedraaide grondslag staan en de billing-run
// factureerde die alsnog aan de franchise-tenant (fee over omzet die niet meer bestaat).
//
// Fix: `creditInvoice` roept `recordTenantFeeForCollaboration` (best-effort) aan; de recorder herberekent
// de grondslag over PAID_REVENUE_LIFECYCLE en trekt een nog-openstaande (PENDING) fee in zodra er geen
// betaalde grondslag meer over is. Deze test is rood zonder de reconcile-tak (fee bleef bestaan).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TENANT_BILLING } from "@/lib/config";

// Per-test bestuurbare mocks. De schrijfacties zijn status-gepoort: `deleteMany`/`updateMany` met
// `status: "PENDING"` in de where-clause (atomair t.o.v. een gelijktijdige billing-run), `create` als
// terugval wanneer er nog geen rij staat. De `...Count`-mocks laten een test de gematchte-rij-telling
// sturen (0 = niets geraakt: geen rij, óf net naar INVOICED geflipt door een billing-run).
const aggregateMock = vi.fn(async () => ({ _sum: { subtotalCents: 0 } }));
const feeFindUniqueMock = vi.fn<() => Promise<{ status: string } | null>>(async () => null);
const updateManyCount = { value: 1 };
const deleteManyCount = { value: 1 };
const updateManyMock = vi.fn(async () => ({ count: updateManyCount.value }));
const deleteManyMock = vi.fn(async () => ({ count: deleteManyCount.value }));
const createMock = vi.fn(async () => undefined);
const auditMock = vi.fn<(entry: { action: string }) => Promise<void>>(async () => undefined);

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      findUnique: vi.fn(async () => ({ id: "col-1", job: { tenantId: "tenant-1" } })),
    },
    invoice: {
      aggregate: () => aggregateMock(),
    },
    tenantSubscription: {
      findUnique: vi.fn(async () => ({ planKey: TENANT_BILLING.defaultPlanKey })),
    },
    collaborationFee: {
      findUnique: () => feeFindUniqueMock(),
      updateMany: () => updateManyMock(),
      deleteMany: () => deleteManyMock(),
      create: () => createMock(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({ audit: (entry: { action: string }) => auditMock(entry) }));

beforeEach(() => {
  aggregateMock.mockClear();
  feeFindUniqueMock.mockClear();
  updateManyMock.mockClear();
  deleteManyMock.mockClear();
  createMock.mockClear();
  auditMock.mockClear();
  updateManyCount.value = 1;
  deleteManyCount.value = 1;
});

describe("recordTenantFeeForCollaboration — creditnota-reconciliatie", () => {
  it("trekt een openstaande (PENDING) fee in als de betaalde grondslag naar 0 zakt", async () => {
    // Alle facturen gecrediteerd → grondslag 0; er staat nog een PENDING fee open.
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "PENDING" });

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    expect(updateManyMock).not.toHaveBeenCalled();
    // Auditspoor voor de intrekking.
    const auditArg = auditMock.mock.calls[0]![0];
    expect(auditArg.action).toBe("TENANT_FEE_REVERSED");
  });

  it("laat een al gefactureerde (bevroren) fee met rust bij grondslag 0", async () => {
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "INVOICED" });

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("herberekent (updateMany) de fee naar beneden bij een deel-creditnota (grondslag > 0)", async () => {
    // Eén van twee facturen gecrediteerd → grondslag nog € 100.
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 10_000 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "PENDING" });

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled(); // bestaande PENDING-rij geraakt → geen create-terugval
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("doet niets als er geen fee stond en de grondslag 0 is (geen lege intrekking)", async () => {
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce(null);

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  // TOCTOU-grendel (persona-sweep 2026-08-28): een billing-run kan de fee tussen de status-lezing en de
  // schrijfactie naar INVOICED flippen. De status-gepoorte `deleteMany`/`updateMany` (where `status:
  // "PENDING"`) matcht dan 0 rijen → de nu-gefactureerde fee (die een live platformfactuur dekt) mag
  // NIET gewist of overschreven worden. Deze tests zijn rood met de oude ongepoortte `delete`/`upsert`.
  it("wist een fee NIET als een billing-run 'm net naar INVOICED flipte (grondslag 0, deleteMany count 0)", async () => {
    // Lezing zag nog PENDING, maar de gepoorte deleteMany matcht 0 rijen (billing-run won de race).
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "PENDING" });
    deleteManyCount.value = 0;

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    // Geen echte intrekking → geen misleidend TENANT_FEE_REVERSED-auditspoor voor een fee die er nog staat.
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("overschrijft een fee NIET als een billing-run 'm net naar INVOICED flipte (grondslag > 0, updateMany count 0, create botst op unique)", async () => {
    // Lezing zag PENDING; de gepoorte updateMany matcht 0 rijen (net naar INVOICED). De create-terugval
    // botst dan op de unieke collaborationId (de bevroren rij bestaat al) → P2002 → stille no-op.
    const { Prisma } = await import("@prisma/client");
    const p2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
    });
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 10_000 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "PENDING" });
    updateManyCount.value = 0;
    createMock.mockRejectedValueOnce(p2002);

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    // Geen throw naar buiten: de botsing is een gewenste no-op (bevroren fee met rust gelaten).
    await expect(recordTenantFeeForCollaboration("col-1")).resolves.toBeUndefined();

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    // Niets echt geschreven → geen TENANT_FEE_RECORDED-auditspoor.
    expect(auditMock).not.toHaveBeenCalled();
  });
});
