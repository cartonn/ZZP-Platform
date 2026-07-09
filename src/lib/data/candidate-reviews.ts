// Server-side gebatchte reputatie-rating voor de reagerende ZZP'ers op /kandidaten. Read-only.
// Spiegelt de publieke reputatie-query van het ZZP-profiel: alleen PUBLISHED beoordelingen in de
// richting CLIENT_ON_FREELANCER tellen mee (een nog-blinde PENDING_REVEAL-beoordeling mag niet
// lekken vóór de simultane onthulling). Eén query over alle kandidaten samen (geen N+1).

import { prisma } from "@/lib/db";
import { groupCandidateRatings } from "@/lib/candidate-reviews";
import { type ReviewAggregate } from "@/lib/reviews";

// Begrenzingen: een kandidatenlijst is doorgaans klein, maar de query mag nooit onbegrensd zijn.
const MAX_SUBJECTS = 200;
const MAX_ROWS = 4000;

/**
 * Bereken per beoordeelde gebruiker (`subjectId` = de user-id van de ZZP'er) de aggregatie van
 * gepubliceerde opdrachtgever-beoordelingen, in één gebatchte query. Kandidaten zonder gepubliceerde
 * beoordeling ontbreken in de Map.
 */
export async function getReviewRatingsForCandidates(
  freelancerUserIds: string[],
): Promise<Map<string, ReviewAggregate>> {
  const unique = [...new Set(freelancerUserIds)].slice(0, MAX_SUBJECTS);
  if (unique.length === 0) return new Map();

  const rows = await prisma.review.findMany({
    where: {
      subjectId: { in: unique },
      direction: "CLIENT_ON_FREELANCER",
      status: "PUBLISHED",
    },
    select: { subjectId: true, rating: true },
    take: MAX_ROWS,
  });

  return groupCandidateRatings(rows, unique);
}
