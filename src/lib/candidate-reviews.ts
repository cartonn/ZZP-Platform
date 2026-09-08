// Reputatie-rating per kandidaat voor het beslismoment op /kandidaten. Pure groepering:
// bundelt de PUBLISHED beoordelingen die opdrachtgevers over een ZZP'er achterlieten
// (richting CLIENT_ON_FREELANCER) per beoordeelde gebruiker en aggregeert ze tot één cijfer.
//
// Waarom pure + apart: de aggregatie (`aggregateReviews`) is al getest; deze laag voegt alleen
// deterministische groepering + de k-anonimiteitsvloer toe (geen I/O), zodat de data-fetcher dun
// blijft. Kandidaten onder de vloer (REVIEW_AGGREGATE_MIN_SAMPLE gepubliceerde beoordelingen)
// ontbreken in de Map — de kaart toont dan niets (geen herleidbaar cijfer, en geen "0,0 (0)" dat
// een nieuwkomer onterecht zwak laat lijken; het vertrouwensniveau draagt daar).

import { REVIEW_AGGREGATE_MIN_SAMPLE } from "@/lib/config";
import { aggregateReviews, type ReviewAggregate } from "@/lib/reviews";

/** Eén ruwe beoordelingsrij zoals uit de database: welke gebruiker beoordeeld werd + het cijfer. */
export interface CandidateReviewRow {
  subjectId: string;
  rating: number;
}

/**
 * Groepeer beoordelingsrijen per beoordeelde gebruiker (`subjectId`) en aggregeer elke groep tot
 * een `ReviewAggregate` (gemiddelde + aantal + verdeling). Alleen `subjectId`'s die in `subjectIds`
 * voorkomen én minstens één geldige beoordeling hebben, komen in de Map — de rest ontbreekt bewust.
 *
 * Pure functie: geen database, geen tijd. `subjectIds` bepaalt de scope (rijen voor onbekende
 * gebruikers worden genegeerd), zodat een gebatchte query nooit vreemde reputatie lekt.
 */
export function groupCandidateRatings(
  rows: CandidateReviewRow[],
  subjectIds: string[],
): Map<string, ReviewAggregate> {
  const scope = new Set(subjectIds);
  const bySubject = new Map<string, { rating: number }[]>();

  for (const row of rows) {
    if (!scope.has(row.subjectId)) continue;
    const bucket = bySubject.get(row.subjectId);
    if (bucket) bucket.push({ rating: row.rating });
    else bySubject.set(row.subjectId, [{ rating: row.rating }]);
  }

  const out = new Map<string, ReviewAggregate>();
  for (const [subjectId, ratingRows] of bySubject) {
    const aggregate = aggregateReviews(ratingRows);
    // k-anonimiteitsvloer (REVIEW_AGGREGATE_MIN_SAMPLE, security-review 8-9-2026): dit cijfer wordt
    // op /kandidaten aan een opdrachtgever getoond én voedt de kandidaat-ranking. Een "geaggregeerd"
    // cijfer over één (of twee) CLIENT_ON_FREELANCER-beoordeling(en) ís individueel herleidbaar (bij
    // twee kan één beoordelaar het exacte cijfer van de ander uit gemiddelde + aantal afleiden). Onder
    // de vloer laten we de kandidaat weg uit de Map — dezelfde codepad als "geen beoordelingen", dus
    // geen herleidbaar cijfer en geen ranking-invloed van één enkele opinie. Identieke vloer als de
    // spiegelfuncties `freelancerReputationFromReviews` en `companyReputationFromReviews`; de
    // afdwing-poort `review-aggregate-floor-coverage.test.ts` bewaakt dat elke consument dit toepast.
    if (aggregate.count >= REVIEW_AGGREGATE_MIN_SAMPLE) out.set(subjectId, aggregate);
  }
  return out;
}
