import { describe, expect, it } from "vitest";
import {
  computeInvoicePreview,
  previewPerformanceInvoice,
} from "@/lib/performance-invoice-preview";
import { performanceSubtotalCents } from "@/lib/cascade/handlers";
import { computeVat } from "@/lib/administration/vat";
import { DEFAULT_VAT_REGIME, VAT_RATE_BPS } from "@/lib/config";
import { resolveOrtRates, type OrtSegment } from "@/lib/ort";

// De factuurvoorspelling MOET exact gelijk zijn aan wat de cascade bij goedkeuring vastlegt
// (planPerformanceApproved → computeVat(performanceSubtotalCents(...), DEFAULT_VAT_REGIME)).
// Deze parity-poort bindt de preview aan de cascade-bron zodat ze niet kunnen wegdrijven.
function cascadeTruth(perf: {
  type: string;
  hours?: number | null;
  rateCents?: number | null;
  amountCents?: number | null;
  ortSegments?: OrtSegment[] | null;
  ortRates?: Record<string, number> | null;
}) {
  const subtotal = performanceSubtotalCents({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(perf as any),
    id: "p1",
    status: "SUBMITTED",
    collaborationId: "c1",
  });
  return computeVat(subtotal, DEFAULT_VAT_REGIME);
}

describe("computeInvoicePreview", () => {
  it("past het default-factuurregime toe (BTW-tarief == VAT_RATE_BPS[DEFAULT_VAT_REGIME])", () => {
    const p = computeInvoicePreview(100_00);
    expect(p).not.toBeNull();
    expect(p!.vatRateBps).toBe(VAT_RATE_BPS[DEFAULT_VAT_REGIME]);
    // STANDARD_HIGH = 21%
    expect(p!.subtotalCents).toBe(100_00);
    expect(p!.vatCents).toBe(21_00);
    expect(p!.totalCents).toBe(121_00);
  });

  it("rondt de BTW commercieel af (halve cent omhoog), identiek aan computeVat", () => {
    // 47,74 excl. → 21% = 1002,54 cent → 1003 (Math.round)
    const p = computeInvoicePreview(47_74)!;
    expect(p.vatCents).toBe(10_03);
    expect(p.totalCents).toBe(57_77);
    expect(p).toEqual({
      subtotalCents: 47_74,
      vatCents: computeVat(47_74, DEFAULT_VAT_REGIME).vatCents,
      vatRateBps: VAT_RATE_BPS[DEFAULT_VAT_REGIME],
      totalCents: computeVat(47_74, DEFAULT_VAT_REGIME).totalCents,
    });
  });

  it("weigert een ongeldig subtotaal → null (geen throw)", () => {
    expect(computeInvoicePreview(-1)).toBeNull();
    expect(computeInvoicePreview(1.5)).toBeNull();
    expect(computeInvoicePreview(Number.NaN)).toBeNull();
  });

  it("een nul-subtotaal geeft een geldige nul-factuur", () => {
    expect(computeInvoicePreview(0)).toEqual({
      subtotalCents: 0,
      vatCents: 0,
      vatRateBps: VAT_RATE_BPS[DEFAULT_VAT_REGIME],
      totalCents: 0,
    });
  });
});

describe("previewPerformanceInvoice — pariteit met de cascade", () => {
  it("gewone uren (uren × tarief) == cascade", () => {
    const perf = { type: "HOURS" as const, hours: 7.25, rateCents: 40_00 };
    const preview = previewPerformanceInvoice(perf)!;
    const truth = cascadeTruth(perf);
    expect(preview.subtotalCents).toBe(290_00); // 7,25 × €40
    expect(preview.subtotalCents).toBe(truth.subtotalCents);
    expect(preview.vatCents).toBe(truth.vatCents);
    expect(preview.totalCents).toBe(truth.totalCents);
  });

  it("ORT-uren (basis + toeslagen) == cascade", () => {
    const ortSegments: OrtSegment[] = [
      { category: "NORMAL", hours: 6 },
      { category: "NIGHT", hours: 2 },
    ];
    const ortRates = resolveOrtRates({ ortProfile: null, ortCustomRates: null });
    const perf = { type: "HOURS" as const, rateCents: 30_00, ortSegments, ortRates };
    const preview = previewPerformanceInvoice(perf)!;
    const truth = cascadeTruth(perf);
    expect(preview.subtotalCents).toBe(truth.subtotalCents);
    expect(preview.vatCents).toBe(truth.vatCents);
    expect(preview.totalCents).toBe(truth.totalCents);
    // ORT verhoogt het subtotaal boven het kale uren × tarief.
    expect(preview.subtotalCents).toBeGreaterThan(8 * 30_00);
  });

  it("oplevering (milestonebedrag) == cascade", () => {
    const perf = { type: "MILESTONE" as const, amountCents: 1234_56 };
    const preview = previewPerformanceInvoice(perf)!;
    const truth = cascadeTruth(perf);
    expect(preview.subtotalCents).toBe(1234_56);
    expect(preview.subtotalCents).toBe(truth.subtotalCents);
    expect(preview.vatCents).toBe(truth.vatCents);
    expect(preview.totalCents).toBe(truth.totalCents);
  });
});

describe("previewPerformanceInvoice — onvolledige/ongeldige invoer → null", () => {
  it("uren zonder tarief", () => {
    expect(previewPerformanceInvoice({ type: "HOURS", hours: 8, rateCents: null })).toBeNull();
  });

  it("uren zonder uren en zonder segmenten", () => {
    expect(previewPerformanceInvoice({ type: "HOURS", hours: null, rateCents: 30_00 })).toBeNull();
  });

  it("negatieve/niet-integere invoer", () => {
    expect(previewPerformanceInvoice({ type: "HOURS", hours: -1, rateCents: 30_00 })).toBeNull();
    expect(previewPerformanceInvoice({ type: "HOURS", hours: 8, rateCents: 30_50.5 })).toBeNull();
  });

  it("oplevering zonder bedrag", () => {
    expect(previewPerformanceInvoice({ type: "MILESTONE", amountCents: null })).toBeNull();
    expect(previewPerformanceInvoice({ type: "MILESTONE", amountCents: -5 })).toBeNull();
  });
});
