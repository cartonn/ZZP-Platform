// Portefeuille-brede betaaltermijn (DSO) voor de ZZP'er: hoe snel worden zíjn facturen gemiddeld
// betaald, over álle opdrachtgevers heen — het retrospectieve tegenhanger van de cashflow-vooruitblik
// en de per-opdrachtgever betaalreputatie. Beantwoordt op /facturen de kern-administratievraag in één
// getal: "hoe lang duurt het gemiddeld voordat ik mijn geld heb, en betaalt men mij op tijd?"
// (benchmark: Moneybird/e-Boekhouden tonen de gemiddelde betaaltermijn prominent).
//
// Puur en deterministisch, geen I/O, geen schemawijziging. De rekenkern is exact
// `computePaymentBehavior` — dezelfde bron van waarheid als de per-opdrachtgever-kaart, alleen
// toegepast op de eigen paid-facturen. Dit bestand voegt daar uitsluitend de eigen-perspectief-
// framing (vergelijking met de standaard betaaltermijn) en presentatie aan toe.

import {
  computePaymentBehavior,
  PAYMENT_MIN_SAMPLE_SIZE,
  type PaymentRow,
} from "@/lib/payment-behavior";

/** Standaard betaaltermijn in Nederland waartegen we de eigen gemiddelde betaaltermijn afzetten. */
export const STANDARD_PAYMENT_TERM_DAYS = 30;

/**
 * Marge (dagen) rond de standaardtermijn waarbinnen we "rond de standaardtermijn" tonen i.p.v. sneller/
 * langzamer. Voorkomt schijnprecisie bij een verschil van een paar dagen.
 */
const AROUND_MARGIN_DAYS = 3;

/** Hoe de eigen gemiddelde betaaltermijn zich verhoudt tot de standaard betaaltermijn (30 dagen). */
export type PaymentTermComparison = "faster" | "around" | "slower";

export interface OwnPaymentTiming {
  /** Aantal betaalde facturen dat het signaal voedt (≥ PAYMENT_MIN_SAMPLE_SIZE). */
  sampleSize: number;
  /** Gemiddeld aantal dagen van factuurdatum tot betaling. */
  avgDaysToPay: number;
  /** Percentage facturen dat op of vóór de vervaldatum is betaald; null als niet te berekenen. */
  onTimePct: number | null;
  /** Vergelijking van avgDaysToPay met de standaard betaaltermijn (30 dagen). */
  vsStandard: PaymentTermComparison;
  /** Emfase voor de UI: good (snel/op tijd) | neutral | warning (traag/vaak te laat). */
  tone: "good" | "neutral" | "warning";
}

/**
 * Vat de betaal-track-record van de ZZP'er samen uit zijn eigen betaalde facturen (alle opdrachtgevers).
 *
 * Geeft `null` terug zodra er te weinig betaalde facturen zijn (< `PAYMENT_MIN_SAMPLE_SIZE`) of de
 * gemiddelde betaaltermijn niet te berekenen is (geen enkele rij met een bruikbaar factuurdatum-anker) —
 * dan toont de UI niets, zodat er nooit een misleidend getal uit één factuur pronkt. `now` is niet nodig
 * (puur retrospectief over reeds betaalde facturen), maar `rows` bevat alleen betaalde facturen die de
 * caller aanlevert (paidAt = Invoice.updatedAt bij status PAID — zie payment-behavior.ts).
 */
export function summarizeOwnPaymentTiming(rows: PaymentRow[]): OwnPaymentTiming | null {
  const behavior = computePaymentBehavior(rows);
  if (behavior.sampleSize < PAYMENT_MIN_SAMPLE_SIZE) return null;
  if (behavior.avgDaysToPay == null) return null;
  if (behavior.tone === "unknown") return null;

  const avgDaysToPay = behavior.avgDaysToPay;
  const delta = avgDaysToPay - STANDARD_PAYMENT_TERM_DAYS;
  const vsStandard: PaymentTermComparison =
    delta < -AROUND_MARGIN_DAYS ? "faster" : delta > AROUND_MARGIN_DAYS ? "slower" : "around";

  return {
    sampleSize: behavior.sampleSize,
    avgDaysToPay,
    onTimePct: behavior.onTimePct,
    vsStandard,
    tone: behavior.tone,
  };
}
