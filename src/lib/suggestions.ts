// Proactieve matching, kant van de opdrachtgever: bij een gepubliceerde opdracht herkent het
// systeem zélf welke (openbare) ZZP'ers passen en nog niet reageerden. Spiegelbeeld van
// recommendations.ts. Hergebruikt de server-berekende matchscore + compliance + vertrouwensniveau.
//
// Inhoudelijke (semantische) gelijkenis tussen opdracht en profiel weegt mee als
// deterministische tiebreaker bij gelijke score en als verklaring — nooit in de score zelf.

import { prisma } from "@/lib/db";
import { type Availability } from "@/lib/enums";
import { scoreJobForFreelancer, type ComplianceStatus } from "@/lib/matching";
import { getSemanticMatcher, safeRelatedness } from "@/lib/services/semantic-matcher";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";

export interface FreelancerSuggestion {
  freelancerId: string;
  name: string;
  score: number;
  compliance: ComplianceStatus;
  trustLevel: TrustLevel;
  availability: Availability;
  /** Inhoudelijke gelijkenis met de opdracht, 0..1. Tiebreaker bij gelijke score. */
  relatedness?: number;
  /** Sluit inhoudelijk sterk aan (boven de drempel) — voor de verklaring in de UI. */
  related?: boolean;
}

/** Drempel waaronder een ZZP'er niet relevant genoeg is om voor te stellen. */
export const SUGGESTION_MIN_SCORE = 70;
/** Inhoudelijke gelijkenis vanaf deze waarde tonen we als aparte verklaring. */
export const SEMANTIC_HIGHLIGHT_THRESHOLD = 0.3;
/** Maximaal aantal openbare profielen dat we scoren (begrenst het werk). */
const SCAN_LIMIT = 200;

function joinText(parts: ReadonlyArray<string | null | undefined>): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(" ");
}

/**
 * Pure rangschikking: filter op drempel, sorteer aflopend op score met inhoudelijke
 * gelijkenis als tiebreaker, begrens. Testbaar zonder DB.
 */
export function topSuggestions(
  list: readonly FreelancerSuggestion[],
  opts: { minScore: number; limit: number },
): FreelancerSuggestion[] {
  return list
    .filter((s) => s.score >= opts.minScore)
    .sort((a, b) => b.score - a.score || (b.relatedness ?? 0) - (a.relatedness ?? 0))
    .slice(0, opts.limit);
}

/** Best passende openbare ZZP'ers voor een opdracht die nog niet reageerden. */
export async function suggestedFreelancersForJob(
  jobId: string,
  limit = 4,
): Promise<FreelancerSuggestion[]> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
      credentialRequirements: true,
      applications: { select: { freelancerId: true } },
    },
  });
  if (!job || job.status !== "PUBLISHED") return [];

  const applied = new Set(job.applications.map((a) => a.freelancerId));
  const profiles = await prisma.freelancerProfile.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: SCAN_LIMIT,
    include: {
      user: { select: { name: true, identityVerifiedAt: true } },
      skills: { select: { skillId: true, skill: { select: { name: true } } } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });

  const now = Date.now();
  const matcher = getSemanticMatcher();
  const jobText = joinText([job.title, job.description, ...job.skills.map((s) => s.skill?.name)]);

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
      const profileText = joinText([p.headline, p.bio, ...p.skills.map((s) => s.skill?.name)]);
      const relatedness = safeRelatedness(matcher, jobText, profileText);
      return {
        freelancerId: p.id,
        name: p.user.name ?? "—",
        score: match.score,
        compliance: match.compliance.status,
        trustLevel: trust.level,
        availability: match.availability.status,
        relatedness,
        related: relatedness >= SEMANTIC_HIGHLIGHT_THRESHOLD,
      };
    });

  return topSuggestions(scored, { minScore: SUGGESTION_MIN_SCORE, limit });
}
