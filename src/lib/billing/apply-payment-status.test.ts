// Unit-tests voor applyResolvedPaymentStatus — de gedeelde bron van waarheid voor het toepassen van
// een gezaghebbend opgehaalde betaalstatus (webhook + reconcile-cron). Prisma-laag gemockt; de
// overgangsmap + idempotentie-helpers draaien echt (pure, ongemockt).

import { describe, it, expect, vi, beforeEach } from "vitest";

const ledgerCreateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
const updateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
const auditCreateMock = vi.hoisted(() =>
  vi.fn(async (_args: unknown): Promise<Record<string, unknown>> => ({})),
);
const transactionMock = vi.hoisted(() =>
  vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      processedWebhookEvent: { create: ledgerCreateMock },
      subscription: { update: updateMock },
      auditLog: { create: auditCreateMock },
    }),
  ),
);

vi.mock("@/lib/audit", () => ({ auditData: (entry: unknown) => entry }));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: transactionMock } }));

import { applyResolvedPaymentStatus } from "@/lib/billing/apply-payment-status";

const NOW = new Date("2026-08-19T03:00:00.000Z");

function ctx(status: "paid" | "open" | "failed", subStatus: string) {
  return {
    sub: { id: "sub1", userId: "u1", status: subStatus },
    providerName: "stripe",
    paymentId: "pi_123",
    status,
    now: NOW,
  } as const;
}

beforeEach(() => {
  ledgerCreateMock.mockReset();
  ledgerCreateMock.mockResolvedValue({});
  updateMock.mockReset();
  updateMock.mockResolvedValue({});
  auditCreateMock.mockReset();
  auditCreateMock.mockResolvedValue({});
  transactionMock.mockClear();
});

describe("applyResolvedPaymentStatus", () => {
  it("tilt een PENDING-abonnement bij 'paid' naar ACTIVE (+ periode + audit)", async () => {
    const out = await applyResolvedPaymentStatus(ctx("paid", "PENDING"));
    expect(out).toBe("activated");
    expect(ledgerCreateMock).toHaveBeenCalledWith({
      data: { provider: "stripe", eventKey: "pi_123:paid" },
    });
    const data = updateMock.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.data.status).toBe("ACTIVE");
    expect(data.data.pastDueAt).toBeNull();
    // Periode = now + 1 maand.
    expect((data.data.currentPeriodEnd as Date).toISOString()).toBe("2026-09-19T03:00:00.000Z");
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it("heractiveert ook een PAST_DUE-abonnement bij 'paid' (geldige overgang)", async () => {
    const out = await applyResolvedPaymentStatus(ctx("paid", "PAST_DUE"));
    expect(out).toBe("activated");
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("zet een PENDING-abonnement bij 'failed' op PAST_DUE (+ audit)", async () => {
    const out = await applyResolvedPaymentStatus(ctx("failed", "PENDING"));
    expect(out).toBe("failed");
    const data = updateMock.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(data.data.status).toBe("PAST_DUE");
    expect(data.data.pastDueAt).toEqual(NOW);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it("doet niets bij 'open' (geen overgang) — schrijft alleen de ledger-rij", async () => {
    const out = await applyResolvedPaymentStatus(ctx("open", "PENDING"));
    expect(out).toBe("unchanged");
    expect(updateMock).not.toHaveBeenCalled();
    expect(ledgerCreateMock).toHaveBeenCalledTimes(1);
  });

  it("laat een al-ACTIVE abonnement bij 'paid' ongemoeid (geen dubbele periode)", async () => {
    const out = await applyResolvedPaymentStatus(ctx("paid", "ACTIVE"));
    expect(out).toBe("unchanged");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("heractiveert een CANCELLED abonnement NIET bij een late 'paid' (overgang uit de map verwijderd)", async () => {
    const out = await applyResolvedPaymentStatus(ctx("paid", "CANCELLED"));
    expect(out).toBe("unchanged");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("meldt een reeds verwerkt event als 'duplicate' (P2002 op de ledger) — geen mutatie", async () => {
    ledgerCreateMock.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    const out = await applyResolvedPaymentStatus(ctx("paid", "PENDING"));
    expect(out).toBe("duplicate");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("laat een niet-P2002 DB-fout propageren (aanroeper mag opnieuw proberen)", async () => {
    ledgerCreateMock.mockRejectedValue(Object.assign(new Error("db down"), { code: "P1001" }));
    await expect(applyResolvedPaymentStatus(ctx("paid", "PENDING"))).rejects.toThrow("db down");
  });
});
