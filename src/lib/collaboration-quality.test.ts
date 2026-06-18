// Unit tests voor collaboration-quality.ts — pure helpers, geen DB.

import { describe, it, expect } from "vitest";
import {
  approvalDays,
  deliveryTone,
  computeDeliveryQuality,
  computeDeliveryQualityByProfile,
  DELIVERY_MIN_SAMPLE,
  type ApprovedPerfRow,
  type ProfilePerfRow,
} from "./collaboration-quality";

// ---------------------------------------------------------------------------
// approvalDays
// ---------------------------------------------------------------------------

describe("approvalDays", () => {
  it("returns null when submittedAt is null", () => {
    expect(approvalDays(null, new Date("2024-01-02"))).toBeNull();
  });

  it("returns null when approvedAt is null", () => {
    expect(approvalDays(new Date("2024-01-01"), null)).toBeNull();
  });

  it("returns null when both dates are null", () => {
    expect(approvalDays(null, null)).toBeNull();
  });

  it("returns null when approvedAt is before submittedAt", () => {
    expect(approvalDays(new Date("2024-01-05"), new Date("2024-01-01"))).toBeNull();
  });

  it("returns 0 when approvedAt equals submittedAt", () => {
    const d = new Date("2024-01-01T12:00:00Z");
    expect(approvalDays(d, d)).toBe(0);
  });

  it("returns 1 for exactly one day apart", () => {
    expect(approvalDays(new Date("2024-01-01T00:00:00Z"), new Date("2024-01-02T00:00:00Z"))).toBe(
      1,
    );
  });

  it("returns 1.5 for 36 hours apart", () => {
    expect(approvalDays(new Date("2024-01-01T00:00:00Z"), new Date("2024-01-02T12:00:00Z"))).toBe(
      1.5,
    );
  });

  it("returns 3.3 for 3 days 8 hours (rounded to 1 decimal)", () => {
    // 3 days 8 hours = 3.333... → rounds to 3.3
    expect(approvalDays(new Date("2024-01-01T00:00:00Z"), new Date("2024-01-04T08:00:00Z"))).toBe(
      3.3,
    );
  });
});

// ---------------------------------------------------------------------------
// deliveryTone
// ---------------------------------------------------------------------------

describe("deliveryTone", () => {
  it("returns INSUFFICIENT when approvedPerformances < DELIVERY_MIN_SAMPLE", () => {
    expect(deliveryTone(0, 100)).toBe("INSUFFICIENT");
    expect(deliveryTone(DELIVERY_MIN_SAMPLE - 1, 100)).toBe("INSUFFICIENT");
  });

  it("returns INSUFFICIENT at exactly 0 approved performances", () => {
    expect(deliveryTone(0, 0)).toBe("INSUFFICIENT");
  });

  it("returns a quality tone when approvedPerformances === DELIVERY_MIN_SAMPLE", () => {
    // At exactly the minimum sample with 100% first-time-right → EXCELLENT
    expect(deliveryTone(DELIVERY_MIN_SAMPLE, 100)).toBe("EXCELLENT");
  });

  it("returns EXCELLENT at >= 90% first-time-right", () => {
    expect(deliveryTone(5, 90)).toBe("EXCELLENT");
    expect(deliveryTone(5, 100)).toBe("EXCELLENT");
    expect(deliveryTone(10, 95)).toBe("EXCELLENT");
  });

  it("returns RELIABLE at exactly 70% and up to (but not including) 90%", () => {
    expect(deliveryTone(5, 70)).toBe("RELIABLE");
    expect(deliveryTone(5, 89)).toBe("RELIABLE");
    expect(deliveryTone(5, 80)).toBe("RELIABLE");
  });

  it("returns DEVELOPING below 70%", () => {
    expect(deliveryTone(5, 69)).toBe("DEVELOPING");
    expect(deliveryTone(5, 0)).toBe("DEVELOPING");
    expect(deliveryTone(5, 50)).toBe("DEVELOPING");
  });
});

