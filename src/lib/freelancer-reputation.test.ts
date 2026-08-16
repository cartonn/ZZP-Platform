import { describe, it, expect } from "vitest";
import { freelancerReputationFromReviews } from "@/lib/freelancer-reputation";

describe("freelancerReputationFromReviews", () => {
  it("geeft null bij nul beoordelingen (nieuwkomer lijkt niet onterecht zwak)", () => {
    expect(freelancerReputationFromReviews([])).toBeNull();
  });

  it("geeft null als alle cijfers buiten 1..5 vallen (geen geldige beoordeling)", () => {
    expect(freelancerReputationFromReviews([{ rating: 0 }, { rating: 6 }])).toBeNull();
  });

  it("aggregeert geldige beoordelingen tot gemiddelde + aantal", () => {
    const result = freelancerReputationFromReviews([{ rating: 5 }, { rating: 4 }, { rating: 5 }]);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(3);
    // (5 + 4 + 5) / 3 = 4,6667 -> afgerond op 1 decimaal
    expect(result?.average).toBe(4.7);
    expect(result?.distribution[5]).toBe(2);
    expect(result?.distribution[4]).toBe(1);
  });

  it("negeert ongeldige cijfers maar behoudt de geldige (count telt alleen geldige)", () => {
    const result = freelancerReputationFromReviews([{ rating: 4 }, { rating: 99 }]);
    expect(result?.count).toBe(1);
    expect(result?.average).toBe(4);
  });
});
