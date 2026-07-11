// Data-access voor de feitelijke staat van dienst van één ZZP'er (op FreelancerProfile.id).
// Reikt de ruwe cijfers aan die de pure helper `trackRecordHighlights` (freelancer-track-record.ts)
// tot getoonde, drempel-gegate hoogtepunten filtert. Server-side waarheid; geen mutaties.
//
// Spiegelt de bewezen aggregatie in `freelancer-search.ts` (de browse-kaart): een afgeronde
// samenwerking = `Collaboration.status = "COMPLETED"`; gewerkte uren = de som van álle
// goedgekeurde HOURS-prestaties. `Collaboration.freelancerId` = `FreelancerProfile.id`.

import { prisma } from "@/lib/db";
import { type FreelancerTrackRecord } from "@/lib/freelancer-track-record";

/** Harde cap tegen onbegrensde groei van de uren-aggregatie (één ZZP'er kan veel samenwerkingen hebben). */
const MAX_COLLABORATIONS = 2000;

/**
 * Feitelijke staat van dienst voor één ZZP'er: aantal afgeronde samenwerkingen + som van de
 * goedgekeurde uren. Geeft de ruwe getallen terug; de drempel-logica ("pronk niet met magere
 * cijfers") zit in `trackRecordHighlights`.
 */
export async function getFreelancerTrackRecord(profileId: string): Promise<FreelancerTrackRecord> {
  const [completedCollaborations, collaborations] = await Promise.all([
    prisma.collaboration.count({
      where: { status: "COMPLETED", freelancerId: profileId },
    }),
    prisma.collaboration.findMany({
      where: { freelancerId: profileId },
      select: {
        performances: {
          where: { status: "APPROVED", type: "HOURS" },
          select: { hours: true },
        },
      },
      take: MAX_COLLABORATIONS,
    }),
  ]);

  const approvedHours = collaborations.reduce(
    (acc, c) => acc + c.performances.reduce((sum, p) => sum + (p.hours ?? 0), 0),
    0,
  );

  return { completedCollaborations, approvedHours };
}
