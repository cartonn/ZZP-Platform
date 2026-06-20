// Proactieve matching, kant van de opdrachtgever: bij een gepubliceerde opdracht herkent het
// systeem zélf welke (openbare) ZZP'ers passen en nog niet reageerden. Spiegelbeeld van
// recommendations.ts. Hergebruikt de server-berekende matchscore + compliance + vertrouwensniveau.
//
// Inhoudelijke (semantische) gelijkenis tussen opdracht en profiel weegt mee als
// deterministische tiebreaker bij gelijke score en als verklaring — nooit in de score zelf.

import { prisma } from "@/lib/db";
import { type Availability, type CredentialType, type CredentialStatus } from "@/lib/enums";
import { scoreJobForFreelancer, type ComplianceStatus } from "@/lib/matching";
import { getSemanticMatcher, safeRelatedness } from "@/lib/services/semantic-matcher";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";

export interface FreelancerSuggestion {
  freelancerId: string;
  name: string;
  score: number;
  compliance: ComplianceStatus;
  trustLevel: TrustLevel;
  availability: Availability;
  /** Korte functietitel/headline van de ZZP'er (bv. "Verpleegkundige (BIG)"). */
  headline: string | null;
  /** Standplaats. */
  location: string | null;
  /** Uurtarief in euro (heel getal), of null. */
  rate: number | null;
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

export interface ClientFreelancerSuggestion extends FreelancerSuggestion {
  /** De gepubliceerde opdracht die deze ZZP'er suggereerde (bron voor "Bericht sturen"). */
  jobId: string;
  jobTitle: string;
}

/**
 * Pure dedup + rangschikking over meerdere opdrachten: houd per ZZP'er de hoogst scorende
 * suggestie (tiebreak: hoogste relatedness), sorteer aflopend op score (tiebreak relatedness),
 * begrens op limit. Deterministisch, geen I/O.
 */
export function mergeClientSuggestions(
  list: readonly ClientFreelancerSuggestion[],
  opts: { limit: number },
): ClientFreelancerSuggestion[] {
  // Dedup by freelancerId, keeping entry with highest score (tiebreak: highest relatedness)
  const best = new Map<string, ClientFreelancerSuggestion>();
  for (const entry of list) {
    const existing = best.get(entry.freelancerId);
    if (!existing) {
      best.set(entry.freelancerId, entry);
    } else {
      const existingRel = existing.relatedness ?? 0;
      const entryRel = entry.relatedness ?? 0;
      if (
        entry.score > existing.score ||
        (entry.score === existing.score && entryRel > existingRel)
      ) {
        best.set(entry.freelancerId, entry);
      }
    }
  }

  return Array.from(best.values())
    .sort((a, b) => b.score - a.score || (b.relatedness ?? 0) - (a.relatedness ?? 0))
    .slice(0, opts.limit);
}

/**
 * Best passende openbare ZZP'ers voor een opdrachtgever, geaggregeerd over zijn gepubliceerde
 * opdrachten (die nog niet reageerden). Hergebruikt suggestedFreelancersForJob per opdracht.
 */
export async function suggestedFreelancersForClient(
  userId: string,
  limit = 4,
): Promise<ClientFreelancerSuggestion[]> {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!company) return [];

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, title: true },
  });
  if (jobs.length === 0) return [];

  const perJobResults = await Promise.all(
    jobs.map(async (job) => {
      const suggestions = await suggestedFreelancersForJob(job.id, limit);
      return suggestions.map(
        (s): ClientFreelancerSuggestion => ({
          ...s,
          jobId: job.id,
          jobTitle: job.title,
        }),
      );
    }),
  );

  const all = perJobResults.flat();
  return mergeClientSuggestions(all, { limit });
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
      // Ingetrokken reacties uitsluiten: zo'n ZZP'er mag weer als suggestie verschijnen.
      applications: { where: { status: { not: "WITHDRAWN" } }, select: { freelancerId: true } },
    },
  });
  if (!job || job.status !== "PUBLISHED") return [];

  const applied = new Set(job.applications.map((a) => a.freelancerId));
  // Gesloten per tenant — óók bij een opengestelde (overflow) dienst. Overflow opent een dienst voor
  // ZZP'ers van andere franchises (de jobs→ZZP'er-richting), maar de omgekeerde richting — een
  // opdrachtgever krijgt ZZP'ers van een ándere franchise gesuggereerd én kan ze benaderen — is
  // overal elders gesloten (visibleFreelancersWhere kent geen overflow; /zzp/[id] geeft cross-tenant
  // 404). Dus altijd op de eigen tenant van de dienst scopen, anders lekt cross-tenant PII.
  const profileScope = { ...discoverableFreelancerWhere, tenantId: job.tenantId };
  const profiles = await prisma.freelancerProfile.findMany({
    where: profileScope,
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
        mandatoryDocsComplete: mandatoryDocuments(
          p.credentials.map((c) => ({
            type: c.type as CredentialType,
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
        ).allSatisfied,
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
        headline: p.headline,
        location: p.location,
        rate: p.hourlyRate,
        relatedness,
        related: relatedness >= SEMANTIC_HIGHLIGHT_THRESHOLD,
      };
    });

  return topSuggestions(scored, { minScore: SUGGESTION_MIN_SCORE, limit });
}
