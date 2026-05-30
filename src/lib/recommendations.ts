// Proactieve matching: het systeem herkent zélf welke gepubliceerde opdrachten bij een
// ZZP'er passen, zonder dat-ie hoeft te zoeken. Hergebruikt de bestaande, server-berekende
// matchscore (CLAUDE.md regel 1: regels beslissen, geen client-logica). De zware selectie
// staat op de achtergrond; de gebruiker ziet alleen de beste, relevante uitkomsten.
//
// Bovenop de exacte score weegt een inhoudelijke (semantische) gelijkenis mee: opdrachten
// die qua tekst en vaardigheden op het profiel aansluiten — ook zonder exacte skill-overlap —
// worden als verwant herkend. Die gelijkenis bepaalt nooit de score zelf, maar dient als
// deterministische tiebreaker bij gelijke score en als verklaring in de kaart.

import { prisma } from "@/lib/db";
import { scoreJobForFreelancer, type ComplianceStatus } from "@/lib/matching";
import { getSemanticMatcher, safeRelatedness } from "@/lib/services/semantic-matcher";
import { type Availability } from "@/lib/enums";

export interface JobMatch {
  jobId: string;
  title: string;
  companyName: string;
  score: number;
  compliance: ComplianceStatus;
  availability: Availability;
  /** Inhoudelijke gelijkenis met het profiel, 0..1. Tiebreaker bij gelijke score. */
  relatedness?: number;
  /** Sluit inhoudelijk sterk aan (boven de drempel) — voor de verklaring in de UI. */
  related?: boolean;
}

/** Drempel waaronder een opdracht niet relevant genoeg is om proactief te tonen. */
export const MATCH_MIN_SCORE = 70;
/** Inhoudelijke gelijkenis vanaf deze waarde tonen we als aparte verklaring. */
export const SEMANTIC_HIGHLIGHT_THRESHOLD = 0.3;
/** Maximaal aantal gepubliceerde opdrachten dat we scoren (begrenst het werk). */
const SCAN_LIMIT = 100;

function joinText(parts: ReadonlyArray<string | null | undefined>): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(" ");
}

/**
 * Pure rangschikking: filter op drempel, sorteer aflopend op score met inhoudelijke
 * gelijkenis als tiebreaker, begrens. Testbaar zonder DB.
 */
export function topMatches(
  scored: readonly JobMatch[],
  opts: { minScore: number; limit: number },
): JobMatch[] {
  return scored
    .filter((m) => m.score >= opts.minScore)
    .sort((a, b) => b.score - a.score || (b.relatedness ?? 0) - (a.relatedness ?? 0))
    .slice(0, opts.limit);
}

/** Best passende gepubliceerde opdrachten voor een ZZP'er waarop hij nog niet reageerde. */
export async function recommendedJobs(userId: string, limit = 4): Promise<JobMatch[]> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: { select: { skillId: true, skill: { select: { name: true } } } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      applications: { select: { jobId: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });
  if (!profile) return [];

  const appliedJobIds = new Set(profile.applications.map((a) => a.jobId));
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
      credentialRequirements: true,
      company: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: SCAN_LIMIT,
  });

  const matcher = getSemanticMatcher();
  const profileText = joinText([
    profile.headline,
    profile.bio,
    ...profile.skills.map((s) => s.skill?.name),
  ]);

  const scored: JobMatch[] = jobs
    .filter((j) => !appliedJobIds.has(j.id))
    .map((j) => {
      const match = scoreJobForFreelancer(j, profile);
      const jobText = joinText([j.title, j.description, ...j.skills.map((s) => s.skill?.name)]);
      const relatedness = safeRelatedness(matcher, jobText, profileText);
      return {
        jobId: j.id,
        title: j.title,
        companyName: j.company.name,
        score: match.score,
        compliance: match.compliance.status,
        availability: match.availability.status,
        relatedness,
        related: relatedness >= SEMANTIC_HIGHLIGHT_THRESHOLD,
      };
    });

  return topMatches(scored, { minScore: MATCH_MIN_SCORE, limit });
}
