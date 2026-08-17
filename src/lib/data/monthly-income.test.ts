// getRealizedRevenueThisMonthCents somt alleen de facturen van de lopende Amsterdam-maand op de
// factuurdatum. Facturen van vorige maand (die door de ruime query-ondergrens meekomen) tellen niet.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: { invoice: { findMany } },
}));

import { getRealizedRevenueThisMonthCents } from "./monthly-income";

describe("getRealizedRevenueThisMonthCents", () => {
  beforeEach(() => findMany.mockReset());

  it("telt alleen de facturen van de lopende maand (op issuedAt)", async () => {
    const now = new Date("2026-07-15T12:00:00Z");
    findMany.mockResolvedValue([
      { issuedAt: new Date("2026-07-03T09:00:00Z"), totalCents: 121000 }, // deze maand
      { issuedAt: new Date("2026-07-14T09:00:00Z"), totalCents: 60500 }, //  deze maand
      { issuedAt: new Date("2026-06-28T09:00:00Z"), totalCents: 90000 }, //  vorige maand → uit
      { issuedAt: null, totalCents: 5000 }, //                                geen datum → uit
    ]);
    const total = await getRealizedRevenueThisMonthCents("user-1", now);
    expect(total).toBe(181500);
  });

  it("is 0 zonder facturen deze maand", async () => {
    const now = new Date("2026-07-15T12:00:00Z");
    findMany.mockResolvedValue([{ issuedAt: new Date("2026-06-30T09:00:00Z"), totalCents: 90000 }]);
    expect(await getRealizedRevenueThisMonthCents("user-1", now)).toBe(0);
  });

  it("scoopt de query op de eigen ZZP'er en begrenst het aantal", async () => {
    findMany.mockResolvedValue([]);
    await getRealizedRevenueThisMonthCents("user-9", new Date("2026-07-15T12:00:00Z"));
    const arg = findMany.mock.calls[0]![0];
    expect(arg.where.collaboration.freelancer.userId).toBe("user-9");
    expect(arg.take).toBeGreaterThan(0);
  });

  it("dekt zowel cascade- als legacy-facturen (dual-path where — geen legacy-blindheid)", async () => {
    findMany.mockResolvedValue([]);
    await getRealizedRevenueThisMonthCents("user-1", new Date("2026-07-15T12:00:00Z"));
    const arg = findMany.mock.calls[0]![0];
    // Een handmatig aangemaakte legacy-factuur (lifecycleStatus NULL, status SENT) moet meetellen.
    expect(arg.where.OR).toEqual([
      { lifecycleStatus: { in: ["SUBMITTED", "APPROVED", "OVERDUE", "PAID", "PROCESSED"] } },
      { lifecycleStatus: null, status: { in: ["SENT", "OVERDUE", "PAID"] } },
    ]);
  });
});
