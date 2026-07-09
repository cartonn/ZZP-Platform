// Reputatie-rating per kandidaat voor het beslismoment op /kandidaten. Pure groepering:
// bundelt de PUBLISHED beoordelingen die opdrachtgevers over een ZZP'er achterlieten
// (richting CLIENT_ON_FREELANCER) per beoordeelde gebruiker en aggregeert ze tot één cijfer.
//
// Waarom pure + apart: de aggregatie (`aggregateReviews`) is al getest; deze laag voegt alleen
// deterministische groepering toe (geen I/O), zodat de data-fetcher dun blijft. Kandidaten
// zonder gepubliceerde beoordeling ontbreken in de Map — de kaart toont dan niets (geen "0,0
// (0)" dat een nieuwkomer onterecht zwak laat lijken; het vertrouwensniveau draagt daar).

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
    // `aggregateReviews` negeert cijfers buiten 1..5; een groep die daardoor op count 0 uitkomt,
    // hoort niet als reputatie getoond te worden.
    if (aggregate.count > 0) out.set(subjectId, aggregate);
  }
  return out;
}
