import { describe, expect, it } from "vitest";
import { companyReputationFromReviews } from "@/lib/company-reputation";

describe("companyReputationFromReviews", () => {
  it("geeft null zonder beoordelingen (nieuwkomer lijkt niet zwak)", () => {
    expect(companyReputationFromReviews([])).toBeNull();
  });

  it("geeft null wanneer alle cijfers ongeldig zijn (buiten 1..5)", () => {
    expect(companyReputationFromReviews([{ rating: 0 }, { rating: 6 }])).toBeNull();
  });

  it("aggregeert geldige beoordelingen tot gemiddelde + aantal", () => {
    const result = companyReputationFromReviews([{ rating: 5 }, { rating: 4 }, { rating: 5 }]);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(3);
    // (5 + 4 + 5) / 3 = 4.666… → afgerond op 1 decimaal
    expect(result?.average).toBe(4.7);
    expect(result?.distribution[5]).toBe(2);
    expect(result?.distribution[4]).toBe(1);
  });

  it("telt alleen de geldige cijfers wanneer er ongeldige tussen zitten", () => {
    const result = companyReputationFromReviews([{ rating: 3 }, { rating: 99 }]);
    expect(result?.count).toBe(1);
    expect(result?.average).toBe(3);
  });
});
