// Server-side gedeelde samenwerkingshistorie tussen één opdrachtgever en de reagerende ZZP'ers,
// gebatcht — voor het "eerder samengewerkt"-signaal op /kandidaten. Read-only, geen mutaties.
// Per opdrachtgever gescoopt (`company.userId`): nooit de historie van een andere opdrachtgever.

import { prisma } from "@/lib/db";
import { summarizeSharedHistory, type SharedHistory } from "@/lib/candidate-history";

// Begrenzingen: een kandidatenlijst is doorgaans klein, maar de query mag nooit onbegrensd zijn.
const MAX_PROFILES = 200;
const MAX_ROWS = 2000;

/**
 * Bereken per freelancer-profiel-id de afgeronde samenwerkingen met déze opdrachtgever, in één
 * gebatchte query (geen N+1). Alleen COMPLETED telt mee (de eenduidige "eerder samengewerkt"-claim);
 * PROPOSED/ACTIVE — waaronder de huidige reactie zelf — blijven buiten beschouwing. Profielen zonder
 * gedeelde historie ontbreken in de Map.
 */
export async function getSharedHistoryForCandidates(
  clientUserId: string,
  freelancerIds: string[],
): Promise<Map<string, SharedHistory>> {
  const unique = [...new Set(freelancerIds)].slice(0, MAX_PROFILES);
  if (unique.length === 0) return new Map();

  const rows = await prisma.collaboration.findMany({
    where: {
      company: { userId: clientUserId },
      freelancerId: { in: unique },
      status: "COMPLETED",
    },
    select: { freelancerId: true, completedAt: true, createdAt: true },
    take: MAX_ROWS,
  });

  return summarizeSharedHistory(rows, unique);
}
