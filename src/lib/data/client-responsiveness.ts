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

/**
 * Variant voor meerdere opdrachtgevers ineens (bv. de reactie-lijst van een ZZP'er, waar elke kaart
 * een andere opdrachtgever kan hebben). De set opdrachtgevers is inherent klein (die waarmee de ZZP'er
 * nog een openstaande reactie heeft), dus we hergebruiken de single-variant per opdrachtgever — die
 * begrenst de fetch al met `take: MAX_APPLICATIONS` op DB-niveau (geen onbegrensde findMany die alle
 * reacties van een druk bureau in geheugen trekt). De queries lopen parallel. Geeft alleen
 * geaggregeerde tellingen terug — geen individuele reactie van een andere ZZP'er is zichtbaar.
 */
export async function getClientResponsivenessForCompanies(
  companyIds: string[],
  now: Date = new Date(),
): Promise<Map<string, ClientResponsiveness>> {
  const unique = [...new Set(companyIds)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getClientResponsivenessForCompany(id, now)] as const),
  );
  return new Map(entries);
}
