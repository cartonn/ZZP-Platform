// Betaalreputatie-spiegel voor de opdrachtgever. Dezelfde betaalgedrag-cijfers die ZZP'ers
// over een opdrachtgever zien (payment-behavior.ts) — nu terug naar de opdrachtgever zelf,
// als zelfverbeter-nudge. Op tijd betalen is een vertrouwenssignaal dat vakmensen sneller
// doet reageren; een opdrachtgever die zijn eigen reputatie ziet, kan die verbeteren.
//
// Puur en deterministisch (geschikt voor unit-tests zonder DB). Geen schema-wijziging, geen
// individuele factuurdata — enkel de reeds geaggregeerde `PaymentBehavior`.

import { type PaymentBehavior, type PaymentTone } from "@/lib/payment-behavior";
import {
  classifyPaymentTermVsStandard,
  STANDARD_PAYMENT_TERM_DAYS,
  type PaymentTermComparison,
} from "@/lib/own-payment-timing";

export interface PaymentReputation {
  tone: PaymentTone;
  /** Korte kop die het oordeel samenvat, vanuit het perspectief van de opdrachtgever. */
  headline: string;
  /** Concrete, sturende tip om de reputatie te verbeteren of te behouden. */
  tip: string;
  /** Of er genoeg betaalhistorie is om cijfers (betaaltijd/op-tijd) te tonen. */
  hasStats: boolean;
}

export interface PaymentTermBenchmark {
  /** Sneller/rond/langzamer dan de standaard betaaltermijn (30 dagen). */
  comparison: PaymentTermComparison;
  /** Gemiddelde betaaltermijn van de opdrachtgever (dagen). */
  avgDaysToPay: number;
  /** De referentietermijn waartegen vergeleken wordt (30 dagen). */
  standardDays: number;
  /** Absoluut verschil in dagen t.o.v. de standaardtermijn (≥ 0). */
  deltaDays: number;
  /** Eén concrete vergelijkingszin voor de opdrachtgever. */
  sentence: string;
}

/**
 * Zet de gemiddelde betaaltijd van de opdrachtgever af tegen de standaard betaaltermijn (30 dagen) —
 * dezelfde benchmark en sneller/rond/langzamer-classificatie als de ZZP'er-kant
 * (`own-payment-timing.ts`), zodat beide perspectieven op dezelfde grens rusten. Geeft `null` wanneer
 * er geen bruikbaar gemiddelde is (te weinig historie / `unknown`); dan toont de kaart geen benchmark.
 * Puur en deterministisch (geen I/O).
 */
export function paymentTermBenchmark(behavior: PaymentBehavior): PaymentTermBenchmark | null {
  if (behavior.tone === "unknown") return null;
  if (behavior.avgDaysToPay == null) return null;

  const avgDaysToPay = behavior.avgDaysToPay;
  const comparison = classifyPaymentTermVsStandard(avgDaysToPay);
  // `faster`/`slower` gelden alleen buiten de ±3-dagen-marge, dus het verschil is er altijd ≥ 4 dagen
  // (meervoud). De `around`-zin noemt geen verschil. Daarom volstaat "dagen" overal.
  const deltaDays = Math.abs(avgDaysToPay - STANDARD_PAYMENT_TERM_DAYS);

  const sentence =
    comparison === "faster"
      ? `Je betaalt gemiddeld ${deltaDays} dagen sneller dan de standaard betaaltermijn van ${STANDARD_PAYMENT_TERM_DAYS} dagen — dat maakt je aantrekkelijk voor vakmensen.`
      : comparison === "slower"
        ? `Je betaalt gemiddeld ${deltaDays} dagen langzamer dan de standaard betaaltermijn van ${STANDARD_PAYMENT_TERM_DAYS} dagen — sneller betalen trekt vakmensen aan.`
        : `Je betaalt rond de standaard betaaltermijn van ${STANDARD_PAYMENT_TERM_DAYS} dagen.`;

  return {
    comparison,
    avgDaysToPay,
    standardDays: STANDARD_PAYMENT_TERM_DAYS,
    deltaDays,
    sentence,
  };
}

/**
 * Vertaalt het geaggregeerde betaalgedrag naar een zelf-gerichte reputatie-boodschap.
 * De cijfers (`avgDaysToPay`, `onTimePct`, `sampleSize`) blijven in de invoer; hier bepalen
 * we alleen de kop + tip die de opdrachtgever aanzet tot op-tijd betalen.
 */
export function summarizePaymentReputation(behavior: PaymentBehavior): PaymentReputation {
  const { tone } = behavior;
  const hasStats = tone !== "unknown";

  switch (tone) {
    case "good":
      return {
        tone,
        headline: "Vakmensen zien je als een betrouwbare betaler",
        tip: "Zo houden: betaal facturen op of vóór de vervaldatum, dan blijf je aantrekkelijk voor ZZP'ers.",
        hasStats,
      };
    case "neutral":
      return {
        tone,
        headline: "Je betaalt redelijk op tijd",
        tip: "Betaal binnen 14 dagen of vóór de vervaldatum om als betrouwbaar te tonen — dat trekt sneller vakmensen aan.",
        hasStats,
      };
    case "warning":
      return {
        tone,
        headline: "ZZP'ers zien dat je vaak laat betaalt",
        tip: "Laat betalen drukt je reacties. Betaal openstaande facturen vóór de vervaldatum om je reputatie te herstellen.",
        hasStats,
      };
    case "unknown":
    default:
      return {
        tone: "unknown",
        headline: "Nog geen betaalreputatie",
        tip: "Betaal je eerste facturen op of vóór de vervaldatum — ZZP'ers wegen je betaalgedrag mee voordat ze op je opdracht reageren.",
        hasStats: false,
      };
  }
}
