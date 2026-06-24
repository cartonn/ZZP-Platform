import { describe, it, expect } from "vitest";
import { approvalRate, sharePercent, formatStatsEuro, buildUserStats } from "./admin-stats";

describe("buildUserStats", () => {
  it("telt elke rol in zijn eigen categorie, inclusief FRANCHISER", () => {
    const stats = buildUserStats(
      [
        { role: "FREELANCER", count: 30 },
        { role: "CLIENT", count: 15 },
        { role: "FRANCHISER", count: 3 },
        { role: "ADMIN", count: 2 },
      ],
      4,
    );
    expect(stats).toEqual({
      total: 50,
      freelancers: 30,
      clients: 15,
      franchisers: 3,
      admins: 2,
      suspended: 4,
    });
  });

  it("laat de rolverdeling optellen tot het totaal (geen verdwijnende bemiddelaars)", () => {
    const stats = buildUserStats(
      [
        { role: "FREELANCER", count: 8 },
        { role: "FRANCHISER", count: 2 },
      ],
      0,
    );
    expect(stats.freelancers + stats.clients + stats.franchisers + stats.admins).toBe(stats.total);
  });

  it("geeft 0 voor ontbrekende rollen en telt onbekende legacy-rollen wel in total", () => {
    const stats = buildUserStats([{ role: "LEGACY_ROLE", count: 5 }], 1);
    expect(stats.total).toBe(5);
    expect(stats.freelancers).toBe(0);
    expect(stats.clients).toBe(0);
    expect(stats.franchisers).toBe(0);
    expect(stats.admins).toBe(0);
    expect(stats.suspended).toBe(1);
  });

  it("geeft een nul-verdeling bij lege invoer", () => {
    expect(buildUserStats([], 0)).toEqual({
      total: 0,
      freelancers: 0,
      clients: 0,
      franchisers: 0,
      admins: 0,
      suspended: 0,
    });
  });
});

describe("approvalRate", () => {
  it("geeft 0 bij total = 0", () => {
    expect(approvalRate(0, 0)).toBe(0);
  });

  it("berekent 100% als alles goedgekeurd is", () => {
    expect(approvalRate(10, 10)).toBe(100);
  });

  it("berekent 75% correct", () => {
    expect(approvalRate(3, 4)).toBe(75);
  });

  it("rondt af naar het dichtstbijzijnde getal", () => {
    // 2/3 ≈ 0.6667 → 67
    expect(approvalRate(2, 3)).toBe(67);
  });

  it("geeft 0% bij approved = 0", () => {
    expect(approvalRate(0, 10)).toBe(0);
  });
});

describe("sharePercent", () => {
  it("geeft 0 bij total = 0", () => {
    expect(sharePercent(0, 0)).toBe(0);
  });

  it("berekent 50% correct", () => {
    expect(sharePercent(5, 10)).toBe(50);
  });

  it("berekent 33% correct (afgerond)", () => {
    expect(sharePercent(1, 3)).toBe(33);
  });

  it("geeft 100% als part gelijk is aan total", () => {
    expect(sharePercent(7, 7)).toBe(100);
  });
});

describe("formatStatsEuro", () => {
  it("formateert nul als € 0,00", () => {
    expect(formatStatsEuro(0)).toBe("€ 0,00");
  });

  it("formateert 100 cent als € 1,00", () => {
    expect(formatStatsEuro(100)).toBe("€ 1,00");
  });

  it("formateert 123456 als € 1.234,56", () => {
    expect(formatStatsEuro(123456)).toBe("€ 1.234,56");
  });

  it("formateert groot bedrag met punt-scheidingsteken", () => {
    const result = formatStatsEuro(1_000_000_00);
    expect(result).toContain("1.000.000");
  });
});
