// Data-laag voor het "gevraagde vaardigheden die je nog mist"-signaal op /profiel/bewerken: haalt de
// vereiste skill-eisen op van de open opdrachten die de ZZP'er mag zien en waarop hij nog niet
// reageerde. De pure aggregatie (welke vaardigheid ontsluit hoeveel opdrachten) gebeurt in de
// leaf-laag (skill-demand.ts / computeSkillDemand). Spiegelt de begrensde scan van
// freelancer-credential-demand.ts (visibleJobsWhereForTenant + take) — server-side is de waarheid
// (CLAUDE.md regel 1).

import { prisma } from "@/lib/db";
import { visibleJobsWhereForTenant } from "@/lib/tenancy";
import { type JobSkillRequirementRow } from "@/lib/skill-demand";

/** Maximaal aantal gepubliceerde opdrachten dat we scannen — gelijk aan de credential-demand-scan. */
const SCAN_LIMIT = 100;

/**
 * Vereiste skill-eisen ({ jobId, skillId, skillName }) van de open opdrachten die deze ZZP'er mag zien
 * en waarop hij nog niet reageerde. Tenant-gesloten (eigen franchise + overflow, of platform +
 * overflow voor een directe ZZP'er), begrensd op SCAN_LIMIT. Lege lijst zonder profiel.
 */
export async function getSkillDemandRequirements(
  userId: string,
): Promise<JobSkillRequirementRow[]> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { tenantId: true, applications: { select: { jobId: true } } },
  });
  if (!profile) return [];

  const appliedJobIds = new Set(profile.applications.map((a) => a.jobId));

  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED", AND: [visibleJobsWhereForTenant(profile.tenantId)] },
    select: {
      id: true,
      skills: {
        where: { required: true },
        select: { skillId: true, skill: { select: { name: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: SCAN_LIMIT,
  });

  const rows: JobSkillRequirementRow[] = [];
  for (const job of jobs) {
    if (appliedJobIds.has(job.id)) continue; // al gereageerd → geen "nog te ontsluiten" kans
    for (const req of job.skills) {
      rows.push({ jobId: job.id, skillId: req.skillId, skillName: req.skill.name });
    }
  }
  return rows;
}
