import { describe, it, expect } from "vitest";
import { buildCompanyBreakdown } from "@/lib/tenant-stats";

const companies = [
  { id: "c1", name: "Zorggroep West" },
  { id: "c2", name: "Thuiszorg Noord" },
  { id: "c3", name: "Kliniek Zuid" },
];

describe("buildCompanyBreakdown", () => {
  it("aggregeert diensten, vulling en omzet per opdrachtgever", () => {
    const rows = buildCompanyBreakdown(
      companies,
      [
        { companyId: "c1", filled: true },
        { companyId: "c1", filled: false },
        { companyId: "c2", filled: true },
      ],
      [
        { companyId: "c1", totalCents: 100_00 },
        { companyId: "c1", totalCents: 50_00 },
        { companyId: "c2", totalCents: 300_00 },
      ],
    );
    const c1 = rows.find((r) => r.companyId === "c1")!;
    expect(c1.totalJobs).toBe(2);
    expect(c1.filledJobs).toBe(1);
    expect(c1.fillRate).toBe(50);
    expect(c1.revenuePaidCents).toBe(150_00);
    const c2 = rows.find((r) => r.companyId === "c2")!;
    expect(c2.revenuePaidCents).toBe(300_00);
  });

  it("sorteert op omzet (dan op aantal diensten)", () => {
    const rows = buildCompanyBreakdown(
      companies,
      [
        { companyId: "c1", filled: true },
        { companyId: "c3", filled: false },
      ],
      [
        { companyId: "c1", totalCents: 100_00 },
        { companyId: "c2", totalCents: 999_00 },
      ],
    );
    expect(rows.map((r) => r.companyId)).toEqual(["c2", "c1", "c3"]);
  });

  it("negeert facturen zonder bekende opdrachtgever en met onbekende id", () => {
    const rows = buildCompanyBreakdown(
      companies,
      [],
      [
        { companyId: null, totalCents: 500_00 },
        { companyId: "onbekend", totalCents: 700_00 },
        { companyId: "c1", totalCents: 25_00 },
      ],
    );
    const total = rows.reduce((s, r) => s + r.revenuePaidCents, 0);
    expect(total).toBe(25_00);
  });

  it("geeft fillRate 0 bij een opdrachtgever zonder diensten", () => {
    const rows = buildCompanyBreakdown(companies, [], []);
    expect(rows.every((r) => r.fillRate === 0 && r.totalJobs === 0)).toBe(true);
    expect(rows).toHaveLength(3);
  });
});
