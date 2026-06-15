import "server-only";
import { prisma } from "@/lib/db";
import {
  computeClientReliability,
  type CancellationRow,
  type ClientReliability,
} from "@/lib/client-reliability";

// Maximumaantal afgewikkelde samenwerkingen dat we ophalen per opdrachtgever. Beperkt de
// query-omvang en is ruim genoeg voor een representatief signaal.
const MAX_COLLABORATIONS = 50;

/**
 * Laadt de afgewikkelde samenwerkingen van een opdrachtgever (Company) en berekent het
 * annuleringsbetrouwbaarheid-signaal. Geeft alleen geaggregeerde statistieken terug — geen
 * individuele samenwerkingsdata is zichtbaar voor de aanroeper (privacy by design).
 *
 * Alleen afgewikkelde samenwerkingen (COMPLETED of CANCELLED) zijn relevant; lopende of
 * voorgestelde samenwerkingen zeggen nog niets over de betrouwbaarheid.
 */
export async function getClientReliabilityForCompany(
  companyId: string,
): Promise<ClientReliability> {
  const [company, collaborations] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { userId: true } }),
    prisma.collaboration.findMany({
      where: { companyId, status: { in: ["COMPLETED", "CANCELLED"] } },
      select: {
        status: true,
        cancelledAt: true,
        cancelledById: true,
        cancellationChargeable: true,
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_COLLABORATIONS,
    }),
  ]);

  const ownerUserId = company?.userId ?? null;

  const rows: CancellationRow[] = collaborations.map((c) => ({
    status: c.status,
    cancelledAt: c.cancelledAt,
    // Door de opdrachtgever gestart: chargeable is definitioneel een opdrachtgever-annulering;
    // anders vergelijken met de eigenaar van het bedrijf (zie attributie in client-reliability.ts).
    byClient: c.cancellationChargeable || (ownerUserId != null && c.cancelledById === ownerUserId),
    chargeable: c.cancellationChargeable,
  }));

  return computeClientReliability(rows);
}
