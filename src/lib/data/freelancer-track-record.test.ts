// getFreelancerTrackRecord aggregeert de afgeronde samenwerkingen (count) + de som van de
// goedgekeurde HOURS-uren over alle samenwerkingen van één ZZP'er. Server-side waarheid.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { count, findMany } = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: { collaboration: { count, findMany } },
}));

import { getFreelancerTrackRecord } from "./freelancer-track-record";

describe("getFreelancerTrackRecord", () => {
  beforeEach(() => {
    count.mockReset();
    findMany.mockReset();
  });

  it("telt afgeronde samenwerkingen en sommeert de goedgekeurde uren over samenwerkingen heen", async () => {
    count.mockResolvedValue(2);
    findMany.mockResolvedValue([
      { performances: [{ hours: 8 }, { hours: 4.5 }] },
      { performances: [{ hours: 12 }] },
      { performances: [] }, // samenwerking zonder goedgekeurde uren telt als 0
    ]);

    const record = await getFreelancerTrackRecord("profile-1");

    expect(record).toEqual({ completedCollaborations: 2, approvedHours: 24.5 });
    // Alleen COMPLETED telt voor het aantal afgeronde samenwerkingen.
    expect(count).toHaveBeenCalledWith({
      where: { status: "COMPLETED", freelancerId: "profile-1" },
    });
  });

  it("behandelt een ontbrekend uren-veld als 0 (geen NaN)", async () => {
    count.mockResolvedValue(1);
    findMany.mockResolvedValue([{ performances: [{ hours: 6 }, { hours: null }] }]);

    const record = await getFreelancerTrackRecord("profile-2");

    expect(record).toEqual({ completedCollaborations: 1, approvedHours: 6 });
  });

  it("geeft nul-cijfers bij een ZZP'er zonder samenwerkingen", async () => {
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);

    const record = await getFreelancerTrackRecord("profile-3");

    expect(record).toEqual({ completedCollaborations: 0, approvedHours: 0 });
  });
});
