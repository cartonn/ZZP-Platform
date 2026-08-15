import { describe, expect, it } from "vitest";
import { buildFreelancerRevenueBreakdown } from "./freelancer-revenue-breakdown";

describe("buildFreelancerRevenueBreakdown", () => {
  it("returns an empty breakdown without invoices", () => {
    const b = buildFreelancerRevenueBreakdown([]);
    expect(b.rows).toEqual([]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.concentrationPct).toBeNull();
  });

  it("aggregates paid cents per company and counts distinct collaborations", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 10_000 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 5_000 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c2", totalCents: 5_000 },
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c3", totalCents: 4_000 },
    ]);
    expect(b.totalPaidCents).toBe(24_000);
    const zorg = b.rows.find((r) => r.companyId === "co1")!;
    expect(zorg.paidCents).toBe(20_000);
    expect(zorg.placements).toBe(2);
    const bouw = b.rows.find((r) => r.companyId === "co2")!;
    expect(bouw.paidCents).toBe(4_000);
    expect(bouw.placements).toBe(1);
  });

  it("sorts descending by paid cents and computes share + concentration", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c3", totalCents: 4_000 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 12_000 },
    ]);
    expect(b.rows.map((r) => r.companyId)).toEqual(["co1", "co2"]);
    expect(b.rows[0]!.sharePct).toBe(75);
    expect(b.rows[1]!.sharePct).toBe(25);
    // concentratie = aandeel van de grootste opdrachtgever
    expect(b.concentrationPct).toBe(75);
  });

  it("breaks ties on paid cents by distinct collaboration count", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 6_000 },
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c2", totalCents: 3_000 },
      { companyId: "co2", companyName: "Bouw NV", collaborationId: "c3", totalCents: 3_000 },
    ]);
    // gelijk bedrag (6000) → meer samenwerkingen eerst
    expect(b.rows.map((r) => r.companyId)).toEqual(["co2", "co1"]);
    expect(b.rows[0]!.placements).toBe(2);
  });

  it("ignores invoices without a known company (collaboration deleted)", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: null, companyName: null, collaborationId: null, totalCents: 9_999 },
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.totalPaidCents).toBe(1_000);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]!.companyId).toBe("co1");
  });

  it("falls back to a neutral name when the company name is null", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: null, collaborationId: "c1", totalCents: 1_000 },
    ]);
    expect(b.rows[0]!.name).toBe("Onbekende opdrachtgever");
  });

  it("treats null totalCents as zero without breaking the share math", () => {
    const b = buildFreelancerRevenueBreakdown([
      { companyId: "co1", companyName: "Zorg BV", collaborationId: "c1", totalCents: null },
    ]);
    expect(b.totalPaidCents).toBe(0);
    expect(b.rows[0]!.paidCents).toBe(0);
    expect(b.rows[0]!.sharePct).toBe(0);
    // geen omzet → geen concentratiesignaal
    expect(b.concentrationPct).toBeNull();
  });
});
