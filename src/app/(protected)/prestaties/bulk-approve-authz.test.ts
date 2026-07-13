// Bulk-goedkeuren van ingediende urenstaten: de opdrachtgever keurt in één klik alle SUBMITTED-
// prestaties van één samenwerking goed. Deze test borgt (1) de rol-poort (alleen CLIENT/ADMIN),
// (2) de eigenaar-scoping op de prestatie-query (`collaboration.company.userId`), (3) dat elke
// prestatie door dezelfde `approvePerformance`-cascade loopt, en (4) dat één falende prestatie de
// rest niet meesleept (per-item afhandeling → gedeeltelijke succes-telling).

import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const approvePerformance = vi.hoisted(() => vi.fn(async () => {}));
const requireActor = vi.hoisted(() => vi.fn());

vi.mock("@/lib/authz", () => ({ requireActor }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { performance: { findMany } } }));
vi.mock("@/lib/cascade/commands", () => {
  class CascadeError extends Error {}
  return { CascadeError, approvePerformance };
});

import { approveSubmittedPerformancesAction } from "./actions";

beforeEach(() => {
  findMany.mockReset();
  approvePerformance.mockReset();
  approvePerformance.mockResolvedValue(undefined);
  requireActor.mockReset();
  requireActor.mockResolvedValue({ id: "client-1", role: "CLIENT", status: "ACTIVE" });
});

describe("approveSubmittedPerformancesAction", () => {
  it("weigert een ZZP'er (rol-poort) en raakt de DB niet aan", async () => {
    requireActor.mockResolvedValue({ id: "zzp-1", role: "FREELANCER", status: "ACTIVE" });

    const result = await approveSubmittedPerformancesAction("col-1");

    expect(result.error).toMatch(/opdrachtgever/i);
    expect(result.approved).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
    expect(approvePerformance).not.toHaveBeenCalled();
  });

  it("scoopt de query op de eigen samenwerking en keurt elke ingediende prestatie goed", async () => {
    findMany.mockResolvedValue([{ id: "perf-a" }, { id: "perf-b" }, { id: "perf-c" }]);

    const result = await approveSubmittedPerformancesAction("col-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          collaborationId: "col-1",
          status: "SUBMITTED",
          collaboration: { company: { userId: "client-1" } },
        }),
      }),
    );
    expect(approvePerformance).toHaveBeenCalledTimes(3);
    expect(approvePerformance).toHaveBeenCalledWith(
      expect.objectContaining({ id: "client-1" }),
      "perf-a",
    );
    expect(result).toEqual({ approved: 3, failed: 0, error: undefined });
  });

  it("telt een falende prestatie apart en verwerkt de rest gewoon", async () => {
    findMany.mockResolvedValue([{ id: "perf-a" }, { id: "perf-b" }]);
    approvePerformance
      .mockRejectedValueOnce(new Error("Samenwerking is in dispuut."))
      .mockResolvedValueOnce(undefined);

    const result = await approveSubmittedPerformancesAction("col-1");

    expect(result.approved).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.error).toMatch(/dispuut/i);
  });

  it("is een nette no-op zonder ingediende prestaties", async () => {
    findMany.mockResolvedValue([]);

    const result = await approveSubmittedPerformancesAction("col-1");

    expect(result).toEqual({ approved: 0, failed: 0 });
    expect(approvePerformance).not.toHaveBeenCalled();
  });
});