// ---------------------------------------------------------------------------
// computeDeliveryQuality
// ---------------------------------------------------------------------------

describe("computeDeliveryQuality", () => {
  it("returns zeroed-out result for empty input", () => {
    const result = computeDeliveryQuality([], 0);
    expect(result.approvedPerformances).toBe(0);
    expect(result.firstTimeRightRate).toBe(0);
    expect(result.correctedPerformances).toBe(0);
    expect(result.avgApprovalDays).toBeNull();
    expect(result.tone).toBe("INSUFFICIENT");
    expect(result.completedCollaborations).toBe(0);
  });

  it("handles a realistic mix: some corrected, some first-time-right, some without timestamps", () => {
    const rows: ApprovedPerfRow[] = [
      // First-time-right with timestamps (2 days)
      {
        submittedAt: new Date("2024-03-01T00:00:00Z"),
        approvedAt: new Date("2024-03-03T00:00:00Z"),
        rejectedAt: null,
      },
      // First-time-right with timestamps (1 day)
      {
        submittedAt: new Date("2024-03-05T00:00:00Z"),
        approvedAt: new Date("2024-03-06T00:00:00Z"),
        rejectedAt: null,
      },
      // First-time-right without timestamps
      {
        submittedAt: null,
        approvedAt: null,
        rejectedAt: null,
      },
      // Corrected (had rejection), with timestamps (3 days)
      {
        submittedAt: new Date("2024-03-10T00:00:00Z"),
        approvedAt: new Date("2024-03-13T00:00:00Z"),
        rejectedAt: new Date("2024-03-11T00:00:00Z"),
      },
      // Corrected (had rejection), without timestamps
      {
        submittedAt: null,
        approvedAt: null,
        rejectedAt: new Date("2024-03-12T00:00:00Z"),
      },
    ];

    const result = computeDeliveryQuality(rows, 7);

    expect(result.completedCollaborations).toBe(7);
    expect(result.approvedPerformances).toBe(5);
    // 3 rows with rejectedAt === null → correctedPerformances = 2 (rows with rejectedAt != null)
    expect(result.correctedPerformances).toBe(2);
    // firstTimeRight = 3, total = 5 → ratePercent(3,5) = Math.round(60) = 60
    expect(result.firstTimeRightRate).toBe(60);
    // avgApprovalDays from rows with non-null approvalDays: 2, 1, 3 → avg = 2.0
    expect(result.avgApprovalDays).toBe(2);
    // 5 >= DELIVERY_MIN_SAMPLE=3, firstTimeRightRate=60 < 70 → DEVELOPING
    expect(result.tone).toBe("DEVELOPING");
  });

  it("reports EXCELLENT when all are first-time-right with sufficient sample", () => {
    const rows: ApprovedPerfRow[] = Array.from({ length: 4 }, (_, i) => ({
      submittedAt: new Date(`2024-0${i + 1}-01T00:00:00Z`),
      approvedAt: new Date(`2024-0${i + 1}-02T00:00:00Z`),
      rejectedAt: null,
    }));

    const result = computeDeliveryQuality(rows, 4);
    expect(result.firstTimeRightRate).toBe(100);
    expect(result.correctedPerformances).toBe(0);
    expect(result.tone).toBe("EXCELLENT");
    expect(result.avgApprovalDays).toBe(1);
  });

  it("avgApprovalDays is null when no rows have valid timestamps", () => {
    const rows: ApprovedPerfRow[] = [
      { submittedAt: null, approvedAt: null, rejectedAt: null },
      { submittedAt: null, approvedAt: null, rejectedAt: new Date("2024-01-01") },
      { submittedAt: null, approvedAt: null, rejectedAt: null },
    ];
    const result = computeDeliveryQuality(rows, 1);
    expect(result.avgApprovalDays).toBeNull();
    expect(result.approvedPerformances).toBe(3);
    expect(result.tone).toBe("DEVELOPING"); // 3 >= MIN_SAMPLE, 2/3 first-time-right = 67% → DEVELOPING
  });

  it("rounds avgApprovalDays to 1 decimal", () => {
    // 1.0 + 2.0 + 1.5 = 4.5 / 3 = 1.5
    const rows: ApprovedPerfRow[] = [
      {
        submittedAt: new Date("2024-01-01T00:00:00Z"),
        approvedAt: new Date("2024-01-02T00:00:00Z"),
        rejectedAt: null,
      },
      {
        submittedAt: new Date("2024-01-01T00:00:00Z"),
        approvedAt: new Date("2024-01-03T00:00:00Z"),
        rejectedAt: null,
      },
      {
        submittedAt: new Date("2024-01-01T00:00:00Z"),
        approvedAt: new Date("2024-01-02T12:00:00Z"),
        rejectedAt: null,
      },
    ];
    const result = computeDeliveryQuality(rows, 3);
    expect(result.avgApprovalDays).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// computeDeliveryQualityByProfile
// ---------------------------------------------------------------------------

describe("computeDeliveryQualityByProfile", () => {
  const ftr = (freelancerId: string): ProfilePerfRow => ({
    freelancerId,
    submittedAt: new Date("2024-01-01T00:00:00Z"),
    approvedAt: new Date("2024-01-02T00:00:00Z"),
    rejectedAt: null,
  });

  it("returns an entry for every requested profile, even without rows", () => {
    const result = computeDeliveryQualityByProfile(["a", "b"], [], new Map());
    expect([...result.keys()].sort()).toEqual(["a", "b"]);
    expect(result.get("a")?.tone).toBe("INSUFFICIENT");
    expect(result.get("b")?.approvedPerformances).toBe(0);
  });

  it("returns an empty map for no profiles", () => {
    expect(computeDeliveryQualityByProfile([], [], new Map()).size).toBe(0);
  });

  it("groups rows to the right profile and ignores rows for unrequested profiles", () => {
    const rows: ProfilePerfRow[] = [
      ftr("a"),
      ftr("a"),
      ftr("a"),
      ftr("b"),
      // belongs to a profile we did not ask for → must be ignored
      ftr("c"),
    ];
    const result = computeDeliveryQualityByProfile(["a", "b"], rows, new Map([["a", 5]]));

    expect(result.get("a")?.approvedPerformances).toBe(3);
    expect(result.get("a")?.completedCollaborations).toBe(5);
    expect(result.get("a")?.tone).toBe("EXCELLENT");
    // b has only 1 approved → below the min sample
    expect(result.get("b")?.approvedPerformances).toBe(1);
    expect(result.get("b")?.tone).toBe("INSUFFICIENT");
    expect(result.has("c")).toBe(false);
  });

  it("dedupes repeated profile ids in the requested list", () => {
    const result = computeDeliveryQualityByProfile(["a", "a", "a"], [ftr("a")], new Map());
    expect(result.size).toBe(1);
    expect(result.get("a")?.approvedPerformances).toBe(1);
  });

  it("separates corrected rows per profile (no cross-contamination)", () => {
    const rows: ProfilePerfRow[] = [
      ftr("a"),
      ftr("a"),
      ftr("a"),
      // profile b: three approved, all corrected
      {
        freelancerId: "b",
        submittedAt: null,
        approvedAt: null,
        rejectedAt: new Date("2024-02-01"),
      },
      {
        freelancerId: "b",
        submittedAt: null,
        approvedAt: null,
        rejectedAt: new Date("2024-02-02"),
      },
      {
        freelancerId: "b",
        submittedAt: null,
        approvedAt: null,
        rejectedAt: new Date("2024-02-03"),
      },
    ];
    const result = computeDeliveryQualityByProfile(["a", "b"], rows, new Map());

    expect(result.get("a")?.correctedPerformances).toBe(0);
    expect(result.get("a")?.firstTimeRightRate).toBe(100);
    expect(result.get("b")?.correctedPerformances).toBe(3);
    expect(result.get("b")?.firstTimeRightRate).toBe(0);
    expect(result.get("b")?.tone).toBe("DEVELOPING");
  });
});
