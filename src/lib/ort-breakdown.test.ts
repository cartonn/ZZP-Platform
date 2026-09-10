import { describe, it, expect } from "vitest";
import { computeOrt, ortSubtotalCents, type OrtSegment } from "@/lib/ort";
import {
  type OrtBreakdown,
  computePerformanceOrt,
  safeComputeOrt,
  summarizeOrtBreakdown,
  reconcileSubtotalWithInvoice,
  EMPTY_ORT_BREAKDOWN,
} from "@/lib/ort-breakdown";

describe("summarizeOrtBreakdown", () => {
  it("splitst reguliere en ORT-uren en spiegelt de bedragen van computeOrt", () => {
    const segments: OrtSegment[] = [
      { category: "NORMAL", hours: 6 },
      { category: "EVENING", hours: 2 },
      { category: "SATURDAY", hours: 4 },
    ];
    const rateCents = 5000; // €50/u

    const bd = summarizeOrtBreakdown({ segments, hours: 12, rateCents });
    const canonical = computeOrt(segments, rateCents);

    expect(bd.normalHours).toBe(6);
    expect(bd.ortHours).toBe(6); // 2 + 4
    // Geen eigen rekenregels: basis + toeslag komen 1-op-1 uit de canonieke motor.
    expect(bd.baseCents).toBe(canonical.baseCents);
    expect(bd.surchargeCents).toBe(canonical.surchargeCents);
    // Basis + toeslag = het factuursubtotaal (afstembaar met een loonstrook).
    expect(bd.baseCents + bd.surchargeCents).toBe(canonical.subtotalCents);
  });

  it("telt geen toeslag bij een urenstaat zonder ORT-segmenten (platte uren × tarief)", () => {
    const bd = summarizeOrtBreakdown({ segments: null, hours: 40, rateCents: 4000 });
    expect(bd).toEqual({
      normalHours: 40,
      ortHours: 0,
      baseCents: 40 * 4000,
      surchargeCents: 0,
    });
  });

  it("behandelt een lege segmentenlijst als platte uren", () => {
    const bd = summarizeOrtBreakdown({ segments: [], hours: 10, rateCents: 3000 });
    expect(bd.normalHours).toBe(10);
    expect(bd.ortHours).toBe(0);
    expect(bd.baseCents).toBe(30000);
    expect(bd.surchargeCents).toBe(0);
  });

  it("geeft een lege uitsplitsing zonder bruikbaar uurtarief (bv. een milestone)", () => {
    expect(summarizeOrtBreakdown({ segments: null, hours: null, rateCents: null })).toEqual(
      EMPTY_ORT_BREAKDOWN,
    );
    // Ook met ORT-segmenten maar zonder tarief: leeg i.p.v. een fout of een NaN-bedrag.
    expect(
      summarizeOrtBreakdown({
        segments: [{ category: "NORMAL", hours: 8 }],
        hours: 8,
        rateCents: null,
      }),
    ).toEqual(EMPTY_ORT_BREAKDOWN);
  });

  it("geeft een lege uitsplitsing bij een tarief zonder uren en zonder segmenten", () => {
    expect(summarizeOrtBreakdown({ segments: null, hours: null, rateCents: 5000 })).toEqual(
      EMPTY_ORT_BREAKDOWN,
    );
  });
});

