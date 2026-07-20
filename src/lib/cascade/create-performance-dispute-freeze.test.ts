// Dispuut-vries op createPerformance (defense-in-depth / consistentie). Elke andere prestatie-command
// (update/submit/approve/autoApprove/reject) roept al `assertNotDisputed` aan; createPerformance was de
// enige die dat NIET deed — een open dispuut bevriest de cascade, maar een ZZP'er kon toch nog een nieuwe
// concept-prestatie vastleggen op een bevroren deal. Deze test bewijst dat de vries nu ook hier bedraad is
// (rood zonder de `assertNotDisputed`-wiring in createPerformance) én dat het gelukkige pad blijft werken.

import { describe, it, expect, vi, beforeEach } from "vitest";

let collabStatus = "ACTIVE";
let collabDisputedAt: Date | null = null;

const createMock = vi.fn().mockResolvedValue({ id: "perf-new" });

vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: {
      // createPerformance leest de samenwerking met freelancer/company (ownership) + status; de
      // dispuut-vries leest daarna disputedAt via `assertNotDisputed`. Eén mock voedt beide.
      findUnique: vi.fn().mockImplementation(async () => ({
        id: "col-1",
        status: collabStatus,
        disputedAt: collabDisputedAt,
        freelancer: { userId: "f1" },
        company: { userId: "c1" },
      })),
    },
    performance: { create: createMock },
  },
}));

const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

const input = {
  collaborationId: "col-1",
  type: "HOURS" as const,
  hours: 8,
  rateCents: 5000,
};

beforeEach(() => {
  collabStatus = "ACTIVE";
  collabDisputedAt = null;
  createMock.mockClear();
});

describe("createPerformance — dispuut-vries", () => {
  it("weigert een nieuwe concept-prestatie op een samenwerking met open dispuut", async () => {
    collabDisputedAt = new Date("2026-07-01T00:00:00Z");
    const { createPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(createPerformance(FREELANCER, input)).rejects.toThrow(/dispuut/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("staat vastleggen toe op een actieve samenwerking zonder dispuut", async () => {
    const { createPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(createPerformance(FREELANCER, input)).resolves.toBe("perf-new");
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
