import "server-only";
import { prisma } from "@/lib/db";
import { companyReputationFromReviews } from "@/lib/company-reputation";
import { type ReviewAggregate } from "@/lib/reviews";

// Begrenzing: de query mag nooit onbegrensd zijn. Een opdrachtgever heeft in de praktijk beperkt
// veel beoordelingen; 4000 is ruim genoeg voor een representatief gemiddelde.
const MAX_ROWS = 4000;

/**
 * Publieke reputatie van een opdrachtgever (Company) zoals een reagerende ZZP'er die mag zien:
 * het geaggregeerde cijfer over de PUBLISHED FREELANCER_ON_CLIENT-beoordelingen die andere ZZP'ers
 * na een afgeronde samenwerking achterlieten. Alleen geaggregeerde statistiek (gemiddelde + aantal +
 * verdeling) verlaat deze laag — geen individuele beoordelingsdata (privacy by design).
 *
 * Alleen PUBLISHED telt mee: een nog-blinde PENDING_REVEAL-beoordeling mag niet lekken vóór de
 * simultane onthulling. `null` als de opdrachtgever nog geen gepubliceerde beoordeling heeft, of als
 * het bedrijf niet bestaat — dan tonen we niets.
 */
export async function getCompanyReputationForFreelancer(
  companyId: string,
): Promise<ReviewAggregate | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });
  if (company == null) return null;

  const rows = await prisma.review.findMany({
    where: {
      subjectId: company.userId,
      direction: "FREELANCER_ON_CLIENT",
      status: "PUBLISHED",
    },
    select: { rating: true },
    take: MAX_ROWS,
  });

  return companyReputationFromReviews(rows);
}
