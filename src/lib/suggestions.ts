// Proactieve matching, kant van de opdrachtgever: bij een gepubliceerde opdracht herkent het
// systeem zélf welke (openbare) ZZP'ers passen en nog niet reageerden. Spiegelbeeld van
// recommendations.ts. Hergebruikt de server-berekende matchscore + compliance + vertrouwensniveau.

import { prisma } from "@/lib/db";
import { type Availability } from "@/lib/enums";
import { scoreJobForFreelancer, type ComplianceStatus } from "@/lib/matching";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";

export interface FreelancerSuggestion {
  freelancerId: string;
  name: string;
  score: number;
  compliance: ComplianceStatus;
  trustLevel: TrustLevel;
  availability: Availability;
}

/** Drempel waaronder een ZZP'er niet relevant genoeg is om voor te stellen. */
export const SUGGESTION_MIN_SCORE = 70;
/** Maximaal aantal openbare profielen dat we scoren (begrenst het werk). */
const SCAN_LIMIT = 200;

/** Pure rangschikking: filter op drempel, sorteer aflopend, begrens. Testbaar zonder DB. */
export function topSuggestions(
  list: readonly FreelancerSuggestion[],
  opts: { minScore: number; limit: number },
): FreelancerSuggestion[] {
  return list
    .filter((s) => s.score >= opts.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit);
}

/** Best passende openbare ZZP'ers voor een opdracht die nog niet reageerden. */
export async function suggestedFreelancersForJob(jobId: string, limit = 4): Promise<FreelancerSuggestion[]> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { skills: true, credentialRequirements: true, applications: { select: { freelancerId: true } } },
  });
  if (!job || job.status !== "PUBLISHED") return [];

  const applied = new Set(job.applications.map((a) => a.freelancerId));
  const profiles = await prisma.freelancerProfile.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: SCAN_LIMIT,
    include: {
      user: { select: { name: true, identityVerifiedAt: true } },
      skills: { select: { skillId: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });

  const now = Date.now();

  const scored: FreelancerSuggestion[] = profiles
    .filter((p) => !applied.has(p.id))
    .map((p) => {
      const match = scoreJobForFreelancer(job, p);
      const verifiedCredentialCount = p.credentials.filter(
        (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > now),
      ).length;
      const trust = computeTrustLevel({
        identityVerified: !!p.user.identityVerifiedAt,
        verifiedCredentialCount,
      });
      return {
        freelancerId: p.id,
        name: p.user.name ?? "—",
        score: match.score,
        compliance: match.compliance.status,
        trustLevel: trust.level,
        availability: match.availability.status,
      };
    });

  return topSuggestions(scored, { minScore: SUGGESTION_MIN_SCORE, limit });
}
