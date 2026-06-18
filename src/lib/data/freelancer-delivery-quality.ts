// Server-side leverbetrouwbaarheid van ZZP'ers per freelancer-profiel, gebatcht — voor de
// opdrachtgever bij het beoordelen van kandidaten op /kandidaten. Read-only, geen mutaties.

import { prisma } from "@/lib/db";
import { computeDeliveryQualityByProfile, type DeliveryQuality } from "@/lib/collaboration-quality";

// Begrenzingen: een kandidatenlijst is doorgaans klein, maar de query mag nooit onbegrensd zijn.
const MAX_PROFILES = 200;
const MAX_PERF_ROWS = 5000;

/**
 * Bereken de leverbetrouwbaarheid voor een set freelancer-profiel-id's in twee gebatchte queries
 * (geen N+1). Elk opgegeven profiel komt in de Map terug; een profiel zonder goedgekeurde
 * prestaties levert een INSUFFICIENT-signaal. Geaggregeerd over álle samenwerkingen — geen
 * individuele data van een andere opdrachtgever.
 */
export async function getDeliveryQualityForProfiles(
  profileIds: string[],
): Promise<Map<string, DeliveryQuality>> {
  const unique = [...new Set(profileIds)].slice(0, MAX_PROFILES);
  if (unique.length === 0) return new Map();

  const [completedGroups, perfRows] = await Promise.all([
    prisma.collaboration.groupBy({
      by: ["freelancerId"],
      where: { freelancerId: { in: unique }, status: "COMPLETED" },
      _count: { _all: true },
    }),
    prisma.performance.findMany({
      where: { collaboration: { freelancerId: { in: unique } }, status: "APPROVED" },
      select: {
        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,
        collaboration: { select: { freelancerId: true } },
      },
      orderBy: { approvedAt: "desc" },
      take: MAX_PERF_ROWS,
    }),
  ]);

  const completedByProfile = new Map<string, number>(
    completedGroups.map((g) => [g.freelancerId, g._count._all]),
  );

  return computeDeliveryQualityByProfile(
    unique,
    perfRows.map((r) => ({
      submittedAt: r.submittedAt,
      approvedAt: r.approvedAt,
      rejectedAt: r.rejectedAt,
      freelancerId: r.collaboration.freelancerId,
    })),
    completedByProfile,
  );
}
