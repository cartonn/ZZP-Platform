import { beforeEach, describe, expect, it, vi } from "vitest";

// De reconciliatietaak levert het BEWIJS dat de invalidatie klopt: hij leest de verse events, leegt
// de snapshots van de betrokken partijen, en rekent daarna een steekproef opnieuw door. Wat hier
// vastligt: welke partijen als betrokken gelden (beide + de bemiddelaar van de tenant, en bij een
// certificaat ook de admin-wachtrij) en dat een afwijking als drift wordt geteld — niet stil hersteld.

type Row = Record<string, unknown>;

const domainEventFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));
const invoiceFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));
const performanceFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));
const collaborationFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));
const credentialFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));
const userFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));
const snapshotFindMany = vi.fn((_a: unknown): Promise<Row[]> => Promise.resolve([]));

vi.mock("@/lib/db", () => ({
  prisma: {
    domainEvent: { findMany: (a: unknown) => domainEventFindMany(a) },
    invoice: { findMany: (a: unknown) => invoiceFindMany(a) },
    performance: { findMany: (a: unknown) => performanceFindMany(a) },
    collaboration: { findMany: (a: unknown) => collaborationFindMany(a) },
    credential: { findMany: (a: unknown) => credentialFindMany(a) },
    user: { findMany: (a: unknown) => userFindMany(a) },
    userSignalSnapshot: { findMany: (a: unknown) => snapshotFindMany(a) },
  },
}));

const invalidateSignals = vi.fn((_ids: readonly unknown[]): Promise<void> => Promise.resolve());
vi.mock("@/lib/signals/invalidate", () => ({
  invalidateSignals: (ids: readonly unknown[]) => invalidateSignals(ids),
}));

const recomputeSignalSnapshot = vi.fn(
  (
    _userId: string,
    _role: string,
    _now: Date,
  ): Promise<{
    badges: Record<string, { count: number; tone: "attention" | "info" }>;
    pendingTaskCount: number;
    unreadNotifications: number;
  }> => Promise.resolve({ badges: {}, pendingTaskCount: 0, unreadNotifications: 0 }),
);
vi.mock("@/lib/signals/snapshot", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/signals/snapshot")>("@/lib/signals/snapshot");
  return {
    ...actual,
    recomputeSignalSnapshot: (u: string, r: string, n: Date) => recomputeSignalSnapshot(u, r, n),
  };
});

import { runSignalSnapshotReconcileTask } from "./signal-snapshot-reconcile-task";

const NOW = new Date("2026-09-04T12:00:00.000Z");

beforeEach(() => {
  for (const fn of [
    domainEventFindMany,
    invoiceFindMany,
    performanceFindMany,
    collaborationFindMany,
    credentialFindMany,
    userFindMany,
    snapshotFindMany,
  ]) {
    fn.mockClear();
    fn.mockResolvedValue([]);
  }
  invalidateSignals.mockClear();
  recomputeSignalSnapshot.mockClear();
  recomputeSignalSnapshot.mockResolvedValue({
    badges: {},
    pendingTaskCount: 0,
    unreadNotifications: 0,
  });
});