describe("reconcileSubtotalWithInvoice — bevroren factuur wint (geen ORT-drift)", () => {
  // Snapshot-stabiele basis (uren × gesnapshot uurtarief); de toeslag mocht live driften.
  const liveBreakdown: OrtBreakdown = {
    normalHours: 8,
    ortHours: 4,
    baseCents: 400_00,
    surchargeCents: 98_00,
  };

  it("zonder factuur: laat de live waarden ongemoeid (DRAFT/SUBMITTED/REJECTED)", () => {
    const res = reconcileSubtotalWithInvoice({
      subtotalCents: 498_00,
      ortBreakdown: liveBreakdown,
      hasOrt: true,
      invoicedSubtotalCents: null,
    });
    expect(res.subtotalCents).toBe(498_00);
    expect(res.ortBreakdown).toEqual(liveBreakdown);
  });

  it("met factuur: toont het bevroren subtotaal, niet de (gedrifte) live-herberekening", () => {
    // De samenwerking-toeslagen zijn ná facturatie verlaagd → live zou 440_00 tonen; de factuur
    // bevroor echter 498_00 (wat de opdrachtgever kreeg/betaalde). De factuur wint.
    const res = reconcileSubtotalWithInvoice({
      subtotalCents: 440_00, // gedrifte live-waarde
      ortBreakdown: { ...liveBreakdown, surchargeCents: 40_00 },
      hasOrt: true,
      invoicedSubtotalCents: 498_00,
    });
    expect(res.subtotalCents).toBe(498_00);
    // Toeslag reconciliëert tegen het bevroren subtotaal: 498_00 − basis 400_00 = 98_00.
    expect(res.ortBreakdown.surchargeCents).toBe(98_00);
    expect(res.ortBreakdown.baseCents).toBe(400_00);
  });

  it("met factuur zonder ORT: neemt het bevroren subtotaal over, toeslag blijft 0", () => {
    const flat: OrtBreakdown = {
      normalHours: 10,
      ortHours: 0,
      baseCents: 500_00,
      surchargeCents: 0,
    };
    const res = reconcileSubtotalWithInvoice({
      subtotalCents: 480_00,
      ortBreakdown: flat,
      hasOrt: false,
      invoicedSubtotalCents: 500_00,
    });
    expect(res.subtotalCents).toBe(500_00);
    expect(res.ortBreakdown).toEqual(flat); // ongewijzigd: geen toeslag om te reconciliëren
  });

  it("een factuursubtotaal van 0 telt óók als bevroren (niet als 'geen factuur')", () => {
    const res = reconcileSubtotalWithInvoice({
      subtotalCents: 120_00,
      ortBreakdown: liveBreakdown,
      hasOrt: true,
      invoicedSubtotalCents: 0,
    });
    expect(res.subtotalCents).toBe(0);
  });
});

describe("computePerformanceOrt — gedeelde, defensieve per-rij-bron", () => {
  const validSegmentsJson = JSON.stringify([
    { category: "NORMAL", hours: 6 },
    { category: "EVENING", hours: 2 },
    { category: "SATURDAY", hours: 4 },
  ]);

  it("geldige ORT-segmenten: spiegelt exact de canonieke computeOrt/summarize (geen drift)", () => {
    const rateCents = 5000;
    const res = computePerformanceOrt({
      type: "HOURS",
      rateCents,
      hours: 12,
      amountCents: null,
      ortSegments: validSegmentsJson,
      ortProfile: null,
      ortCustomRates: null,
    });

    const segs = JSON.parse(validSegmentsJson) as OrtSegment[];
    expect(res.hasOrt).toBe(true);
    expect(res.subtotalCents).toBe(ortSubtotalCents(segs, rateCents));
    expect(res.ortBreakdown).toEqual(
      summarizeOrtBreakdown({ segments: segs, hours: 12, rateCents }),
    );
    // Basis + toeslag = het factuursubtotaal.
    expect(res.ortBreakdown.baseCents + res.ortBreakdown.surchargeCents).toBe(
      computeOrt(segs, rateCents).subtotalCents,
    );
  });

  it("corrupte categorie (JSON-geldig, semantisch fout): degradeert i.p.v. te throwen", () => {
    const res = computePerformanceOrt({
      type: "HOURS",
      rateCents: 5000,
      hours: 8,
      amountCents: null,
      // computeOrt throwt op deze onbekende categorie; parseOrtSegments laat 'm door.
      ortSegments: JSON.stringify([{ category: "BOGUS", hours: 8 }]),
      ortProfile: null,
      ortCustomRates: null,
    });

    // Terugval op de basis (uren × tarief), gemarkeerd als geen-ORT.
    expect(res.hasOrt).toBe(false);
    expect(res.subtotalCents).toBe(8 * 5000);
    expect(res.ortBreakdown).toEqual({
      normalHours: 8,
      ortHours: 0,
      baseCents: 8 * 5000,
      surchargeCents: 0,
    });
  });

  it("corrupt segment met negatieve uren: degradeert eveneens", () => {
    const res = computePerformanceOrt({
      type: "HOURS",
      rateCents: 4000,
      hours: 5,
      amountCents: null,
      ortSegments: JSON.stringify([{ category: "NIGHT", hours: -5 }]),
      ortProfile: null,
      ortCustomRates: null,
    });
    expect(res.hasOrt).toBe(false);
    expect(res.subtotalCents).toBe(5 * 4000);
  });

  it("corrupt segment zonder terugval-uren: leeg + null i.p.v. crash", () => {
    const res = computePerformanceOrt({
      type: "HOURS",
      rateCents: 4000,
      hours: null,
      amountCents: null,
      ortSegments: JSON.stringify([{ category: "BOGUS", hours: 3 }]),
      ortProfile: null,
      ortCustomRates: null,
    });
    expect(res.hasOrt).toBe(false);
    expect(res.subtotalCents).toBeNull();
    expect(res.ortBreakdown).toEqual(EMPTY_ORT_BREAKDOWN);
  });

  it("HOURS zonder ORT-segmenten: platte uren × tarief, geen ORT", () => {
    const res = computePerformanceOrt({
      type: "HOURS",
      rateCents: 3000,
      hours: 40,
      amountCents: null,
      ortSegments: null,
      ortProfile: null,
      ortCustomRates: null,
    });
    expect(res.hasOrt).toBe(false);
    expect(res.subtotalCents).toBe(40 * 3000);
    expect(res.ortBreakdown.normalHours).toBe(40);
    expect(res.ortBreakdown.surchargeCents).toBe(0);
  });

  it("MILESTONE: neemt het milestonebedrag, geen ORT", () => {
    const res = computePerformanceOrt({
      type: "MILESTONE",
      rateCents: null,
      hours: null,
      amountCents: 250_00,
      ortSegments: null,
      ortProfile: null,
      ortCustomRates: null,
    });
    expect(res.hasOrt).toBe(false);
    expect(res.subtotalCents).toBe(250_00);
    expect(res.ortBreakdown).toEqual(EMPTY_ORT_BREAKDOWN);
  });

  it("HOURS zonder uurtarief: geen bedrag, geen crash", () => {
    const res = computePerformanceOrt({
      type: "HOURS",
      rateCents: null,
      hours: 8,
      amountCents: null,
      ortSegments: validSegmentsJson,
      ortProfile: null,
      ortCustomRates: null,
    });
    expect(res.subtotalCents).toBeNull();
    expect(res.ortBreakdown).toEqual(EMPTY_ORT_BREAKDOWN);
  });
});

