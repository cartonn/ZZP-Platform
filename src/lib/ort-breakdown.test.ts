import { describe, it, expect } from "vitest";
import { computeOrt, type OrtSegment } from "@/lib/ort";
import { summarizeOrtBreakdown, EMPTY_ORT_BREAKDOWN } from "@/lib/ort-breakdown";

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