describe("runSignalSnapshotReconcileTask — invalidatie-sweep", () => {
  it("doet niets zonder verse events", async () => {
    const result = await runSignalSnapshotReconcileTask({ now: NOW });
    expect(collaborationFindMany).not.toHaveBeenCalled();
    expect(invalidateSignals).not.toHaveBeenCalled();
    expect(result).toEqual({ invalidated: 0, unmappedEvents: 0, reconciled: 0, drifted: 0 });
  });

  it("invalideert beide partijen én de bemiddelaar van de tenant bij een cascade-event", async () => {
    domainEventFindMany.mockResolvedValue([{ type: "CONTRACT_SIGNED", subjectId: "col1" }]);
    collaborationFindMany.mockResolvedValue([
      {
        freelancer: { userId: "zzp1", tenant: { ownerUserId: "bemiddelaar1" } },
        company: { userId: "klant1", tenant: { ownerUserId: "bemiddelaar1" } },
      },
    ]);
    const result = await runSignalSnapshotReconcileTask({ now: NOW });
    expect(invalidateSignals).toHaveBeenCalledTimes(1);
    expect([...(invalidateSignals.mock.calls[0]?.[0] ?? [])].sort()).toEqual([
      "bemiddelaar1",
      "klant1",
      "zzp1",
    ]);
    expect(result.invalidated).toBe(3);
  });

  it("volgt een factuur-event naar de samenwerking van die factuur", async () => {
    domainEventFindMany.mockResolvedValue([{ type: "PAYMENT_CONFIRMED", subjectId: "inv1" }]);
    invoiceFindMany.mockResolvedValue([
      { issuerUserId: "zzp1", counterpartyUserId: "klant1", collaborationId: "col1" },
    ]);
    collaborationFindMany.mockResolvedValue([
      {
        freelancer: { userId: "zzp1", tenant: null },
        company: { userId: "klant1", tenant: { ownerUserId: "bemiddelaar1" } },
      },
    ]);
    await runSignalSnapshotReconcileTask({ now: NOW });
    const ids = [...(invalidateSignals.mock.calls[0]?.[0] ?? [])].sort();
    expect(ids).toEqual(["bemiddelaar1", "klant1", "zzp1"]);
  });

  it("neemt bij een certificaat-event de admins mee (de verificatie-wachtrij beweegt mee)", async () => {
    domainEventFindMany.mockResolvedValue([{ type: "CREDENTIAL_VERIFIED", subjectId: "cred1" }]);
    credentialFindMany.mockResolvedValue([{ freelancerProfile: { userId: "zzp1", tenant: null } }]);
    userFindMany.mockResolvedValue([{ id: "admin1" }]);
    await runSignalSnapshotReconcileTask({ now: NOW });
    expect([...(invalidateSignals.mock.calls[0]?.[0] ?? [])].sort()).toEqual(["admin1", "zzp1"]);
  });

  it("telt onbekende event-types als unmapped (die leunen op de TTL)", async () => {
    domainEventFindMany.mockResolvedValue([{ type: "NOG_NIET_GEKEND", subjectId: "x" }]);
    const result = await runSignalSnapshotReconcileTask({ now: NOW });
    expect(result.unmappedEvents).toBe(1);
    expect(invalidateSignals).not.toHaveBeenCalled();
  });
});

describe("runSignalSnapshotReconcileTask — drift-meting", () => {
  const stored = {
    userId: "u1",
    role: "FREELANCER",
    pendingTaskCount: 3,
    unreadNotifications: 1,
    badges: [{ href: "/certificaten", count: 2, tone: "attention" }],
  };

  it("telt geen drift als de herberekening hetzelfde oplevert", async () => {
    snapshotFindMany.mockResolvedValue([stored]);
    recomputeSignalSnapshot.mockResolvedValue({
      badges: { "/certificaten": { count: 2, tone: "attention" } },
      pendingTaskCount: 3,
      unreadNotifications: 1,
    });
    const result = await runSignalSnapshotReconcileTask({ now: NOW });
    expect(result.reconciled).toBe(1);
    expect(result.drifted).toBe(0);
  });

  it("telt drift zodra de bewaarde stand afwijkt van de berekening", async () => {
    snapshotFindMany.mockResolvedValue([stored]);
    recomputeSignalSnapshot.mockResolvedValue({
      badges: { "/certificaten": { count: 5, tone: "attention" } },
      pendingTaskCount: 3,
      unreadNotifications: 1,
    });
    const result = await runSignalSnapshotReconcileTask({ now: NOW });
    expect(result.drifted).toBe(1);
    expect(recomputeSignalSnapshot).toHaveBeenCalledWith("u1", "FREELANCER", NOW);
  });

  it("kijkt alleen naar nog-verse snapshots (een verlopen rij bewijst niets)", async () => {
    await runSignalSnapshotReconcileTask({ now: NOW });
    const args = snapshotFindMany.mock.calls[0]?.[0] as { where: { staleAfter: { gt: Date } } };
    expect(args.where.staleAfter.gt).toEqual(NOW);
  });
});
