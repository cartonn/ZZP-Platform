// Eerste-reactie-SLA voor de opdrachtgever: hoe lang laat hij een NÓG-onbekeken kandidaat (NEW)
// wachten op een eerste blik? De opdrachtgever ziet vandaag alleen een leeftijdloze telling ("X nieuwe
// reacties", `applicationsReviewTask`); een reactie die al dagen onbekeken ligt valt daardoor niet op.
// De ghosting-risicodrempel die de trechter op /inzicht al gebruikt (`awaitingFirstLookAtRisk`) wordt
// hier hergebruikt zodat één en dezelfde grens de BI én de next-action voedt — geen drift.
//
// Verschil met stale-applications.ts: dat dekt de REEDS-bekeken kandidaten (VIEWED/SHORTLIST) die op
// een beslissing wachten. Dit dekt de fase daarvoor: NEW-reacties die nog geen eerste blik kregen. De
// twee vensters raken elkaar niet (verschillende statussen), dus geen dubbele next-action.
//
// Puur en deterministisch, geen schemawijziging — afgeleid uit de onveranderlijke `Application.createdAt`.

import { ageInDays, CANDIDATE_GHOSTING_RISK_DAYS } from "@/lib/client-application-funnel";

export interface FirstLookInput {
  /** Aanmaakmoment van de NEW-reactie (onveranderlijk). */
  createdAt: Date;
}

export interface FirstLookOverdueSummary {
  /** Aantal NEW-reacties dat de ghosting-risicodrempel bereikte zonder eerste blik. */
  count: number;
  /** Dagen dat de langst-wachtende onbekeken reactie al ligt (≥ drempel). */
  oldestDays: number;
}

/**
 * Telt de NEW-reacties waarbij de opdrachtgever nog geen eerste blik gaf en de kandidaat al minstens
 * `CANDIDATE_GHOSTING_RISK_DAYS` hele dagen wacht — het punt waarop de kandidaat dreigt af te haken.
 * Geeft `null` wanneer geen enkele onbekeken reactie de drempel bereikt. Muteert de invoer niet; `now`
 * wordt geïnjecteerd zodat de leeftijd reproduceerbaar is. Een `createdAt` in de toekomst (data-ruis)
 * levert 0 dagen via `ageInDays`, nooit een misleidend negatief getal.
 */
export function summarizeFirstLookOverdue(
  inputs: readonly FirstLookInput[],
  now: Date = new Date(),
): FirstLookOverdueSummary | null {
  let count = 0;
  let oldestDays = 0;
  for (const input of inputs) {
    const age = ageInDays(input.createdAt, now);
    if (age != null && age >= CANDIDATE_GHOSTING_RISK_DAYS) {
      count += 1;
      if (age > oldestDays) oldestDays = age;
    }
  }
  return count > 0 ? { count, oldestDays } : null;
}
