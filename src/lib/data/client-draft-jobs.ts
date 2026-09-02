// Concept-opdrachten (DRAFT) van een opdrachtgever, met hun laatste-aanpassing-klok. Bron voor de
// leeftijd-bewuste concept-nudge op /acties: `summarizeDraftJobAging` (`src/lib/draft-job-aging.ts`)
// beslist welke concepten stil staan. Read-only, eigenaar-gescoped, begrensd; geen mutatie.

import { prisma } from "@/lib/db";
import type { DraftJobInput } from "@/lib/draft-job-aging";

/**
 * Harde bovengrens op het aantal concepten dat we scannen. Concept-opdrachten zijn zeldzaam per
 * opdrachtgever; de cap voorkomt een onbegrensde query en volgt de `MAX`-conventie elders. De oudste
 * (meest relevante) concepten worden eerst geladen, dus binnen de cap zit zeker het stilste concept.
 */
export const DRAFT_JOB_SCAN_LIMIT = 50;

/**
 * De concept-opdrachten van deze opdrachtgever, oudst-aangeraakt eerst. Eigenaar-gescoped
 * (`company.userId`); levert enkel de velden die de leeftijd-nudge nodig heeft.
 */
export async function getClientDraftJobs(
  userId: string,
  limit: number = DRAFT_JOB_SCAN_LIMIT,
): Promise<DraftJobInput[]> {
  const jobs = await prisma.job.findMany({
    where: { company: { userId }, status: "DRAFT" },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
  return jobs.map((job) => ({ jobId: job.id, title: job.title, updatedAt: job.updatedAt }));
}
