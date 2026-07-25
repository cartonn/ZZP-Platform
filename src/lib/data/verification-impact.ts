// Data-laag voor het impact-/vraagsignaal op de admin-verificatiewachtrij: haalt de verplichte
// certificaateisen op van de open (gepubliceerde) opdrachten, platform-breed (de admin ziet alle
// tenants — géén tenant-scoping, anders dan het ZZP'er-signaal). De pure aggregatie (welk type wordt
// door hoeveel opdrachten gevraagd) gebeurt in de leaf-laag (`verification-impact.ts`). Begrensde scan
// (SCAN_LIMIT) spiegelt `freelancer-credential-demand.ts` — server-side is de waarheid (CLAUDE.md
// regel 1).

import { prisma } from "@/lib/db";
import { type OpenJobRequirementRow } from "@/lib/verification-impact";
import { type CredentialType } from "@/lib/enums";

/** Maximaal aantal gepubliceerde opdrachten dat we scannen. */
const SCAN_LIMIT = 200;

/**
 * Verplichte certificaateisen ({ jobId, credentialType }) van de open (gepubliceerde) opdrachten,
 * platform-breed. Begrensd op de meest recente SCAN_LIMIT opdrachten.
 */
export async function getOpenJobCredentialRequirements(): Promise<OpenJobRequirementRow[]> {
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      credentialRequirements: { where: { required: true }, select: { credentialType: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: SCAN_LIMIT,
  });

  const rows: OpenJobRequirementRow[] = [];
  for (const job of jobs) {
    for (const req of job.credentialRequirements) {
      rows.push({ jobId: job.id, credentialType: req.credentialType as CredentialType });
    }
  }
  return rows;
}
