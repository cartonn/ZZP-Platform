// Opdrachtgever-tegenhanger van application-wait.ts: hoe lang laat de opdrachtgever kandidaten
// wachten op een beslissing? De ZZP'er ziet op /reacties al de versheid van de eigen reactie; de
// opdrachtgever krijgt geen signaal zodra een reeds-bekeken kandidaat (VIEWED/SHORTLIST) langer dan
// gebruikelijk blijft liggen. Concurrenten (Temper/Malt/Deel) belonen snelle opdrachtgevers en
// verliezen talent bij trage reacties; wij maken dat expliciet als next-action. Puur en
// deterministisch, geen schemawijziging — leunt volledig op de bestaande wachttijd-drempels.

import { summarizeApplicationWait, type ApplicationWaitInput } from "@/lib/application-wait";

export interface StaleApplicationsSummary {
  /** Aantal kandidaten dat al langer dan gebruikelijk op een beslissing wacht (VIEWED/SHORTLIST). */
  count: number;
  /** Dagen dat de langst-wachtende kandidaat al onbeslist ligt (≥ drempel). */
  oldestDays: number;
}

/**
 * Telt de reacties waarbij de OPDRACHTGEVER aan zet is en de kandidaat al langer dan gebruikelijk
 * wacht op een beslissing. Alleen VIEWED/SHORTLIST tellen mee: een NEW-reactie wordt al door de
 * "nieuwe reacties"-taak (`applicationsReviewTask`) gedekt, dus meetellen zou dubbelen. Geeft `null`
 * wanneer geen enkele kandidaat aandacht vraagt. Muteert de invoer niet; `now` wordt geïnjecteerd
 * zodat de leeftijd reproduceerbaar is.
 */
export function summarizeStaleClientApplications(
  inputs: readonly ApplicationWaitInput[],
  now: Date = new Date(),
): StaleApplicationsSummary | null {
  let count = 0;
  let oldestDays = 0;
  for (const input of inputs) {
    const wait = summarizeApplicationWait(input, now);
    if (wait?.attention && wait.stage !== "NEW") {
      count += 1;
      if (wait.daysWaiting > oldestDays) oldestDays = wait.daysWaiting;
    }
  }
  return count > 0 ? { count, oldestDays } : null;
}
