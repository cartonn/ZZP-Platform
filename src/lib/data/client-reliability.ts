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
 * Kern: laadt de afgewikkelde samenwerkingen van een bekende opdrachtgever (companyId + de eigenaar
 * userId, nodig voor de annulering-attributie) en berekent het betrouwbaarheidssignaal. Beide callers
 * kennen de eigenaar al — zo hoeft de Company niet opnieuw opgehaald te worden.
 */
async function reliabilityForOwner(
  companyId: string,
  ownerUserId: string,
): Promise<ClientReliability> {
  const collaborations = await prisma.collaboration.findMany({
    where: { companyId, status: { in: ["COMPLETED", "CANCELLED"] } },
    select: {
      status: true,
      cancelledAt: true,
      cancelledById: true,
      cancellationChargeable: true,
    },
    orderBy: { updatedAt: "desc" },
    take: MAX_COLLABORATIONS,
  });

  const rows: CancellationRow[] = collaborations.map((c) => ({
    status: c.status,
    cancelledAt: c.cancelledAt,
    // Door de opdrachtgever gestart: chargeable is definitioneel een opdrachtgever-annulering;
    // anders vergelijken met de eigenaar van het bedrijf (zie attributie in client-reliability.ts).
    byClient: c.cancellationChargeable || c.cancelledById === ownerUserId,
    chargeable: c.cancellationChargeable,
  }));

  return computeClientReliability(rows);
}

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
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });
  // Zonder bekende eigenaar kunnen we annuleringen niet aan de opdrachtgever toeschrijven
  // (alleen de chargeable-snapshot zou nog meetellen) → het signaal zou te positief uitvallen.
  // Geef dan een neutraal "unknown" terug i.p.v. een misleidend goed signaal.
  if (company == null) {
    return { sampleSize: 0, cancellations: 0, lastMinute: 0, cancelRate: null, tone: "unknown" };
  }
  return reliabilityForOwner(companyId, company.userId);
}

/**
 * Zelf-variant: laadt de annuleringsbetrouwbaarheid van de eigen opdrachtgever (via `userId` → eigen
 * Company). Geeft `null` terug als er nog geen bedrijfsprofiel is. Symmetrisch met
 * `getOwnPaymentBehaviorForClient` — voedt de betrouwbaarheidsreputatie-spiegel op /samenwerkingen.
 * De aanroeper is zelf de eigenaar, dus `userId` is direct de attributie-basis (geen extra Company-load).
 */
export async function getOwnReliabilityForClient(
  userId: string,
): Promise<ClientReliability | null> {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!company) return null;
  return reliabilityForOwner(company.id, userId);
}
