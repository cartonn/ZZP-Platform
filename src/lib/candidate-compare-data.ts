// Gedeelde assemblage van de kandidaat-vergelijking op één opdracht. Zowel de vergelijk-pagina als
// de CSV-export leunen op deze ene bron van waarheid, zodat de geëxporteerde cijfers nooit driften
// van wat de opdrachtgever op het scherm ziet. Ownership-gepoort: alleen een eigen opdracht.
//
// Deze functie doet de I/O (drie gebatchte, subject-gescoopte queries — geen N+1) en leunt daarna
// volledig op de al bestaande pure motoren (matching/trust/availability/proximity/compare/ranking/
// applicant-field) voor de afleiding. Geen tweede afleidingslogica.

import { prisma } from "@/lib/db";
import { computeCompliance } from "@/lib/matching";
import { computeTrustLevel } from "@/lib/trust";
import { summarizeAvailability } from "@/lib/availability";
import { classifyStartFit, nextFitAfterStart, nextFitLabel } from "@/lib/candidate-availability";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { classifyCandidateProximity } from "@/lib/candidate-proximity";
import { getDeliveryQualityForProfiles } from "@/lib/data/freelancer-delivery-quality";
import { getReviewRatingsForCandidates } from "@/lib/data/candidate-reviews";
import { getSharedHistoryForCandidates } from "@/lib/data/candidate-history";
import {
  type CompareCandidate,
  type CandidateComparison,
  buildCandidateComparison,
} from "@/lib/candidate-compare";
import { type ApplicantFieldSummary, summarizeApplicantField } from "@/lib/applicant-field";
import { type CandidateRanking, rankCandidates } from "@/lib/candidate-ranking";
import {
  type AvailabilityWindowType,
  type CredentialType,
  type CredentialStatus,
} from "@/lib/enums";

// Alleen reacties die nog in de race zijn — afgewezen/ingetrokken kandidaten vergelijk je niet.
const ACTIVE_STATUSES = ["NEW", "VIEWED", "SHORTLIST", "ACCEPTED"] as const;
const MAX_COMPARE = 8;

export interface CandidateComparisonForJob {
  job: { id: string; title: string; startDate: Date | null };
  candidates: CompareCandidate[];
  comparison: CandidateComparison;
  ranking: CandidateRanking;
  field: ApplicantFieldSummary | null;
}

/**
 * Ownership-gate: alleen een opdracht van deze opdrachtgever. Onbekend/vreemd id → null (geen lek).
 */
export async function getCandidateComparisonForJob(
  actorId: string,
  jobId: string,
): Promise<CandidateComparisonForJob | null> {
  // Ownership-poort: alleen een eigen opdracht. Onbekend/vreemd id → null (geen lek).
  const job = await prisma.job.findFirst({
    where: { id: jobId, company: { userId: actorId } },
    select: {
      id: true,
      title: true,
      startDate: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
    },
  });
  if (!job) return null;

  const applications = await prisma.application.findMany({
    where: { jobId: job.id, status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { matchScore: "desc" },
    take: MAX_COMPARE,
    include: {
      freelancer: {
        select: {
          id: true,
          headline: true,
          visibility: true,
          location: true,
          user: { select: { id: true, name: true, identityVerifiedAt: true } },
          availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
    },
  });

  // Drie gebatchte, eigenaar-/subject-gescoopte queries (geen N+1), spiegel van /kandidaten:
  // leverbetrouwbaarheid, reputatie-sterren en de gedeelde historie met déze opdrachtgever.
  const [deliveryByProfile, ratingByUser, historyByProfile] = await Promise.all([
    getDeliveryQualityForProfiles(applications.map((a) => a.freelancer.id)),
    getReviewRatingsForCandidates(applications.map((a) => a.freelancer.user.id)),
    getSharedHistoryForCandidates(
      actorId,
      applications.map((a) => a.freelancer.id),
    ),
  ]);

  const requiredTypes = job.credentialRequirements
    .filter((r) => r.required)
    .map((r) => r.credentialType as CredentialType);
  const nowMs = Date.now();

  const candidates: CompareCandidate[] = applications.map((app) => {
    const creds = app.freelancer.credentials.map((c) => ({
      type: c.type as CredentialType,
      status: c.status as CredentialStatus,
      expiresAt: c.expiresAt,
    }));
    const compliance =
      requiredTypes.length > 0 ? computeCompliance(requiredTypes, creds).status : null;
    const trust = computeTrustLevel({
      identityVerified: !!app.freelancer.user.identityVerifiedAt,
      verifiedCredentialCount: creds.filter(
        (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > nowMs),
      ).length,
      mandatoryDocsComplete: mandatoryDocuments(creds).allSatisfied,
    });
    const delivery = deliveryByProfile.get(app.freelancer.id);
    const windows = app.freelancer.availabilityWindows.map((w) => ({
      ...w,
      type: w.type as AvailabilityWindowType,
    }));
    const startFit = job.startDate ? classifyStartFit(windows, job.startDate) : undefined;
    return {
      id: app.id,
      name: app.freelancer.user.name ?? "—",
      matchScore: app.matchScore,
      proposedRate: app.proposedRate,
      trustLevel: trust.level,
      complianceStatus: compliance,
      firstTimeRightRate:
        delivery && delivery.tone !== "INSUFFICIENT" ? delivery.firstTimeRightRate : null,
      available: !!summarizeAvailability(windows),
      startFit,
      // Niet inzetbaar op de startdatum? Reken de eerstvolgende vrije dag uit als plan-optie.
      nextFitLabel:
        startFit === "blocked" || startFit === "none"
          ? (() => {
              const nf = nextFitAfterStart(windows, job.startDate);
              return nf ? nextFitLabel(nf) : undefined;
            })()
          : undefined,
      // Reistijd naar de opdracht (#612). Pure schatting (geen serieel blokkerende externe call);
      // null bij remote of onbekende plaats — dan geen chip.
      proximity: classifyCandidateProximity({
        jobWorkMode: job.workMode,
        jobLocation: job.location,
        candidateLocation: app.freelancer.location,
      }),
      // Reputatie + rehire-signaal — al op /kandidaten aanwezig, nu ook naast elkaar.
      reviewRating: (() => {
        const r = ratingByUser.get(app.freelancer.user.id);
        return r && r.count > 0 ? { average: r.average, count: r.count } : null;
      })(),
      sharedHistory: historyByProfile.get(app.freelancer.id) ?? null,
    };
  });

  const comparison = buildCandidateComparison(candidates);
  const ranking = rankCandidates(candidates);
  // Poolsamenvatting: de "vorm van het veld" over exact de kandidaten die naast elkaar staan
  // (matchspreiding, compliant-deel, beschikbaar op de startdatum). Pure afleiding, geen extra query.
  const field = summarizeApplicantField(candidates);

  return {
    job: { id: job.id, title: job.title, startDate: job.startDate },
    candidates,
    comparison,
    ranking,
    field,
  };
}
