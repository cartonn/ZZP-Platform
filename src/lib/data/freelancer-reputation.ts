import "server-only";
import { prisma } from "@/lib/db";
import { freelancerReputationFromReviews } from "@/lib/freelancer-reputation";
import { type ReviewAggregate } from "@/lib/reviews";

// Begrenzing: de query mag nooit onbegrensd zijn. Een ZZP'er heeft in de praktijk beperkt veel
// beoordelingen; 4000 is ruim genoeg voor een representatief gemiddelde. Spiegelt data/company-reputation.ts.
const MAX_ROWS = 4000;

/**
 * Publieke reputatie van een ZZP'er zoals die op het deelbare vertrouwensdossier getoond mag worden:
 * het geaggregeerde cijfer over de PUBLISHED CLIENT_ON_FREELANCER-beoordelingen die opdrachtgevers na
 * een afgeronde samenwerking achterlieten. Alleen geaggregeerde statistiek (gemiddelde + aantal +
 * verdeling) verlaat deze laag — geen individuele beoordelingsdata (privacy by design).
 *
 * Alleen PUBLISHED telt mee: een nog-blinde PENDING_REVEAL-beoordeling mag niet lekken vóór de
 * simultane onthulling. `subjectId` is de `User.id` van de ZZP'er (de beoordeelde tegenpartij).
 * `null` als de ZZP'er nog geen gepubliceerde beoordeling heeft — dan tonen we niets.
 */
export async function getFreelancerReputation(userId: string): Promise<ReviewAggregate | null> {
  const rows = await prisma.review.findMany({
    where: {
      subjectId: userId,
      direction: "CLIENT_ON_FREELANCER",
      status: "PUBLISHED",
    },
    select: { rating: true },
    take: MAX_ROWS,
  });

  return freelancerReputationFromReviews(rows);
}
