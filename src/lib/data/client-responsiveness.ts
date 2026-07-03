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
 * Gebatchte variant voor meerdere opdrachtgevers ineens (bv. de reactie-lijst van een ZZP'er, waar
 * elke kaart een andere opdrachtgever kan hebben). Eén query i.p.v. N — geen N+1. De set opdrachtgevers
 * is inherent klein (de opdrachtgevers waarmee de ZZP'er nog een openstaande reactie heeft) en per
 * opdrachtgever wegen we de nieuwste `MAX_APPLICATIONS` reacties mee (gelijk aan de single-variant, in
 * geheugen begrensd). Geeft alleen geaggregeerde tellingen terug — geen individuele reactie van een
 * andere ZZP'er is zichtbaar (privacy by design).
 */
export async function getClientResponsivenessForCompanies(
  companyIds: string[],
  now: Date = new Date(),
): Promise<Map<string, ClientResponsiveness>> {
  const unique = [...new Set(companyIds)];
  const result = new Map<string, ClientResponsiveness>();
  if (unique.length === 0) return result;

  const applications = await prisma.application.findMany({
    where: { job: { companyId: { in: unique } } },
    select: { status: true, createdAt: true, job: { select: { companyId: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Groepeer per opdrachtgever en respecteer per opdrachtgever dezelfde cap als de single-variant.
  // De query staat al op `createdAt desc`, dus de eerste MAX_APPLICATIONS per bucket zijn de nieuwste.
  const buckets = new Map<string, ResponseRow[]>();
  for (const a of applications) {
    const companyId = a.job.companyId;
    const bucket = buckets.get(companyId);
    if (bucket) {
      if (bucket.length < MAX_APPLICATIONS)
        bucket.push({ status: a.status, createdAt: a.createdAt });
    } else {
      buckets.set(companyId, [{ status: a.status, createdAt: a.createdAt }]);
    }
  }

  for (const companyId of unique) {
    result.set(companyId, computeClientResponsiveness(buckets.get(companyId) ?? [], now));
  }

  return result;
}
