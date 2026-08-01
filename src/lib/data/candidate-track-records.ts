// Data-access voor het platform-brede ervaringssignaal op /kandidaten: het aantal AFGERONDE
// (COMPLETED) samenwerkingen per reagerende ZZP'er. Eén gebatchte `groupBy` over alle profielen
// (geen N+1), gescoopt op de door de caller opgehaalde applicant-profielen.
//
// Bewust alléén de telling (niet de uren): de kandidaatkaart toont één compacte chip
// ("12 afgeronde klussen"); een uren-aggregatie over álle kandidaten zou een dure query zijn zonder
// getoonde waarde. `Collaboration.freelancerId` = `FreelancerProfile.id`. Server-side waarheid,
// geen mutaties. Spiegelt de aggregatie in `data/freelancer-track-record.ts` (die per profiel óók
// de uren telt voor het bredere dossier).

import { prisma } from "@/lib/db";

/**
 * Aantal afgeronde samenwerkingen per opgegeven freelancer-profiel. Profielen zonder een enkele
 * afgeronde samenwerking staan **niet** in de Map (afwezig = 0 → geen signaal). Lege input → lege Map.
 */
export async function getCompletedCollaborationCounts(
  profileIds: readonly string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (profileIds.length === 0) return result;

  const grouped = await prisma.collaboration.groupBy({
    by: ["freelancerId"],
    where: { status: "COMPLETED", freelancerId: { in: [...profileIds] } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    if (row._count._all > 0) result.set(row.freelancerId, row._count._all);
  }
  return result;
}
