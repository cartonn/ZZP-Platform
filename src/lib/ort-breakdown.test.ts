import { describe, it, expect } from "vitest";
import { computeOrt, type OrtSegment } from "@/lib/ort";
import {
  type OrtBreakdown,
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
