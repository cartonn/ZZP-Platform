// Server-side gedeelde samenwerkingshistorie tussen één ZZP'er en één opdrachtgever — voor het
// "eerder samengewerkt"-vertrouwenssignaal op de opdracht-detailpagina. Read-only, geen mutaties.
// Per (ZZP'er, opdrachtgever)-paar gescoopt: nooit de historie met een andere opdrachtgever.

import { prisma } from "@/lib/db";
import {
  summarizeFreelancerClientHistory,
  type FreelancerClientHistory,
} from "@/lib/freelancer-client-history";

// Een ZZP'er heeft met één opdrachtgever in de praktijk een klein aantal samenwerkingen; ruime cap
// tegen onbegrensde groei.
const MAX_ROWS = 500;

/**
 * Bereken de afgeronde samenwerkingen tussen deze ZZP'er (op `userId`) en deze opdrachtgever
 * (`companyId`), in één gescoopte query. Alleen COMPLETED telt mee (de eenduidige "eerder
 * samengewerkt"-claim). Geeft `null` als er nog nooit een samenwerking is afgerond.
 */
export async function getFreelancerClientHistory(
  freelancerUserId: string,
  companyId: string,
): Promise<FreelancerClientHistory | null> {
  const rows = await prisma.collaboration.findMany({
    where: {
      freelancer: { userId: freelancerUserId },
      companyId,
      status: "COMPLETED",
    },
    select: { completedAt: true, createdAt: true },
    take: MAX_ROWS,
  });

  return summarizeFreelancerClientHistory(rows);
}
