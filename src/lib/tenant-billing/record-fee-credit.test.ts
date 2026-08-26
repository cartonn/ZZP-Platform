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

// Per-test bestuurbare mocks.
const aggregateMock = vi.fn(async () => ({ _sum: { subtotalCents: 0 } }));
const feeFindUniqueMock = vi.fn<() => Promise<{ status: string } | null>>(async () => null);
const upsertMock = vi.fn(async () => undefined);
const deleteMock = vi.fn(async () => undefined);
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
      upsert: () => upsertMock(),
      delete: () => deleteMock(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({ audit: (entry: { action: string }) => auditMock(entry) }));

beforeEach(() => {
  aggregateMock.mockClear();
  feeFindUniqueMock.mockClear();
  upsertMock.mockClear();
  deleteMock.mockClear();
  auditMock.mockClear();
});

describe("recordTenantFeeForCollaboration — creditnota-reconciliatie", () => {
  it("trekt een openstaande (PENDING) fee in als de betaalde grondslag naar 0 zakt", async () => {
    // Alle facturen gecrediteerd → grondslag 0; er staat nog een PENDING fee open.
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "PENDING" });

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).not.toHaveBeenCalled();
    // Auditspoor voor de intrekking.
    const auditArg = auditMock.mock.calls[0]![0];
    expect(auditArg.action).toBe("TENANT_FEE_REVERSED");
  });

  it("laat een al gefactureerde (bevroren) fee met rust bij grondslag 0", async () => {
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "INVOICED" });

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("herberekent (upsert) de fee naar beneden bij een deel-creditnota (grondslag > 0)", async () => {
    // Eén van twee facturen gecrediteerd → grondslag nog € 100.
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 10_000 } });
    feeFindUniqueMock.mockResolvedValueOnce({ status: "PENDING" });

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("doet niets als er geen fee stond en de grondslag 0 is (geen lege intrekking)", async () => {
    aggregateMock.mockResolvedValueOnce({ _sum: { subtotalCents: 0 } });
    feeFindUniqueMock.mockResolvedValueOnce(null);

    const { recordTenantFeeForCollaboration } = await import("@/lib/tenant-billing/record-fee");
    await recordTenantFeeForCollaboration("col-1");

    expect(deleteMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });
});
