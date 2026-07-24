import { describe, it, expect } from "vitest";
import { groupSubmittedForBulkApproval, BULK_APPROVE_MIN } from "@/lib/prestaties-bulk";
import type { PrestatieOverzicht } from "@/lib/prestaties";

const NOW = Date.UTC(2026, 6, 13, 12, 0, 0);
const STALE_DAYS = 4;

function perf(overrides: Partial<PrestatieOverzicht> = {}): PrestatieOverzicht {
  return {
    id: Math.random().toString(36).slice(2),
    collaborationId: "col-1",
    jobTitle: "Nachtdienst VVT",
    freelancerName: "Sanne",
    type: "HOURS",
    status: "SUBMITTED",
    periodStart: null,
    periodEnd: null,
    hours: 8,
    subtotalCents: 20000,
    hasOrt: false,
    description: "",
    submittedAt: new Date(NOW),
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    disputed: false,
    ...overrides,
  };
}

describe("groupSubmittedForBulkApproval", () => {
  it("groepeert ingediende prestaties per samenwerking en somt de subtotalen", () => {
    const groups = groupSubmittedForBulkApproval(
      [
        perf({ collaborationId: "col-1", subtotalCents: 20000 }),
        perf({ collaborationId: "col-1", subtotalCents: 15000 }),
        perf({ collaborationId: "col-2", subtotalCents: 50000 }),
        perf({ collaborationId: "col-2", subtotalCents: 50000 }),
        perf({ collaborationId: "col-2", subtotalCents: 30000 }),
      ],
      NOW,
      STALE_DAYS,
    );
    expect(groups).toHaveLength(2);
    // Meeste wachtende urenstaten eerst → col-2 (3) vóór col-1 (2).
    expect(groups[0]!.collaborationId).toBe("col-2");
    expect(groups[0]!.count).toBe(3);
    expect(groups[0]!.totalCents).toBe(130000);
    expect(groups[1]!.collaborationId).toBe("col-1");
    expect(groups[1]!.totalCents).toBe(35000);
  });

  it("negeert samenwerkingen met minder dan het minimum ingediende prestaties", () => {
    const groups = groupSubmittedForBulkApproval(
      [
        perf({ collaborationId: "col-solo" }),
        perf({ collaborationId: "col-duo" }),
        perf({ collaborationId: "col-duo" }),
      ],
      NOW,
      STALE_DAYS,
    );
    expect(groups.map((g) => g.collaborationId)).toEqual(["col-duo"]);
    expect(BULK_APPROVE_MIN).toBe(2);
  });

  it("telt alleen SUBMITTED — goedgekeurd/afgekeurd/concept blijven buiten de groep", () => {
    const groups = groupSubmittedForBulkApproval(
      [
        perf({ collaborationId: "col-1", status: "SUBMITTED" }),
        perf({ collaborationId: "col-1", status: "SUBMITTED" }),
        perf({ collaborationId: "col-1", status: "APPROVED" }),
        perf({ collaborationId: "col-1", status: "REJECTED" }),
        perf({ collaborationId: "col-1", status: "DRAFT" }),
      ],
      NOW,
      STALE_DAYS,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]!.count).toBe(2);
  });

  it("prestatie zonder subtotaal telt als 0 in het somtotaal", () => {
    const groups = groupSubmittedForBulkApproval(
      [
        perf({ collaborationId: "col-1", subtotalCents: null }),
        perf({ collaborationId: "col-1", subtotalCents: 12000 }),
      ],
      NOW,
      STALE_DAYS,
    );
    expect(groups[0]!.totalCents).toBe(12000);
  });

  it("zet hasStale zodra één ingediende prestatie de stale-drempel bereikt", () => {
    const staleSubmit = new Date(NOW - STALE_DAYS * 24 * 60 * 60 * 1000);
    const groups = groupSubmittedForBulkApproval(
      [
        perf({ collaborationId: "col-1", submittedAt: new Date(NOW) }),
        perf({ collaborationId: "col-1", submittedAt: staleSubmit }),
      ],
      NOW,
      STALE_DAYS,
    );
    expect(groups[0]!.hasStale).toBe(true);
  });

  it("geeft een lege lijst zonder ingediende prestaties", () => {
    expect(
      groupSubmittedForBulkApproval(
        [perf({ status: "APPROVED" }), perf({ status: "DRAFT" })],
        NOW,
        STALE_DAYS,
      ),
    ).toEqual([]);
  });
});
