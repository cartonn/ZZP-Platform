import { describe, expect, it } from "vitest";
import { buildClientSpendBreakdown } from "./client-spend-breakdown";

describe("buildClientSpendBreakdown", () => {
  it("returns an empty breakdown without invoices", () => {
    const b = buildClientSpendBreakdown([]);
    expect(b.rows).toEqual([]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.concentrationPct).toBeNull();
  });

  it("aggregates paid cents per freelancer and counts distinct collaborations", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 10_000 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 5_000 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c2", totalCents: 5_000 },
      { freelancerId: "f2", freelancerName: "Bram", collaborationId: "c3", totalCents: 4_000 },
    ]);
    expect(b.totalPaidCents).toBe(24_000);
    const sanne = b.rows.find((r) => r.freelancerId === "f1")!;
    expect(sanne.paidCents).toBe(20_000);
    expect(sanne.placements).toBe(2);
    const bram = b.rows.find((r) => r.freelancerId === "f2")!;
    expect(bram.paidCents).toBe(4_000);
    expect(bram.placements).toBe(1);
  });

  it("sorts descending by paid cents and computes share + concentration", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f2", freelancerName: "Bram", collaborationId: "c3", totalCents: 4_000 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 12_000 },
    ]);
    expect(b.rows.map((r) => r.freelancerId)).toEqual(["f1", "f2"]);
    expect(b.rows[0]!.sharePct).toBe(75);
    expect(b.rows[1]!.sharePct).toBe(25);
    // concentratie = aandeel van de grootste ZZP'er
    expect(b.concentrationPct).toBe(75);
  });

  it("ignores invoices without a known freelancer (collaboration deleted)", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: null, freelancerName: null, collaborationId: null, totalCents: 9_999 },
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.totalPaidCents).toBe(1_000);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]!.freelancerId).toBe("f1");
  });

  it("falls back to a neutral name when the freelancer name is anonymized/null", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f1", freelancerName: null, collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.rows[0]!.name).toBe("Onbekende ZZP'er");
  });

  it("treats null totalCents as zero without breaking the share math", () => {
    const b = buildClientSpendBreakdown([
      { freelancerId: "f1", freelancerName: "Sanne", collaborationId: "c1", totalCents: null },
    ]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.rows[0]!.paidCents).toBe(0);
    expect(b.rows[0]!.sharePct).toBe(0);
    // geen uitgaven → geen concentratiesignaal
    expect(b.concentrationPct).toBeNull();
  });
});
