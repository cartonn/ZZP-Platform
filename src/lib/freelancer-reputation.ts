// Publieke ZZP'er-reputatie voor het deelbare vertrouwensdossier (`/vertrouwen/[profileId]/[token]`).
// Pure aggregatie: bundelt de PUBLISHED beoordelingen die opdrachtgevers over een ZZP'er achterlieten
// (richting CLIENT_ON_FREELANCER) tot één cijfer. Spiegelbeeld van company-reputation.ts (de reputatie
// die ZZP'ers over opdrachtgevers zien op de opdracht-detailpagina) en candidate-reviews.ts (de reputatie
// die opdrachtgevers over ZZP'ers zien op /kandidaten).
//
// Waarom pure + apart: `aggregateReviews` is al getest; deze laag voegt alleen de null-gating toe
// (geen gepubliceerde beoordeling => niets tonen i.p.v. een misleidende "0,0 (0)"), zodat de
// data-fetcher dun blijft en de beslisregel testbaar is zonder database.

import { REVIEW_AGGREGATE_MIN_SAMPLE } from "@/lib/config";
import { aggregateReviews, type ReviewAggregate } from "@/lib/reviews";

/**
 * Aggregeer de ruwe beoordelingsrijen (alleen het `rating`-veld nodig) tot één reputatiecijfer,
 * of `null` als er te weinig geldige beoordelingen zijn. `aggregateReviews` negeert cijfers buiten
 * 1..5; een set die daardoor onder de drempel uitkomt hoort niet als reputatie getoond te worden.
 *
 * k-anonimiteitsvloer (REVIEW_AGGREGATE_MIN_SAMPLE, security-review 6-9-2026): dit cijfer verlaat de
 * laag richting het PUBLIEKE, deelbare vertrouwensdossier. Een "geaggregeerd" cijfer over één (of
 * twee) beoordeling(en) is individueel herleidbaar — bij twee kan een beoordelaar het exacte cijfer
 * van de ander uit gemiddelde + aantal afleiden. Onder de vloer tonen we daarom niets i.p.v. een
 * herleidbaar cijfer. Een nieuwkomer zonder (genoeg) beoordelingen mag bovendien niet onterecht zwak
 * lijken — het vertrouwensniveau draagt die signalering.
 */
export function freelancerReputationFromReviews(
  rows: { rating: number }[],
): ReviewAggregate | null {
  const aggregate = aggregateReviews(rows);
  return aggregate.count >= REVIEW_AGGREGATE_MIN_SAMPLE ? aggregate : null;
}
