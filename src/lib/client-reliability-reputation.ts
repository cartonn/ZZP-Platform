// Betrouwbaarheidsreputatie-spiegel voor de opdrachtgever. Hetzelfde annuleringsbetrouwbaarheid-
// signaal dat ZZP'ers over een opdrachtgever zien (`client-reliability.ts` — hoe vaak hij agreed werk
// annuleert, en hoe vaak last-minute) — nu terug naar de opdrachtgever zelf, als zelfverbeter-nudge.
// Afspraken nakomen is een vertrouwenssignaal dat sterke vakmensen doet toezeggen; een opdrachtgever
// die zijn eigen annuleringsreputatie ziet, kan die verbeteren. Spiegelt `client-payment-reputation.ts`
// en `client-responsiveness-reputation.ts` één-op-één.
//
// Puur en deterministisch (geschikt voor unit-tests zonder DB). Geen schema-wijziging, geen
// individuele samenwerkingsdata — enkel het reeds geaggregeerde `ClientReliability`.

import { type ClientReliability, type ReliabilityTone } from "@/lib/client-reliability";

export interface ReliabilityReputation {
  tone: ReliabilityTone;
  /** Korte kop die het oordeel samenvat, vanuit het perspectief van de opdrachtgever. */
  headline: string;
  /** Concrete, sturende tip om de reputatie te verbeteren of te behouden. */
  tip: string;
  /** Of er genoeg afgewikkelde toezeggingen zijn om cijfers (annuleringen/percentage) te tonen. */
  hasStats: boolean;
}

/**
 * Vertaalt het geaggregeerde annuleringsbetrouwbaarheid-signaal naar een zelf-gerichte reputatie-
 * boodschap. De cijfers (`cancelRate`, `cancellations`, `lastMinute`, `sampleSize`) blijven in de
 * invoer; hier bepalen we alleen de kop + tip die de opdrachtgever aanzet tot afspraken nakomen.
 */
export function summarizeReliabilityReputation(
  reliability: ClientReliability,
): ReliabilityReputation {
  const { tone } = reliability;
  const hasStats = tone !== "unknown";

  switch (tone) {
    case "good":
      return {
        tone,
        headline: "Vakmensen zien je als betrouwbaar in afspraken",
        tip: "Zo houden: kom toezeggingen na en annuleer niet, dan blijf je aantrekkelijk voor ZZP'ers.",
        hasStats,
      };
    case "neutral":
      return {
        tone,
        headline: "Je komt afspraken meestal na",
        tip: "Annuleer een toegezegde samenwerking zo min mogelijk — betrouwbaarheid trekt sneller sterke vakmensen aan.",
        hasStats,
      };
    case "warning":
      return {
        tone,
        headline: "ZZP'ers zien dat je afspraken vaak annuleert",
        tip: "Geannuleerde toezeggingen — zeker last-minute — kosten je sterke vakmensen. Kom afspraken na om je reputatie te herstellen.",
        hasStats,
      };
    case "unknown":
    default:
      return {
        tone: "unknown",
        headline: "Nog geen betrouwbaarheidsreputatie",
        tip: "Kom je eerste toezeggingen na — ZZP'ers wegen mee hoe vaak een opdrachtgever annuleert voordat ze toezeggen.",
        hasStats: false,
      };
  }
}
