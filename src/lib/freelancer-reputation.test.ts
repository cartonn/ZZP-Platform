import { describe, it, expect } from "vitest";
import { freelancerReputationFromReviews } from "@/lib/freelancer-reputation";
import { REVIEW_AGGREGATE_MIN_SAMPLE } from "@/lib/config";

describe("freelancerReputationFromReviews", () => {
  it("geeft null bij nul beoordelingen (nieuwkomer lijkt niet onterecht zwak)", () => {
    expect(freelancerReputationFromReviews([])).toBeNull();
  });

  it("geeft null als alle cijfers buiten 1..5 vallen (geen geldige beoordeling)", () => {
    expect(freelancerReputationFromReviews([{ rating: 0 }, { rating: 6 }])).toBeNull();
  });

  // --- k-anonimiteitsvloer (security-review 6-9-2026) ------------------------
  // Het publieke, deelbare vertrouwensdossier mag geen individueel-herleidbaar cijfer tonen.
  it("geeft null bij één beoordeling (dat 'gemiddelde' ís die ene beoordeling — k-anon lek)", () => {
    // Vóór de fix: count 1, average 2 → op de publieke /vertrouwen-pagina getoond als
    // "Gemiddeld cijfer over 1 beoordeling: 2,0 ★" — het exacte cijfer van één opdrachtgever.
    expect(freelancerReputationFromReviews([{ rating: 2 }])).toBeNull();
  });

  it("geeft null bij twee beoordelingen (de ander is uit gemiddelde + aantal herleidbaar)", () => {
    // Een beoordelaar die zijn eigen 5 kent, leidt uit gemiddelde 3,5 het cijfer 2 van de ander af.
    expect(freelancerReputationFromReviews([{ rating: 5 }, { rating: 2 }])).toBeNull();
  });

  it("toont het cijfer vanaf de drempel (geen individueel cijfer meer herleidbaar)", () => {
    const rows = Array.from({ length: REVIEW_AGGREGATE_MIN_SAMPLE }, () => ({ rating: 4 }));
    const result = freelancerReputationFromReviews(rows);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(REVIEW_AGGREGATE_MIN_SAMPLE);
    expect(result?.average).toBe(4);
  });

  it("aggregeert geldige beoordelingen tot gemiddelde + aantal (boven de drempel)", () => {
    const result = freelancerReputationFromReviews([
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
    ]);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(4);
    // (5 + 4 + 5 + 4) / 4 = 4,5
    expect(result?.average).toBe(4.5);
    expect(result?.distribution[5]).toBe(2);
    expect(result?.distribution[4]).toBe(2);
  });

  it("negeert ongeldige cijfers; alleen de geldige tellen mee voor de drempel", () => {
    // Twee ongeldige cijfers eruit; drie geldige blijven over → precies op de drempel, dus getoond.
    const result = freelancerReputationFromReviews([
      { rating: 4 },
      { rating: 99 },
      { rating: 4 },
      { rating: 0 },
      { rating: 4 },
    ]);
    expect(result?.count).toBe(3);
    expect(result?.average).toBe(4);
  });

  it("een enkel geldig cijfer tussen ongeldige blijft onder de drempel (null)", () => {
    // Regressie op de oude "count telt alleen geldige"-test: één geldig cijfer haalt de vloer niet.
    expect(freelancerReputationFromReviews([{ rating: 4 }, { rating: 99 }])).toBeNull();
  });
});
