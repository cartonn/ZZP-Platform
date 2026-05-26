// Proactieve matching: het systeem herkent zélf welke gepubliceerde opdrachten bij een
// ZZP'er passen, zonder dat-ie hoeft te zoeken. Hergebruikt de bestaande, server-berekende
// matchscore (CLAUDE.md regel 1: regels beslissen, geen client-logica). De zware selectie
// staat op de achtergrond; de gebruiker ziet alleen de beste, relevante uitkomsten.

import { prisma } from "@/lib/db";
import { scoreJobForFreelancer, type ComplianceStatus } from "@/lib/matching";

export interface JobMatch {
  jobId: string;
  title: string;
  companyName: string;
  score: number;
  compliance: ComplianceStatus;
}

/** Drempel waaronder een opdracht niet relevant genoeg is om proactief te tonen. */
export const MATCH_MIN_SCORE = 70;
/** Maximaal aantal gepubliceerde opdrachten dat we scoren (begrenst het werk). */
const SCAN_LIMIT = 100;

/** Pure rangschikking: filter op drempel, sorteer aflopend, begrens. Testbaar zonder DB. */
export function topMatches(
  scored: readonly JobMatch[],
  opts: { minScore: number; limit: number },
): JobMatch[] {
  return scored
    .filter((m) => m.score >= opts.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit);
}

/** Best passende gepubliceerde opdrachten voor een ZZP'er waarop hij nog niet reageerde. */
export async function recommendedJobs(userId: string, limit = 4): Promise<JobMatch[]> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: { select: { skillId: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      applications: { select: { jobId: true } },
    },
  });
  if (!profile) return [];

  const appliedJobIds = new Set(profile.applications.map((a) => a.jobId));
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    include: {
      skills: true,
      credentialRequirements: true,
      company: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: SCAN_LIMIT,
  });

  const scored: JobMatch[] = jobs
    .filter((j) => !appliedJobIds.has(j.id))
    .map((j) => {
      const match = scoreJobForFreelancer(j, profile);
      return {
        jobId: j.id,
        title: j.title,
        companyName: j.company.name,
        score: match.score,
        compliance: match.compliance.status,
      };
    });

  return topMatches(scored, { minScore: MATCH_MIN_SCORE, limit });
}
