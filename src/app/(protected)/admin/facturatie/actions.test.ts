// Unit-tests voor setBillingStatusAction — grensvalidatie van de invoer (DOEL 2 / architectuurregel #2).
// De server-action is direct aanroepbaar (via `.bind` in de UI, maar ook los door elke ADMIN met
// geknutselde args). Een niet-enum `to` of leeg `id` mag geen ongevangen ZodError → generieke 500
// geven, maar een nette weigering, en mag de DB niet raken. Een geldige (id, to) passeert de grens en
// bereikt de factuur-lookup + overgangslogica. Prisma, authz, audit en next-cache gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUniqueMock = vi.hoisted(() =>
  vi.fn(async (): Promise<Record<string, unknown> | null> => null),
);
// Expliciete `_args`-parameter zodat `mock.calls[0]` een niet-lege tuple is (tsc --noEmit anders:
// TS2493 op de argument-index) en we het doorgegeven object kunnen inspecteren.
const updateManyMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<{ count: number }> => ({ count: 1 })),
);
const auditMock = vi.hoisted(() => vi.fn(async (_args: unknown): Promise<void> => {}));

// Mocks voor het CANCELLED-terugzetpad: de fee/abonnementsbijdragen die aan de geannuleerde factuur
// hingen moeten terug naar PENDING (invoiceId losgekoppeld) zodat een volgende facturatie-run ze
// opnieuw oppakt. Zonder dit lekt de fee-omzet permanent weg (geld-integriteit).
const feeUpdateManyMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<{ count: number }> => ({ count: 0 })),
);
const chargeUpdateManyMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<{ count: number }> => ({ count: 0 })),
);
const invoiceUpdateManyInTxMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<{ count: number }> => ({ count: 1 })),
);

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    platformBillingInvoice: { findUnique: findUniqueMock, updateMany: updateManyMock },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        platformBillingInvoice: { updateMany: invoiceUpdateManyInTxMock },
        collaborationFee: { updateMany: feeUpdateManyMock },
        zzpMembershipCharge: { updateMany: chargeUpdateManyMock },
      }),
    ),
  },
}));

import { setBillingStatusAction } from "./actions";

beforeEach(() => {
  findUniqueMock.mockReset();
  findUniqueMock.mockResolvedValue(null);
  updateManyMock.mockClear();
  updateManyMock.mockResolvedValue({ count: 1 });
  auditMock.mockClear();
  feeUpdateManyMock.mockClear();
  feeUpdateManyMock.mockResolvedValue({ count: 0 });
  chargeUpdateManyMock.mockClear();
  chargeUpdateManyMock.mockResolvedValue({ count: 0 });
  invoiceUpdateManyInTxMock.mockClear();
  invoiceUpdateManyInTxMock.mockResolvedValue({ count: 1 });
});

describe("setBillingStatusAction — grensvalidatie", () => {
  it("weigert een doelstatus buiten de enum met een nette fout, zónder de DB te raken", async () => {
    await expect(setBillingStatusAction("inv-1", "HACKED" as "SENT")).rejects.toThrow(
      "Ongeldige invoer.",
    );
    // Cruciaal: de afwijzing gebeurt vóór elke DB-I/O (geen ongevangen ZodError → 500).
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("weigert een leeg id met een nette fout, zónder de DB te raken", async () => {
    await expect(setBillingStatusAction("   ", "SENT")).rejects.toThrow("Ongeldige invoer.");
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("laat een geldige (id, to) door tot de factuur-lookup (hier: niet gevonden)", async () => {
    await expect(setBillingStatusAction("inv-1", "SENT")).rejects.toThrow("Factuur niet gevonden.");
    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("verwerkt een geldige overgang (DRAFT→SENT): update + audit met de gevalideerde waarden", async () => {
    findUniqueMock.mockResolvedValue({ status: "DRAFT" });
    await setBillingStatusAction("inv-42", "SENT");
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    const updateArg = updateManyMock.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string; issuedAt?: Date };
    };
    expect(updateArg.where).toMatchObject({ id: "inv-42", status: "DRAFT" });
    expect(updateArg.data.status).toBe("SENT");
    expect(updateArg.data.issuedAt).toBeInstanceOf(Date);
    expect(auditMock).toHaveBeenCalledTimes(1);
    const auditArg = auditMock.mock.calls[0]![0] as {
      entityId: string;
      metadata: { to: string };
    };
    expect(auditArg.entityId).toBe("inv-42");
    expect(auditArg.metadata.to).toBe("SENT");
  });

  it("CANCELLED geeft de gebundelde fee/abonnementsbijdragen terug aan de facturatie (invoiceId los, status PENDING)", async () => {
    findUniqueMock.mockResolvedValue({ status: "DRAFT" });
    feeUpdateManyMock.mockResolvedValue({ count: 2 });
    chargeUpdateManyMock.mockResolvedValue({ count: 1 });

    await setBillingStatusAction("inv-cancel", "CANCELLED");

    // De factuur wordt binnen de transactie geflipt, achter de concurrency-guard (status === from).
    expect(invoiceUpdateManyInTxMock).toHaveBeenCalledTimes(1);
    const flipArg = invoiceUpdateManyInTxMock.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string };
    };
    expect(flipArg.where).toMatchObject({ id: "inv-cancel", status: "DRAFT" });
    expect(flipArg.data.status).toBe("CANCELLED");

    // Kern van de fix: de fee-regels van DEZE factuur keren terug naar PENDING met een losgekoppelde
    // invoiceId, zodat de volgende billing-run ze opnieuw factureert (geen permanent omzetlek).
    expect(feeUpdateManyMock).toHaveBeenCalledTimes(1);
    const feeArg = feeUpdateManyMock.mock.calls[0]![0] as {
      where: { invoiceId: string; status: string };
      data: { invoiceId: null; status: string };
    };
    expect(feeArg.where).toMatchObject({ invoiceId: "inv-cancel", status: "INVOICED" });
    expect(feeArg.data).toMatchObject({ invoiceId: null, status: "PENDING" });

    expect(chargeUpdateManyMock).toHaveBeenCalledTimes(1);
    const chargeArg = chargeUpdateManyMock.mock.calls[0]![0] as {
      where: { invoiceId: string; status: string };
      data: { invoiceId: null; status: string };
    };
    expect(chargeArg.where).toMatchObject({ invoiceId: "inv-cancel", status: "INVOICED" });
    expect(chargeArg.data).toMatchObject({ invoiceId: null, status: "PENDING" });

    // De niet-transactionele updateMany (SENT/PAID-pad) mag hier NIET gebruikt zijn.
    expect(updateManyMock).not.toHaveBeenCalled();

    const auditArg = auditMock.mock.calls[0]![0] as {
      metadata: { to: string; releasedFees: number; releasedCharges: number };
    };
    expect(auditArg.metadata).toMatchObject({
      to: "CANCELLED",
      releasedFees: 2,
      releasedCharges: 1,
    });
  });

  it("CANCELLED die de concurrency-race verliest (factuur al gewijzigd) raakt de fee-regels niet", async () => {
    findUniqueMock.mockResolvedValue({ status: "DRAFT" });
    invoiceUpdateManyInTxMock.mockResolvedValue({ count: 0 }); // iemand anders was eerder

    await expect(setBillingStatusAction("inv-cancel", "CANCELLED")).rejects.toThrow(
      "Deze factuur is intussen al bijgewerkt.",
    );
    // Cruciaal: geen terugzet van fees/charges als de flip niet won → geen dubbele/onterechte release.
    expect(feeUpdateManyMock).not.toHaveBeenCalled();
    expect(chargeUpdateManyMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });
});
