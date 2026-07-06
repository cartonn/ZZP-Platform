// Betaalreputatie-spiegel voor de opdrachtgever. Dezelfde betaalgedrag-cijfers die ZZP'ers
// over een opdrachtgever zien (payment-behavior.ts) — nu terug naar de opdrachtgever zelf,
// als zelfverbeter-nudge. Op tijd betalen is een vertrouwenssignaal dat vakmensen sneller
// doet reageren; een opdrachtgever die zijn eigen reputatie ziet, kan die verbeteren.
//
// Puur en deterministisch (geschikt voor unit-tests zonder DB). Geen schema-wijziging, geen
// individuele factuurdata — enkel de reeds geaggregeerde `PaymentBehavior`.

import { type PaymentBehavior, type PaymentTone } from "@/lib/payment-behavior";

export interface PaymentReputation {
  tone: PaymentTone;
  /** Korte kop die het oordeel samenvat, vanuit het perspectief van de opdrachtgever. */
  headline: string;
  /** Concrete, sturende tip om de reputatie te verbeteren of te behouden. */
  tip: string;
  /** Of er genoeg betaalhistorie is om cijfers (betaaltijd/op-tijd) te tonen. */
  hasStats: boolean;
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