describe("safeComputeOrt — throw-veilige wrapper voor de read-/weergavepaden", () => {
  const rateCents = 5000; // €50/u

  it("geeft exact hetzelfde resultaat als computeOrt bij geldige segmenten (geen drift)", () => {
    const segments: OrtSegment[] = [
      { category: "NORMAL", hours: 6 },
      { category: "EVENING", hours: 2 },
    ];
    expect(safeComputeOrt(segments, rateCents)).toEqual(computeOrt(segments, rateCents));
  });

  it("geeft null i.p.v. te throwen bij een onbekende categorie (500-preventie)", () => {
    // JSON-geldig maar semantisch corrupt: passeert parseOrtSegments, maar computeOrt weigert het.
    const corrupt = [{ category: "BOGUS", hours: 4 }] as unknown as OrtSegment[];
    expect(() => computeOrt(corrupt, rateCents)).toThrow();
    expect(safeComputeOrt(corrupt, rateCents)).toBeNull();
  });

  it("geeft null i.p.v. te throwen bij negatieve uren", () => {
    const corrupt: OrtSegment[] = [{ category: "NORMAL", hours: -5 }];
    expect(() => computeOrt(corrupt, rateCents)).toThrow();
    expect(safeComputeOrt(corrupt, rateCents)).toBeNull();
  });

  it("geeft null bij een niet-integer uurtarief (motor weigert het)", () => {
    const segments: OrtSegment[] = [{ category: "NORMAL", hours: 8 }];
    expect(safeComputeOrt(segments, 50.5)).toBeNull();
  });

  // De beoordeel-drawer (`review-bodies.tsx`) en de werkproces-uitsplitsing
  // (`collaborations/ort-breakdown.tsx`) halen de OPGESLAGEN ORT-segmenten óók rechtstreeks door de
  // motor om de optionele uitsplitsing te tonen. Beide zijn read-oppervlakken: een corrupte rij mag
  // de drawer/pagina niet 500'en maar de uitsplitsing overslaan (result null → component rendert
  // niets). Deze cases spiegelen de exacte segment-vormen die die twee surfaces kunnen raken.
  it("geeft null bij een corrupt ORT-segment op een niet-NORMAL categorie (beoordeel-drawer)", () => {
    const corrupt = [
      { category: "NORMAL", hours: 4 },
      { category: "EVENING", hours: -2 },
    ] as unknown as OrtSegment[];
    expect(() => computeOrt(corrupt, rateCents)).toThrow();
    expect(safeComputeOrt(corrupt, rateCents)).toBeNull();
  });

  it("geeft null bij niet-eindige uren (werkproces-uitsplitsing)", () => {
    const corrupt = [
      { category: "NIGHT", hours: Number.POSITIVE_INFINITY },
    ] as unknown as OrtSegment[];
    expect(() => computeOrt(corrupt, rateCents)).toThrow();
    expect(safeComputeOrt(corrupt, rateCents)).toBeNull();
  });
});
