// Passende open diensten voor één ZZP'er — de spiegel van `dienst-voordracht.ts`. Waar die de
// kandidaten scoort vóór één dienst, scoort deze module de open tenant-diensten vóór één ZZP'er:
// "waar kan ik deze persoon op plaatsen?". Read-only, hergebruikt exact dezelfde matchmotor
// (`scoreJobForFreelancer`) als de Reacties-lijst, `/kandidaten` en de voordracht — geen nieuwe
// rekenlogica, dezelfde uitlegbare troef/minpunt-redenen. Server-side is de waarheid.
//
// De pure kern (`buildDienstSuggesties`) staat los van de DB-laag zodat de sortering, de drempel en de
// reactie-/voordracht-markering los te testen zijn.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { tenantScopeWhere } from "@/lib/tenancy";
import {
  type JobMatchSource,
  type FreelancerMatchSource,
  scoreJobForFreelancer,
  topGapReasonComplianceFirst,
} from "@/lib/matching";
import { PROPOSAL_ACTION } from "@/lib/franchise/dienst-voordracht";

/** Ondergrens waaronder een dienst niet relevant genoeg is om als suggestie te tonen. Bewust lager dan
 *  de proactieve `MATCH_MIN_SCORE` (70) van de ZZP-kant: de bemiddelaar plaatst actief en wil ook de
 *  redelijke opties zien, niet alleen de topmatches. */
export const DIENST_SUGGESTIE_MIN_SCORE = 55;
/** Maximaal aantal suggesties dat we tonen (houdt de kaart compact). */
export const DIENST_SUGGESTIE_LIMIT = 6;

/** Eén open dienst als matchbron plus de weergavevelden. */
export interface SuggestieJob extends JobMatchSource {
  id: string;
  companyName: string;
}

export interface DienstSuggestie {
  jobId: string;
  title: string;
  companyName: string;
  /** Server-berekende matchscore (0-100) van déze ZZP'er voor deze dienst. */
  matchScore: number;
  /** Sterkste positieve matchreden (troef), of `null`. */
  topReason: string | null;
  /** Grootste matchkloof (minpunt), of `null`. */
  topGap: string | null;
  /** ZZP'er heeft zelf al gereageerd op deze dienst (Application, niet ingetrokken). */
  hasApplied: boolean;
  /** ZZP'er is al voorgedragen voor deze dienst (voordracht-audit aanwezig). */
  proposed: boolean;
}

/**
 * Pure kern: rangschik de open diensten op matchkwaliteit voor deze ZZP'er. Elke dienst krijgt de
 * server-berekende matchscore + troef/minpunt (`scoreJobForFreelancer`). Diensten onder de drempel
 * vallen weg; het resultaat is aflopend op score gesorteerd (tiebreak op titel) en begrensd tot
 * `DIENST_SUGGESTIE_LIMIT`. Reactie-/voordracht-status wordt als vlag meegegeven zodat de UI niet
 * dubbel voordraagt.
 */
export function buildDienstSuggesties(
  freelancer: FreelancerMatchSource,
  jobs: readonly SuggestieJob[],
  appliedJobIds: ReadonlySet<string>,
  proposedJobIds: ReadonlySet<string>,
  now: Date = new Date(),
  minScore: number = DIENST_SUGGESTIE_MIN_SCORE,
  limit: number = DIENST_SUGGESTIE_LIMIT,
): DienstSuggestie[] {
  return jobs
    .map((job): DienstSuggestie => {
      const match = scoreJobForFreelancer(job, freelancer, now);
      return {
        jobId: job.id,
        title: job.title ?? "—",
        companyName: job.companyName,
        matchScore: match.score,
        topReason: match.reasons.find((r) => r.kind === "positive")?.label ?? null,
        // Compliance-kloof altijd eerst (zie dienst-voordracht): een ontbrekend verplicht bewijsstuk
        // is het zwaarste signaal voor de bemiddelaar.
        topGap: topGapReasonComplianceFirst(match.reasons),
        hasApplied: appliedJobIds.has(job.id),
        proposed: proposedJobIds.has(job.id),
      };
    })
    .filter((s) => s.matchScore >= minScore)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.title.localeCompare(b.title, "nl");
    })
    .slice(0, limit);
}

/**
 * De open diensten van de tenant, gescoord voor één roster-ZZP'er, gerangschikt op matchkwaliteit.
 * Read-only. Geeft `null` bij een ZZP'er buiten de eigen tenant (isolatie) of onbekende tenant —
 * zelfde poort als `getRosterDossier`.
 */
export async function getDienstSuggestiesForFreelancer(
  actor: Actor,
  freelancerId: string,
  now: Date = new Date(),
): Promise<DienstSuggestie[] | null> {
  const profile = await prisma.freelancerProfile.findFirst({
    where: { id: freelancerId, ...tenantScopeWhere(actor) },
    select: {
      id: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      workMode: true,
      location: true,
      maxTravelMinutes: true,
      availability: true,
      skills: { select: { skillId: true } },
      industries: { select: { industryId: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
    },
  });
  if (!profile) return null;

  // Alleen open (gepubliceerde) diensten binnen dezelfde tenant zijn plaatsbaar.
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED", ...tenantScopeWhere(actor) },
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      industryId: true,
      company: { select: { name: true } },
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
    },
  });

  const jobIds = jobs.map((j) => j.id);
  const [applications, proposals] = await Promise.all([
    jobIds.length
      ? prisma.application.findMany({
          where: { freelancerId: profile.id, jobId: { in: jobIds }, status: { not: "WITHDRAWN" } },
          select: { jobId: true },
        })
      : Promise.resolve([]),
    jobIds.length
      ? prisma.auditLog.findMany({
          where: { action: PROPOSAL_ACTION, entityType: "Job", entityId: { in: jobIds } },
          select: { entityId: true, metadata: true },
        })
      : Promise.resolve([]),
  ]);

  const appliedJobIds = new Set(applications.map((a) => a.jobId));
  const proposedJobIds = new Set(
    proposals
      .filter((p) => {
        try {
          return p.metadata ? JSON.parse(p.metadata).freelancerId === profile.id : false;
        } catch {
          return false;
        }
      })
      .map((p) => p.entityId)
      .filter((v): v is string => typeof v === "string"),
  );

  const freelancerSource: FreelancerMatchSource = {
    skills: profile.skills,
    credentials: profile.credentials,
    hourlyRate: profile.hourlyRate,
    workMode: profile.workMode,
    location: profile.location,
    maxTravelMinutes: profile.maxTravelMinutes,
    headline: profile.headline,
    bio: profile.bio,
    availability: profile.availability,
    availabilityWindows: profile.availabilityWindows,
    industries: profile.industries,
  };

  const suggestieJobs: SuggestieJob[] = jobs.map((j) => ({
    id: j.id,
    companyName: j.company.name,
    title: j.title,
    description: j.description,
    rateMin: j.rateMin,
    rateMax: j.rateMax,
    workMode: j.workMode,
    location: j.location,
    industryId: j.industryId,
    skills: j.skills,
    credentialRequirements: j.credentialRequirements,
  }));

  return buildDienstSuggesties(freelancerSource, suggestieJobs, appliedJobIds, proposedJobIds, now);
}
