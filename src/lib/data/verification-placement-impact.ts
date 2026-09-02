// Data-laag voor het lopende-inzet-impactsignaal op de admin-verificatiewachtrij: haalt, voor de
// ZZP'ers die nú in de wachtrij staan, hun lopende (ACTIVE) inzetten met verplichte certificaateisen
// op, plus hun al-geldige geverifieerde certificaattypen. De pure aggregatie ("welke inzending
// deblokkeert een draaiende inzet") gebeurt in de leaf-laag (`verification-placement-impact.ts`).
//
// Platform-breed, géén tenant-scoping — de admin ziet alle tenants (spiegelt `verification-impact.ts`).
// Gescoped op de meegegeven `freelancerProfileIds` (de wachtrij is structureel klein → begrensde set),
// zodat de query niet over álle inzetten scant. Server-side is de waarheid (CLAUDE.md regel 1).

import { prisma } from "@/lib/db";
import { isExpired } from "@/lib/credentials";
import { type CredentialType } from "@/lib/enums";
import {
  type ActivePlacementRequirement,
  type CoveredCredentialType,
} from "@/lib/verification-placement-impact";

export interface ActivePlacementImpactData {
  placements: ActivePlacementRequirement[];
  covered: CoveredCredentialType[];
}

/**
 * Lopende-inzet-eisen + al-geldige geverifieerde typen voor de gegeven ZZP'ers.
 * Lege invoer → lege uitkomst (geen query).
 */
export async function getActivePlacementImpactData(
  freelancerProfileIds: readonly string[],
): Promise<ActivePlacementImpactData> {
  if (freelancerProfileIds.length === 0) return { placements: [], covered: [] };
  const ids = [...new Set(freelancerProfileIds)];
  const now = new Date();

  const [collaborations, credentials] = await Promise.all([
    // Lopende inzetten van deze ZZP'ers, met de verplichte certificaateisen van de bijbehorende opdracht.
    prisma.collaboration.findMany({
      where: { status: "ACTIVE", freelancerId: { in: ids } },
      select: {
        freelancerId: true,
        job: {
          select: {
            credentialRequirements: { where: { required: true }, select: { credentialType: true } },
          },
        },
      },
    }),
    // Alle geverifieerde certificaten van deze ZZP'ers (geldigheid wordt hieronder server-side bepaald).
    prisma.credential.findMany({
      where: { status: "VERIFIED", freelancerProfileId: { in: ids } },
      select: { freelancerProfileId: true, type: true, status: true, expiresAt: true },
    }),
  ]);

  const placements: ActivePlacementRequirement[] = collaborations.map((c) => ({
    freelancerProfileId: c.freelancerId,
    requiredTypes: c.job.credentialRequirements.map((r) => r.credentialType as CredentialType),
  }));

  const covered: CoveredCredentialType[] = credentials
    .filter((c) => !isExpired({ status: "VERIFIED", expiresAt: c.expiresAt }, now))
    .map((c) => ({ freelancerProfileId: c.freelancerProfileId, type: c.type as CredentialType }));

  return { placements, covered };
}
