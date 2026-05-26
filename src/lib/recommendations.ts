// Proactieve matching: het systeem herkent zélf welke gepubliceerde opdrachten bij een
// ZZP'er passen, zonder dat-ie hoeft te zoeken. Hergebruikt de bestaande, server-berekende
// matchscore (CLAUDE.md regel 1: regels beslissen, geen client-logica). De zware selectie
// staat op de achtergrond; de gebruiker ziet alleen de beste, relevante uitkomsten.

import { prisma } from "@/lib/db";
import {
  computeMatchScore,
  type ComplianceStatus,
  type FreelancerCredential,
} from "@/lib/matching";
import { type CredentialType, type WorkMode } from "@/lib/enums";

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

  const credentials: FreelancerCredential[] = profile.credentials.map((c) => ({
    type: c.type as CredentialType,
    status: c.status as FreelancerCredential["status"],
    expiresAt: c.expiresAt,
  }));
  const freelancerSkillIds = profile.skills.map((s) => s.skillId);

  const scored: JobMatch[] = jobs
    .filter((j) => !appliedJobIds.has(j.id))
    .map((j) => {
      const match = computeMatchScore({
        requiredSkillIds: j.skills.filter((s) => s.required).map((s) => s.skillId),
        optionalSkillIds: j.skills.filter((s) => !s.required).map((s) => s.skillId),
        freelancerSkillIds,
        requiredCredentialTypes: j.credentialRequirements
          .filter((c) => c.required)
          .map((c) => c.credentialType as CredentialType),
        credentials,
        job: { rateMin: j.rateMin, rateMax: j.rateMax, workMode: j.workMode as WorkMode, location: j.location },
        freelancer: { hourlyRate: profile.hourlyRate, workMode: profile.workMode as WorkMode, location: profile.location },
      });
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
