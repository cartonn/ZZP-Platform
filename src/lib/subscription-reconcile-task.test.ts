// Unit-tests voor runSubscriptionReconcileTask — de webhook-backstop. De apply-helper is gemockt
// (los getest in apply-payment-status.test.ts) zodat deze tests de orchestratie afdekken: no-op bij de
// mock-provider, de juiste query-vorm (stale PENDING mét providerRef), provider-poll + tally, en
// robuustheid tegen een falende provider-/DB-call.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PaymentProvider, PaymentStatus } from "@/lib/billing/provider";

const findManyMock = vi.hoisted(() => vi.fn<(args: unknown) => Promise<unknown[]>>(async () => []));
const applyMock = vi.hoisted(() => vi.fn(async (): Promise<string> => "unchanged"));

vi.mock("@/lib/db", () => ({ prisma: { subscription: { findMany: findManyMock } } }));
vi.mock("@/lib/billing/apply-payment-status", () => ({ applyResolvedPaymentStatus: applyMock }));

import { runSubscriptionReconcileTask, reconcileCutoff } from "@/lib/subscription-reconcile-task";

const NOW = new Date("2026-08-19T03:00:00.000Z");

function fakeProvider(
  name: string,
  paymentStatus: (ref: string) => Promise<PaymentStatus>,
): PaymentProvider {
  return {
    name,
    paymentStatus,
    // Niet gebruikt door de reconcile-taak; stubs voor het interface-contract.
    startCheckout: vi.fn(),
    resolveWebhookRef: vi.fn(),
    checkConnectivity: vi.fn(),
  } as unknown as PaymentProvider;
}

beforeEach(() => {
  findManyMock.mockReset();
  findManyMock.mockResolvedValue([]);
  applyMock.mockReset();
  applyMock.mockResolvedValue("unchanged");
});

describe("reconcileCutoff", () => {
  it("trekt de minuten van now af", () => {
    expect(reconcileCutoff(30, NOW).toISOString()).toBe("2026-08-19T02:30:00.000Z");
  });
});

describe("runSubscriptionReconcileTask", () => {
  it("is een no-op bij de mock-provider (geen query, geen provider-call)", async () => {
    const provider = fakeProvider("noop", async () => "paid");
    const result = await runSubscriptionReconcileTask({ now: NOW, provider });
    expect(result).toEqual({
      scanned: 0,
      activated: 0,
      failed: 0,
      stillPending: 0,
      errored: 0,
    });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("vraagt alleen stale PENDING-rijen mét een providerRef op (juiste query-vorm)", async () => {
    const provider = fakeProvider("stripe", async () => "open");
    await runSubscriptionReconcileTask({ now: NOW, provider });
    const args = findManyMock.mock.calls[0]![0] as {
      where: Record<string, unknown>;
      orderBy: unknown;
      take: number;
    };
    expect(args.where.status).toBe("PENDING");
    expect(args.where.providerRef).toEqual({ not: null });
    // updatedAt-cutoff = now - 30 min (default venster).
    expect((args.where.updatedAt as { lt: Date }).lt.toISOString()).toBe(
      "2026-08-19T02:30:00.000Z",
    );
    expect(args.orderBy).toEqual({ updatedAt: "asc" });
    expect(args.take).toBe(50); // default batch
  });

  it("tilt een betaalde rij naar ACTIVE en telt 'm als activated", async () => {
    findManyMock.mockResolvedValue([
      { id: "s1", userId: "u1", status: "PENDING", providerRef: "pi_1" },
    ]);
    const paymentStatus = vi.fn(async (): Promise<PaymentStatus> => "paid");
    applyMock.mockResolvedValue("activated");
    const provider = fakeProvider("stripe", paymentStatus);

    const result = await runSubscriptionReconcileTask({ now: NOW, provider });

    expect(paymentStatus).toHaveBeenCalledWith("pi_1");
    expect(applyMock).toHaveBeenCalledWith({
      sub: { id: "s1", userId: "u1", status: "PENDING" },
      providerName: "stripe",
      paymentId: "pi_1",
      status: "paid",
      now: NOW,
    });
    expect(result).toMatchObject({ scanned: 1, activated: 1, stillPending: 0, errored: 0 });
  });

  it("laat een 'open'-rij ongemoeid (stillPending)", async () => {
    findManyMock.mockResolvedValue([
      { id: "s1", userId: "u1", status: "PENDING", providerRef: "pi_1" },
    ]);
    applyMock.mockResolvedValue("unchanged");
    const provider = fakeProvider("stripe", async () => "open");
    const result = await runSubscriptionReconcileTask({ now: NOW, provider });
    expect(result).toMatchObject({ scanned: 1, activated: 0, failed: 0, stillPending: 1 });
  });

  it("zet een mislukte betaling op PAST_DUE (failed-tally)", async () => {
    findManyMock.mockResolvedValue([
      { id: "s1", userId: "u1", status: "PENDING", providerRef: "pi_1" },
    ]);
    applyMock.mockResolvedValue("failed");
    const provider = fakeProvider("stripe", async () => "failed");
    const result = await runSubscriptionReconcileTask({ now: NOW, provider });
    expect(result).toMatchObject({ scanned: 1, failed: 1 });
  });

  it("telt een duplicaat (late webhook won de race) als stillPending", async () => {
    findManyMock.mockResolvedValue([
      { id: "s1", userId: "u1", status: "PENDING", providerRef: "pi_1" },
    ]);
    applyMock.mockResolvedValue("duplicate");
    const provider = fakeProvider("stripe", async () => "paid");
    const result = await runSubscriptionReconcileTask({ now: NOW, provider });
    expect(result).toMatchObject({ scanned: 1, activated: 0, stillPending: 1 });
  });

  it("slaat een rij over waarvoor de provider-status niet op te halen is (errored, geen throw)", async () => {
    findManyMock.mockResolvedValue([
      { id: "s1", userId: "u1", status: "PENDING", providerRef: "pi_1" },
      { id: "s2", userId: "u2", status: "PENDING", providerRef: "pi_2" },
    ]);
    const paymentStatus = vi
      .fn<(ref: string) => Promise<PaymentStatus>>()
      .mockRejectedValueOnce(new Error("provider 503"))
      .mockResolvedValueOnce("paid");
    applyMock.mockResolvedValue("activated");
    const provider = fakeProvider("stripe", paymentStatus);

    const result = await runSubscriptionReconcileTask({ now: NOW, provider });

    // Eén rij faalde de poll (errored), de andere werd geactiveerd — de batch draait door.
    expect(result).toMatchObject({ scanned: 2, activated: 1, errored: 1 });
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("telt een transiënte DB-fout in de apply-stap als errored (geen throw)", async () => {
    findManyMock.mockResolvedValue([
      { id: "s1", userId: "u1", status: "PENDING", providerRef: "pi_1" },
    ]);
    applyMock.mockRejectedValue(new Error("db down"));
    const provider = fakeProvider("stripe", async () => "paid");
    const result = await runSubscriptionReconcileTask({ now: NOW, provider });
    expect(result).toMatchObject({ scanned: 1, errored: 1, activated: 0 });
  });
});
