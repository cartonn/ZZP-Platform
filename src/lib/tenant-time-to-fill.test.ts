// Unit-tests voor getTenantTimeToFill — de tenant-brede time-to-fill voor de bemiddelaar.
// Prisma-laag gemockt; verifieert tenant-scoping, de null-paden en de doorlooptijd-afleiding.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Actor } from "@/lib/authz";

const DAY = 24 * 60 * 60 * 1000;
const findMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    job: {
      findMany: (args: unknown) => findMany(args),
    },
  },
}));

import { getTenantTimeToFill } from "@/lib/time-to-fill";

function actor(tenantId: string | null): Actor {
  return { id: "u1", role: "FRANCHISER", tenantId } as Actor;
}

/** Een dienst die `days` dagen na publicatie een eerste plaatsing kreeg. */
function job(days: number, anchorMs = Date.UTC(2026, 0, 1)) {
  return {
    createdAt: new Date(anchorMs - DAY),
    publishedAt: new Date(anchorMs),
    collaborations: [{ createdAt: new Date(anchorMs + days * DAY) }],
  };
}

describe("getTenantTimeToFill", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("geeft null zonder tenant (raakt de DB niet)", async () => {
    expect(await getTenantTimeToFill(actor(null))).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("scoopt de query op de tenant en op vervulde, gepubliceerde/gesloten diensten", async () => {
    findMany.mockResolvedValueOnce([job(4), job(8)]);
    await getTenantTimeToFill(actor("t1"));
    expect(findMany).toHaveBeenCalledTimes(1);
    const where = findMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe("t1");
    expect(where.status).toEqual({ in: ["PUBLISHED", "CLOSED"] });
    expect(where.collaborations).toEqual({ some: { status: { in: ["ACTIVE", "COMPLETED"] } } });
  });

  it("berekent de mediane doorlooptijd over de tenant-diensten", async () => {
    findMany.mockResolvedValueOnce([job(2), job(6), job(10)]);
    const s = await getTenantTimeToFill(actor("t1"));
    expect(s).not.toBeNull();
    expect(s!.medianDays).toBe(6);
    expect(s!.sampleSize).toBe(3);
    expect(s!.fastestDays).toBe(2);
  });

  it("valt terug op createdAt wanneer publishedAt ontbreekt", async () => {
    const anchor = Date.UTC(2026, 0, 1);
    findMany.mockResolvedValueOnce([
      {
        createdAt: new Date(anchor),
        publishedAt: null,
        collaborations: [{ createdAt: new Date(anchor + 3 * DAY) }],
      },
      {
        createdAt: new Date(anchor),
        publishedAt: null,
        collaborations: [{ createdAt: new Date(anchor + 5 * DAY) }],
      },
    ]);
    const s = await getTenantTimeToFill(actor("t1"));
    expect(s!.medianDays).toBe(4); // (3+5)/2
    expect(s!.fastestDays).toBe(3);
  });

  it("geeft null onder de minimale steekproef (één vervulde dienst)", async () => {
    findMany.mockResolvedValueOnce([job(4)]);
    expect(await getTenantTimeToFill(actor("t1"))).toBeNull();
  });

  it("negeert diensten zonder plaatsing", async () => {
    findMany.mockResolvedValueOnce([
      job(2),
      { createdAt: new Date(), publishedAt: new Date(), collaborations: [] },
    ]);
    // Slechts één bruikbare rij over → onder de steekproefdrempel → null.
    expect(await getTenantTimeToFill(actor("t1"))).toBeNull();
  });
});
