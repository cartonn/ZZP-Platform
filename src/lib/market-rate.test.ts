import { describe, expect, it } from "vitest";
import {
  computeMarketBand,
  computeMarketRate,
  median,
  percentile,
  ratePosition,
} from "@/lib/market-rate";

// ---------------------------------------------------------------------------
// median
// ---------------------------------------------------------------------------
describe("median", () => {
  it("geeft null terug bij een lege array", () => {
    expect(median([])).toBeNull();
  });

  it("geeft de middelste waarde bij oneven lengte", () => {
    expect(median([10, 20, 30])).toBe(20);
    expect(median([5, 1, 3])).toBe(3); // sorteert intern: [1,3,5]
    expect(median([42])).toBe(42);
  });

  it("geeft het gemiddelde van de twee middelste waarden bij even lengte", () => {
    expect(median([10, 20, 30, 40])).toBe(25); // (20+30)/2
    expect(median([1, 2, 3, 4])).toBe(2.5); // (2+3)/2
    expect(median([100, 200])).toBe(150);
  });

  it("rondt NIET af — dat is de verantwoordelijkheid van computeMarketRate", () => {
    expect(median([1, 2])).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// percentile
// ---------------------------------------------------------------------------
describe("percentile", () => {
  it("geeft null terug bij een lege array", () => {
    expect(percentile([], 0.5)).toBeNull();
  });

  it("p=0 geeft het minimum", () => {
    expect(percentile([30, 10, 20], 0)).toBe(10);
  });

  it("p=1 geeft het maximum", () => {
    expect(percentile([30, 10, 20], 1)).toBe(30);
  });

  it("p=0.5 op {10, 20, 30} geeft 20", () => {
    expect(percentile([10, 20, 30], 0.5)).toBe(20);
  });

  it("interpolatie tussen twee waarden", () => {
    // Geordend: [0, 100]; idx = 0.25 * 1 = 0.25; resultaat = 0 + 100*0.25 = 25
    expect(percentile([0, 100], 0.25)).toBe(25);
    // Geordend: [10, 20, 30, 40]; idx = 0.75 * 3 = 2.25;
    // lo=2 (30), hi=3 (40); 30 + 10*0.25 = 32.5
    expect(percentile([10, 20, 30, 40], 0.75)).toBe(32.5);
  });

  it("muteert de invoerarray NIET", () => {
    const input = [30, 10, 20];
    const original = [...input];
    percentile(input, 0.5);
    expect(input).toEqual(original);
  });

  it("één waarde: p25 en p75 geven die waarde", () => {
    expect(percentile([50], 0.25)).toBe(50);
    expect(percentile([50], 0.75)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// computeMarketRate
// ---------------------------------------------------------------------------
describe("computeMarketRate", () => {
  const MIN = 3; // gebruik dezelfde drempel als MARKET_RATE_MIN_SAMPLE

  // --- scope-keuze ---

  it("kiest industrie-scope wanneer er genoeg industrie-peers zijn", () => {
    const result = computeMarketRate({
      ownRate: 75,
      industryPeerRates: [60, 70, 80],
      platformPeerRates: [50, 55, 60, 65, 70],
      minSample: MIN,
    });
    expect(result.scope).toBe("industry");
    expect(result.sampleSize).toBe(3);
  });

  it("valt terug op platform-scope wanneer industrie te klein is maar platform genoeg heeft", () => {
    const result = computeMarketRate({
      ownRate: 75,
      industryPeerRates: [60, 70], // slechts 2
      platformPeerRates: [50, 60, 70, 80, 90],
      minSample: MIN,
    });
    expect(result.scope).toBe("platform");
    expect(result.sampleSize).toBe(5);
  });

  it("geeft scope 'none' wanneer beide sets onder de drempel vallen", () => {
    const result = computeMarketRate({
      ownRate: 75,
      industryPeerRates: [60],
      platformPeerRates: [55, 65],
      minSample: MIN,
    });
    expect(result.scope).toBe("none");
    expect(result.median).toBeNull();
    expect(result.p25).toBeNull();
    expect(result.p75).toBeNull();
    expect(result.position).toBe("unknown");
  });

  it("sampleSize bij scope 'none' = grootte van de grootste beschikbare set", () => {
    const result = computeMarketRate({
      ownRate: 75,
      industryPeerRates: [60], // 1
      platformPeerRates: [55, 65], // 2
      minSample: MIN,
    });
    expect(result.sampleSize).toBe(2); // platform is groter
  });

  it("sampleSize bij scope 'none' — industrie is de grootste beschikbare set", () => {
    const result = computeMarketRate({
      ownRate: 75,
      industryPeerRates: [60, 70], // 2
      platformPeerRates: [55], // 1
      minSample: MIN,
    });
    expect(result.sampleSize).toBe(2); // industrie is groter
  });

  it("sampleSize bij scope 'none' — beide leeg", () => {
    const result = computeMarketRate({
      ownRate: 75,
      industryPeerRates: [],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.sampleSize).toBe(0);
  });

  // --- position ---

  it("position 'below' wanneer eigen tarief onder p25 ligt", () => {
    // peers: [40, 60, 80, 100, 120] — p25 ≈ 60, p75 ≈ 100
    const result = computeMarketRate({
      ownRate: 30, // ruim onder p25
      industryPeerRates: [40, 60, 80, 100, 120],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.position).toBe("below");
  });

  it("position 'within' wanneer eigen tarief tussen p25 en p75 ligt", () => {
    const result = computeMarketRate({
      ownRate: 80,
      industryPeerRates: [40, 60, 80, 100, 120],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.position).toBe("within");
  });

  it("position 'above' wanneer eigen tarief boven p75 ligt", () => {
    const result = computeMarketRate({
      ownRate: 130,
      industryPeerRates: [40, 60, 80, 100, 120],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.position).toBe("above");
  });

  it("position 'unknown' wanneer ownRate null is", () => {
    const result = computeMarketRate({
      ownRate: null,
      industryPeerRates: [40, 60, 80],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.position).toBe("unknown");
    expect(result.ownRate).toBeNull();
  });

  it("position 'unknown' wanneer ownRate nul of negatief is", () => {
    for (const rate of [0, -1, -100]) {
      const result = computeMarketRate({
        ownRate: rate,
        industryPeerRates: [40, 60, 80],
        platformPeerRates: [],
        minSample: MIN,
      });
      expect(result.position).toBe("unknown");
    }
  });

  // --- filtering van ongeldige peer-waarden ---

  it("negeert niet-positieve en niet-eindige peer-waarden", () => {
    const result = computeMarketRate({
      ownRate: 70,
      industryPeerRates: [60, 0, -10, Infinity, NaN, 80, 100],
      platformPeerRates: [],
      minSample: MIN,
    });
    // Na filtering: [60, 80, 100] — 3 geldige peers
    expect(result.scope).toBe("industry");
    expect(result.sampleSize).toBe(3);
  });

  it("scope 'none' wanneer industrie-peers allemaal ongeldig zijn", () => {
    const result = computeMarketRate({
      ownRate: 70,
      industryPeerRates: [0, -5, Infinity],
      platformPeerRates: [0, NaN],
      minSample: MIN,
    });
    expect(result.scope).toBe("none");
    expect(result.sampleSize).toBe(0);
  });

  // --- correcte berekening ---

  it("mediaan en kwartielen worden afgerond op heel getal", () => {
    // peers: [10, 20, 30] — mediaan = 20, p25 = 15, p75 = 25
    const result = computeMarketRate({
      ownRate: 20,
      industryPeerRates: [10, 20, 30],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.median).toBe(20);
    expect(result.p25).toBe(15);
    expect(result.p75).toBe(25);
  });

  it("geeft ownRate ongewijzigd door in het resultaat", () => {
    const result = computeMarketRate({
      ownRate: 87.5,
      industryPeerRates: [60, 80, 100],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(result.ownRate).toBe(87.5);
  });
});

// ---------------------------------------------------------------------------
// ratePosition
// ---------------------------------------------------------------------------
describe("ratePosition", () => {
  it("geeft 'unknown' bij ontbrekend of niet-positief tarief", () => {
    expect(ratePosition(50, 80, null)).toBe("unknown");
    expect(ratePosition(50, 80, 0)).toBe("unknown");
    expect(ratePosition(50, 80, -10)).toBe("unknown");
    expect(ratePosition(50, 80, Number.NaN)).toBe("unknown");
  });

  it("geeft 'unknown' wanneer de band onbekend is", () => {
    expect(ratePosition(null, 80, 60)).toBe("unknown");
    expect(ratePosition(50, null, 60)).toBe("unknown");
  });

  it("classificeert below/within/above t.o.v. p25–p75", () => {
    expect(ratePosition(50, 80, 40)).toBe("below");
    expect(ratePosition(50, 80, 65)).toBe("within");
    expect(ratePosition(50, 80, 90)).toBe("above");
  });

  it("grenzen p25 en p75 tellen als 'within' (inclusief)", () => {
    expect(ratePosition(50, 80, 50)).toBe("within");
    expect(ratePosition(50, 80, 80)).toBe("within");
  });
});

// ---------------------------------------------------------------------------
// computeMarketBand
// ---------------------------------------------------------------------------
describe("computeMarketBand", () => {
  const MIN = 3;

  it("kiest de industrie-set bij genoeg branche-peers", () => {
    const band = computeMarketBand({
      industryPeerRates: [40, 50, 60],
      platformPeerRates: [10, 20, 30, 100],
      minSample: MIN,
    });
    expect(band.scope).toBe("industry");
    expect(band.sampleSize).toBe(3);
    expect(band.median).toBe(50);
    expect(band.p25).toBe(45);
    expect(band.p75).toBe(55);
    // Niet-afgeronde grenswaarden gelijk aan de afgeronde wanneer de percentielen heel zijn.
    expect(band.p25Raw).toBe(45);
    expect(band.p75Raw).toBe(55);
  });

  it("bewaart de niet-afgeronde p25/p75 voor consistente grensclassificatie", () => {
    // peers: [40, 41, 42, 43] — p25 = 40.75, p75 = 42.25 (afgerond 41 resp. 42)
    const band = computeMarketBand({
      industryPeerRates: [40, 41, 42, 43],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(band.p25).toBe(41);
    expect(band.p75).toBe(42);
    expect(band.p25Raw).toBeCloseTo(40.75, 5);
    expect(band.p75Raw).toBeCloseTo(42.25, 5);
    // Een tarief van 41 ligt onder de niet-afgeronde p75 (42.25) → 'within',
    // maar zou op de afgeronde p25 (41) als grensgeval anders kunnen vallen.
    expect(ratePosition(band.p25Raw, band.p75Raw, 41)).toBe("within");
    // Op de afgeronde band zou 42.1 boven p75 (42) liggen ('above'); op de
    // niet-afgeronde band (42.25) is het nog 'within' — dit is de consistentie die we willen.
    expect(ratePosition(band.p25Raw, band.p75Raw, 42.1)).toBe("within");
  });

  it("geeft p25Raw/p75Raw null bij scope 'none'", () => {
    const band = computeMarketBand({
      industryPeerRates: [40, 50],
      platformPeerRates: [40, 50],
      minSample: MIN,
    });
    expect(band.p25Raw).toBeNull();
    expect(band.p75Raw).toBeNull();
  });

  it("valt terug op het platform bij te weinig branche-peers", () => {
    const band = computeMarketBand({
      industryPeerRates: [40],
      platformPeerRates: [10, 20, 30],
      minSample: MIN,
    });
    expect(band.scope).toBe("platform");
    expect(band.sampleSize).toBe(3);
    expect(band.median).toBe(20);
  });

  it("geeft scope 'none' met voortgangsteller bij te weinig peers overal", () => {
    const band = computeMarketBand({
      industryPeerRates: [40, 50],
      platformPeerRates: [40, 50],
      minSample: MIN,
    });
    expect(band.scope).toBe("none");
    expect(band.sampleSize).toBe(2);
    expect(band.median).toBeNull();
    expect(band.p25).toBeNull();
    expect(band.p75).toBeNull();
  });

  it("filtert niet-positieve en niet-eindige tarieven weg", () => {
    const band = computeMarketBand({
      industryPeerRates: [0, -5, Number.POSITIVE_INFINITY, 40, 50, 60],
      platformPeerRates: [],
      minSample: MIN,
    });
    expect(band.scope).toBe("industry");
    expect(band.sampleSize).toBe(3);
    expect(band.median).toBe(50);
  });

  it("muteert de invoer-arrays niet", () => {
    const industry = [60, 40, 50];
    const platform = [30, 10, 20];
    computeMarketBand({ industryPeerRates: industry, platformPeerRates: platform, minSample: MIN });
    expect(industry).toEqual([60, 40, 50]);
    expect(platform).toEqual([30, 10, 20]);
  });
});
