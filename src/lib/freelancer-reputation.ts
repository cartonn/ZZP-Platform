// Publieke ZZP'er-reputatie voor het deelbare vertrouwensdossier (`/vertrouwen/[profileId]/[token]`).
// Pure aggregatie: bundelt de PUBLISHED beoordelingen die opdrachtgevers over een ZZP'er achterlieten
// (richting CLIENT_ON_FREELANCER) tot één cijfer. Spiegelbeeld van company-reputation.ts (de reputatie
// die ZZP'ers over opdrachtgevers zien op de opdracht-detailpagina) en candidate-reviews.ts (de reputatie
// die opdrachtgevers over ZZP'ers zien op /kandidaten).
//
// Waarom pure + apart: `aggregateReviews` is al getest; deze laag voegt alleen de null-gating toe
// (geen gepubliceerde beoordeling => niets tonen i.p.v. een misleidende "0,0 (0)"), zodat de
// data-fetcher dun blijft en de beslisregel testbaar is zonder database.

import { aggregateReviews, type ReviewAggregate } from "@/lib/reviews";

/**
 * Aggregeer de ruwe beoordelingsrijen (alleen het `rating`-veld nodig) tot één reputatiecijfer,
 * of `null` als er geen enkele geldige beoordeling is. `aggregateReviews` negeert cijfers buiten
 * 1..5; een set die daardoor op count 0 uitkomt hoort niet als reputatie getoond te worden — een
 * nieuwkomer zonder beoordelingen mag niet onterecht zwak lijken (het vertrouwensniveau draagt daar).
 */
export function freelancerReputationFromReviews(
  rows: { rating: number }[],
): ReviewAggregate | null {
  const aggregate = aggregateReviews(rows);
  return aggregate.count > 0 ? aggregate : null;
}
