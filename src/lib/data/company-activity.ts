import "server-only";
import { prisma } from "@/lib/db";
import { summarizeCompanyActivity, type CompanyActivity } from "@/lib/company-activity";

/**
 * Publiek activiteits-/anciënniteitssignaal van een opdrachtgever zoals een reagerende ZZP'er dat
 * mag zien: hoe lang het bedrijf lid is + hoeveel opdrachten het ooit publiceerde en hoeveel
 * samenwerkingen het afrondde. Alleen geaggregeerde tellingen verlaten deze laag — geen individuele
 * opdracht- of samenwerkingsdata (privacy by design).
 *
 * `memberSince` komt uit het reeds geladen Company-record (geen extra query); de twee tellingen zijn
 * begrensde `count`-queries. Publicatie = niet-DRAFT (PUBLISHED of CLOSED telt als "geplaatst").
 */
export async function getCompanyActivity(
  companyId: string,
  memberSince: Date,
): Promise<CompanyActivity> {
  const [publishedJobs, completedCollaborations] = await Promise.all([
    prisma.job.count({ where: { companyId, status: { not: "DRAFT" } } }),
    prisma.collaboration.count({ where: { companyId, status: "COMPLETED" } }),
  ]);

  return summarizeCompanyActivity({ memberSince, publishedJobs, completedCollaborations });
}
