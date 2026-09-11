import { beforeEach, describe, expect, it, vi } from "vitest";
import { approvalMark } from "./approval-mark";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: { performance: { findMany } } }));
import { getDienstenForFreelancer } from "./diensten";

const approvedAt = new Date("2026-09-01T12:00:00Z");
function performance(disputedAt: Date | null) {
  return {
    id: "performance-1",
    type: "MILESTONE",
    status: "APPROVED",
    amountCents: 40_000,
    hours: null,
    rateCents: null,
    ortSegments: null,
    invoice: { subtotalCents: 40_000 },
    approvedAt,
    collaboration: {
      id: "collaboration-1",
      disputedAt,
      ortProfile: null,
      ortCustomRates: null,
      job: { title: "Oplevering" },
      company: { name: "Opdrachtgever" },
    },
  };
}

describe("diensten: current dispute state and historical approval", () => {
  beforeEach(() => findMany.mockReset());

  it("loads the server dispute and suppresses the seal without rewriting status, date or amount", async () => {
    findMany.mockResolvedValue([performance(new Date("2026-09-10T12:00:00Z"))]);
    const [row] = await getDienstenForFreelancer("freelancer-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { collaboration: { freelancer: { userId: "freelancer-1" } } },
        include: expect.objectContaining({
          collaboration: { select: expect.objectContaining({ disputedAt: true }) },
        }),
      }),
    );
    expect(row).toMatchObject({
      status: "APPROVED",
      disputed: true,
      approvedAt,
      subtotalCents: 40_000,
    });
    expect(approvalMark(row!.status, { disputed: row!.disputed })).toBeUndefined();
  });

  it("shows the preserved approval again after the server clears the dispute", async () => {
    findMany.mockResolvedValue([performance(null)]);
    const [row] = await getDienstenForFreelancer("freelancer-1");
    expect(row).toMatchObject({ status: "APPROVED", disputed: false, approvedAt });
    expect(approvalMark(row!.status, { disputed: row!.disputed })).toBe("approved");
  });
});
