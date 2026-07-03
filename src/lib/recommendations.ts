// Proactieve matching: het systeem herkent zélf welke gepubliceerde opdrachten bij een
// ZZP'er passen, zonder dat-ie hoeft te zoeken. Hergebruikt de bestaande, server-berekende
// matchscore (CLAUDE.md regel 1: regels beslissen, geen client-logica). De zware selectie
// staat op de achtergrond; de gebruiker ziet alleen de beste, relevante uitkomsten.
//
// Bovenop de harde velden weegt een inhoudelijke (semantische) gelijkenis mee: opdrachten die qua
// tekst en vaardigheden op het profiel aansluiten — ook zonder exacte skill-overlap — worden als
// verwant herkend. Die gelijkenis voedt de matchscore als kleine, uitlegbare `semantic`-component
// (zie matching.ts) én dient als verklaring in de kaart; de tiebreaker bij exact gelijke score blijft
// als secundaire sort.

import { prisma } from "@/lib/db";
import { visibleJobsWhereForTenant } from "@/lib/tenancy";
import {
  jobProfileRelatedness,
  scoreJobForFreelancer,
  topPositiveReason,
  SEMANTIC_HIGHLIGHT_THRESHOLD,
  type ComplianceStatus,
} from "@/lib/matching";
import { type Availability } from "@/lib/enums";

export interface JobMatch {
  jobId: string;
  title: string;
  companyName: string;
  score: number;
  compliance: ComplianceStatus;
  availability: Availability;
  /** Inhoudelijke gelijkenis met het profiel, 0..1. Voedt de `semantic`-scorecomponent; tiebreaker bij gelijke score. */
  relatedness?: number;
  /** Sluit inhoudelijk sterk aan (boven de drempel) — voor de verklaring in de UI. */
  related?: boolean;
  /** Sterkste positieve match-reden (bv. "Alle vereiste skills aanwezig") — compacte uitleg in de UI. */
  reason?: string;
}

/** Drempel waaronder een opdracht niet relevant genoeg is om proactief te tonen. */
export const MATCH_MIN_SCORE = 70;
/** Maximaal aantal gepubliceerde opdrachten dat we scoren (begrenst het werk). */
const SCAN_LIMIT = 100;

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

/**
 * Pure: sluit de bekeken opdracht uit de aanbevelingen en begrens. Testbaar zonder DB.
 * (Een ZZP'er die opdracht X bekijkt, krijgt X niet als "soortgelijke opdracht" terug.)
 */
export function excludeAndLimit(
  matches: readonly JobMatch[],
  excludeJobId: string,
  limit: number,
): JobMatch[] {
  return matches.filter((m) => m.jobId !== excludeJobId).slice(0, limit);
}

/** Best passende gepubliceerde opdrachten voor een ZZP'er waarop hij nog niet reageerde. */
export async function recommendedJobs(userId: string, limit = 4): Promise<JobMatch[]> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: { select: { skillId: true, skill: { select: { name: true } } } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      // Branche(s) van het profiel — voedt de branche-factor in de matchscore.
      industries: { select: { industryId: true } },
      // Ingetrokken reacties uitsluiten: zo'n opdracht mag weer als aanbeveling terugkomen.
      applications: { where: { status: { not: "WITHDRAWN" } }, select: { jobId: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });
  if (!profile) return [];

  const appliedJobIds = new Set(profile.applications.map((a) => a.jobId));
  const jobs = await prisma.job.findMany({
    // Gesloten per tenant (+ overflow): de eigen franchise-diensten + opengestelde diensten van
    // andere franchises (een directe ZZP'er: platform-opdrachten + opengestelde diensten).
    where: { status: "PUBLISHED", AND: [visibleJobsWhereForTenant(profile.tenantId)] },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
      credentialRequirements: true,
      company: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: SCAN_LIMIT,
  });

  const scored: JobMatch[] = jobs
    .filter((j) => !appliedJobIds.has(j.id))
    .map((j) => {
      // Eén canonieke relatedness voor score (via scoreJobForFreelancer) én verklaring/tiebreaker.
      const relatedness = jobProfileRelatedness(
        { title: j.title, description: j.description },
        { headline: profile.headline, bio: profile.bio },
      );
      // Inhoudelijke aansluiting voedt de score als kleine, uitlegbare component (niet slechts een
      // tiebreaker). De tiebreaker in topMatches blijft als secundaire sort bij exact gelijke score.
      const match = scoreJobForFreelancer(j, { ...profile, relatednessScore: relatedness });
      return {
        jobId: j.id,
        title: j.title,
        companyName: j.company.name,
        score: match.score,
        compliance: match.compliance.status,
        availability: match.availability.status,
        relatedness,
        related: relatedness >= SEMANTIC_HIGHLIGHT_THRESHOLD,
        reason: topPositiveReason(match.reasons) ?? undefined,
      };
    });

  return topMatches(scored, { minScore: MATCH_MIN_SCORE, limit });
}

/**
 * Soortgelijke open opdrachten voor de ZZP'er die opdracht `excludeJobId` bekijkt: dezelfde
 * verklaarbare matchmotor als `recommendedJobs`, maar zonder de opdracht die hij nu open heeft.
 * We vragen er één extra op zodat we, ná het uitsluiten van de bekeken opdracht, alsnog `limit`
 * suggesties kunnen tonen.
 */
export async function relatedJobsForFreelancer(
  userId: string,
  excludeJobId: string,
  limit = 3,
): Promise<JobMatch[]> {
  const matches = await recommendedJobs(userId, limit + 1);
  return excludeAndLimit(matches, excludeJobId, limit);
}
