// Factuurvoorspelling — de conceptfactuur-uitkomst van een prestatie vóór goedkeuring.
// Server-side waarheid: spiegelt exact `planPerformanceApproved` (cascade/handlers.ts) via
// `computeVat(subtotaal, DEFAULT_VAT_REGIME)`. De getoonde preview is daardoor identiek aan de
// latere `Invoice.subtotalCents/vatCents/totalCents`. Pure functie, integer-centen, geen floats.
//
// Waarom een eigen helper i.p.v. `performanceSubtotalCents` (cascade) hergebruiken: die functie
// werpt bij onvolledige invoer (CascadeError) — correct in de mutatie-keten, maar een preview mag
// nooit een pagina laten crashen. Deze helper retourneert `null` bij invoer die het subtotaal niet
// bepaalt, zodat de presentatie simpelweg niets toont. De subtotaal-logica volgt exact dezelfde
// takken als de cascade (ORT-uren → basis + toeslagen · gewone uren → uren × tarief · oplevering →
// milestonebedrag); een regressietest bindt beide aan elkaar zodat ze niet kunnen wegdrijven.

import { computeVat, hourlySubtotalCents, type VatBreakdown } from "@/lib/administration/vat";
import { ortSubtotalCents, type OrtSegment } from "@/lib/ort";
import { type OrtCategory, DEFAULT_VAT_REGIME } from "@/lib/config";

export interface InvoicePreview {
  subtotalCents: number; //  excl. BTW
  vatCents: number; //       BTW-bedrag (0 bij een nul-tariefregime)
  vatRateBps: number; //     toegepast BTW-tarief in basispunten
  totalCents: number; //     subtotaal + BTW
}

/**
 * De conceptfactuur-uitkomst voor een gegeven subtotaal (excl. BTW). Canonieke bron voor elke
 * factuurvoorspelling in de UI: identiek aan wat de cascade bij goedkeuring vastlegt
 * (`computeVat` met het default-regime). Retourneert `null` bij een ongeldig subtotaal (geen throw,
 * zodat presentatie niets toont i.p.v. te crashen).
 */
export function computeInvoicePreview(subtotalCents: number): InvoicePreview | null {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) return null;
  const vat: VatBreakdown = computeVat(subtotalCents, DEFAULT_VAT_REGIME);
  return {
    subtotalCents: vat.subtotalCents,
    vatCents: vat.vatCents,
    vatRateBps: vat.vatRateBps,
    totalCents: vat.totalCents,
  };
}

export interface PerformancePreviewInput {
  type: string; //                            "HOURS" | "MILESTONE"
  hours?: number | null;
  rateCents?: number | null;
  amountCents?: number | null;
  ortSegments?: readonly OrtSegment[] | null;
  /** Definitieve (resolved) ORT-tarieven; laat weg om de standaardtarieven te gebruiken. */
  ortRates?: Record<OrtCategory, number>;
}

/**
 * Berekent de factuurvoorspelling voor een prestatie in de vorm waarin de UI hem toont. Spiegelt
 * `performanceSubtotalCents` (cascade/handlers.ts): ORT-uren → basis + toeslagen · gewone uren →
 * uren × tarief · oplevering → milestonebedrag. Retourneert `null` als de invoer het subtotaal niet
 * bepaalt (ontbrekend tarief/uren/bedrag), zodat de presentatie niets toont.
 */
export function previewPerformanceInvoice(input: PerformancePreviewInput): InvoicePreview | null {
  const subtotal = performancePreviewSubtotalCents(input);
  return subtotal == null ? null : computeInvoicePreview(subtotal);
}

function performancePreviewSubtotalCents(input: PerformancePreviewInput): number | null {
  if (input.type === "HOURS") {
    if (input.rateCents == null || !Number.isInteger(input.rateCents) || input.rateCents < 0) {
      return null;
    }
    if (input.ortSegments && input.ortSegments.length > 0) {
      try {
        return ortSubtotalCents(input.ortSegments, input.rateCents, input.ortRates);
      } catch {
        return null; // onbekende categorie / ongeldige uren → geen preview
      }
    }
    if (input.hours == null || !Number.isFinite(input.hours) || input.hours < 0) return null;
    return hourlySubtotalCents(input.hours, input.rateCents);
  }
  // MILESTONE / oplevering
  if (input.amountCents == null || !Number.isInteger(input.amountCents) || input.amountCents < 0) {
    return null;
  }
  return input.amountCents;
}
