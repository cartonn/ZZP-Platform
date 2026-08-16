// Data-laag voor de compliance-ripple aan de ZZP-zijde: haalt de lopende inzetten van de ZZP'er op
// met de harde certificaateisen van de opdracht. Spiegelt clientCredentialAlerts (collaboration-alerts.ts),
// maar freelancer-gescoped. De koppeling met de vervalkalender gebeurt in de pure laag
// (freelancer-compliance.ts / linkExpiryToInzet). Server-side is de waarheid (CLAUDE.md regel 1).

import { prisma } from "@/lib/db";
import { type ActiveCollaborationRequirement } from "@/lib/freelancer-compliance";
import { type CredentialType } from "@/lib/enums";

/**
 * Lopende (ACTIVE) samenwerkingen van de ZZP'er met de verplichte certificaateisen van de opdracht.
 * Alleen samenwerkingen mét ten minste één verplicht certificaat komen terug — zonder eis valt er
 * niets te bewaken.
 */
export async function getActiveCollaborationRequirements(
  userId: string,
): Promise<ActiveCollaborationRequirement[]> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];

  const collaborations = await prisma.collaboration.findMany({
    where: { freelancerId: profile.id, status: "ACTIVE" },
    // Deterministische orderBy náást de take (conventie in pending-tasks.ts): stabiel, self-healing
    // 200-rij-venster i.p.v. een per-scan wisselende slice. Spiegelt clientCredentialAlerts.
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      job: {
        select: {
          title: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true } },
    },
  });

  const result: ActiveCollaborationRequirement[] = [];
  for (const c of collaborations) {
    const requiredTypes = c.job.credentialRequirements.map(
      (r) => r.credentialType as CredentialType,
    );
    if (requiredTypes.length === 0) continue;
    result.push({
      collaborationId: c.id,
      jobTitle: c.job.title,
      clientName: c.company.name ?? "—",
      requiredTypes,
    });
  }
  return result;
}
