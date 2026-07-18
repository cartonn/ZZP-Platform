// Reactiereputatie-spiegel voor de opdrachtgever. Hetzelfde reactiebereidheid-signaal dat ZZP'ers
// over een opdrachtgever zien (`client-responsiveness.ts` — "Pakt reacties op" / "Laat reacties
// liggen") — nu terug naar de opdrachtgever zelf, als zelfverbeter-nudge. Reacties snel oppakken is
// een vertrouwenssignaal dat sterke vakmensen betrokken houdt; een opdrachtgever die zijn eigen
// reactiereputatie ziet, kan die verbeteren. Spiegelt `client-payment-reputation.ts` één-op-één.
//
// Puur en deterministisch (geschikt voor unit-tests zonder DB). Geen schema-wijziging, geen
// individuele reactie van een andere ZZP'er — enkel het reeds geaggregeerde `ClientResponsiveness`.

import { type ClientResponsiveness, type ResponsivenessTone } from "@/lib/client-responsiveness";

export interface ResponsivenessReputation {
  tone: ResponsivenessTone;
  /** Korte kop die het oordeel samenvat, vanuit het perspectief van de opdrachtgever. */
  headline: string;
  /** Concrete, sturende tip om de reactiereputatie te verbeteren of te behouden. */
  tip: string;
  /** Of er genoeg reactie-historie is om cijfers (opgepakt%/openstaand) te tonen. */
  hasStats: boolean;
}

/**
 * Vertaalt het geaggregeerde reactiebereidheid-signaal naar een zelf-gerichte reputatie-boodschap.
 * De cijfers (`handledPct`, `pending`, `oldestPendingDays`, `stalePending`) blijven in de invoer;
 * hier bepalen we alleen de kop + tip die de opdrachtgever aanzet tot reacties snel oppakken.
 */
export function summarizeResponsivenessReputation(
  responsiveness: ClientResponsiveness,
): ResponsivenessReputation {
  const { tone } = responsiveness;
  const hasStats = tone !== "unknown";

  switch (tone) {
    case "good":
      return {
        tone,
        headline: "Vakmensen zien dat je reacties snel oppakt",
        tip: "Zo houden: bekijk en beslis reacties snel, dan blijven sterke vakmensen betrokken.",
        hasStats,
      };
    case "neutral":
      return {
        tone,
        headline: "Je pakt reacties redelijk op",
        tip: "Bekijk en beslis reacties binnen een paar dagen — snelle opvolging houdt sterke vakmensen betrokken.",
        hasStats,
      };
    case "warning":
      return {
        tone,
        headline: "ZZP'ers zien dat je reacties vaak laat liggen",
        tip: "Reacties die blijven liggen kosten je sterke kandidaten. Bekijk en beslis openstaande reacties om je reputatie te herstellen.",
        hasStats,
      };
    case "unknown":
    default:
      return {
        tone: "unknown",
        headline: "Nog geen reactiereputatie",
        tip: "Pak binnenkomende reacties snel op — ZZP'ers wegen mee hoe snel een opdrachtgever reageert voordat ze op je opdracht reageren.",
        hasStats: false,
      };
  }
}
