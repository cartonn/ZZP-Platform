// Data-laag voor het "gevraagde certificaten die je nog mist"-signaal op /certificaten: haalt de
// verplichte certificaateisen op van de open opdrachten die de ZZP'er mag zien en waarop hij nog niet
// reageerde. De pure aggregatie (welk type ontsluit hoeveel opdrachten) gebeurt in de leaf-laag
// (credential-demand.ts / computeCredentialDemand). Spiegelt de begrensde scan van recommendations.ts
// (visibleJobsWhereForTenant + take) — server-side is de waarheid (CLAUDE.md regel 1).

import { prisma } from "@/lib/db";
import { visibleJobsWhereForTenant } from "@/lib/tenancy";
import { type JobRequirementRow } from "@/lib/credential-demand";
import { type CredentialType } from "@/lib/enums";

/** Maximaal aantal gepubliceerde opdrachten dat we scannen — gelijk aan recommendations.ts. */
const SCAN_LIMIT = 100;

/**
 * Verplichte certificaateisen ({ jobId, credentialType }) van de open opdrachten die deze ZZP'er mag
 * zien en waarop hij nog niet reageerde. Tenant-gesloten (eigen franchise + overflow, of platform +
 * overflow voor een directe ZZP'er), begrensd op SCAN_LIMIT. Lege lijst zonder profiel.
 */
export async function getCredentialDemandRequirements(
  userId: string,
): Promise<JobRequirementRow[]> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true, tenantId: true, applications: { select: { jobId: true } } },
  });
  if (!profile) return [];

  const appliedJobIds = new Set(profile.applications.map((a) => a.jobId));

  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED", AND: [visibleJobsWhereForTenant(profile.tenantId)] },
    select: {
      id: true,
      credentialRequirements: { where: { required: true }, select: { credentialType: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: SCAN_LIMIT,
  });

  const rows: JobRequirementRow[] = [];
  for (const job of jobs) {
    if (appliedJobIds.has(job.id)) continue; // al gereageerd → geen "nog te ontsluiten" kans
    for (const req of job.credentialRequirements) {
      rows.push({ jobId: job.id, credentialType: req.credentialType as CredentialType });
    }
  }
  return rows;
}
