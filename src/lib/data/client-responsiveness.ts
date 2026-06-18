import "server-only";
import { prisma } from "@/lib/db";
import {
  computeClientResponsiveness,
  type ResponseRow,
  type ClientResponsiveness,
} from "@/lib/client-responsiveness";

// Maximumaantal reacties dat we ophalen per opdrachtgever. Begrenst de query-omvang en is ruim
// genoeg voor een representatief signaal; de nieuwste reacties wegen het zwaarst.
const MAX_APPLICATIONS = 100;

/**
 * Laadt de bij de opdrachten van een opdrachtgever (Company) binnengekomen reacties en berekent het
 * reactiebereidheid-signaal. Geeft alleen geaggregeerde tellingen terug — geen individuele reactie
 * van een andere ZZP'er is zichtbaar voor de aanroeper (privacy by design).
 */
export async function getClientResponsivenessForCompany(
  companyId: string,
  now: Date = new Date(),
): Promise<ClientResponsiveness> {
  const applications = await prisma.application.findMany({
    where: { job: { companyId } },
    select: { status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: MAX_APPLICATIONS,
  });

  const rows: ResponseRow[] = applications.map((a) => ({
    status: a.status,
    createdAt: a.createdAt,
  }));

  return computeClientResponsiveness(rows, now);
}
