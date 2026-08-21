import "server-only";
import { prisma } from "@/lib/db";
import { scoreJobForFreelancer, topGapReasonComplianceFirst } from "@/lib/matching";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";
import { summarizeJobReach, type ReachSummary } from "@/lib/job-reach";
import { summarizeReachBottleneck, type ReachBottleneck } from "@/lib/job-reach-bottleneck";

// Begrensde scan, gelijk aan de suggestie-scan (SCAN_LIMIT in suggestions.ts): houdt de
// kosten op een gepubliceerde opdracht-detail bounded, ook bij een grote tenant-pool.
const REACH_SCAN_LIMIT = 200;

/**
 * Bereik-indicatie voor de eigenaar van een gepubliceerde opdracht: de publiek-vindbare ZZP'ers
 * binnen dezelfde tenant die nog niet reageerden, gescoord met de verklaarbare matchmotor en
 * samengevat tot een bereik-niveau + sturingstip. Geeft `null` bij een onbekende of
 * niet-gepubliceerde opdracht (geen bereik te tonen). Spiegelt de scope van
 * `suggestedFreelancersForJob`: cross-tenant lekt nooit (altijd op `job.tenantId` gescoped).
 */
/** Bereik-samenvatting plus het grootste knelpunt (concrete sturingstip) voor de opdrachtgever. */
export type JobReach = ReachSummary & { bottleneck: ReachBottleneck | null };

export async function getJobReach(jobId: string): Promise<JobReach | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
      // Ingetrokken reacties uitsluiten: zo'n ZZP'er telt weer mee als bereik.
      applications: { where: { status: { not: "WITHDRAWN" } }, select: { freelancerId: true } },
    },
  });
  if (!job || job.status !== "PUBLISHED") return null;

  const applied = new Set(job.applications.map((a) => a.freelancerId));
  const profiles = await prisma.freelancerProfile.findMany({
    where: { ...discoverableFreelancerWhere, tenantId: job.tenantId },
    orderBy: { updatedAt: "desc" },
    take: REACH_SCAN_LIMIT,
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
      credentials: { select: { type: true, status: true, expiresAt: true } },
      industries: { select: { industryId: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
    },
  });

  const candidates = profiles
    .filter((p) => !applied.has(p.id))
    .map((p) => {
      // headline/bio + de opdrachttekst voeden de inhoudelijke aansluiting, zodat het bereik-signaal
      // dezelfde score gebruikt als de overige schermen.
      const match = scoreJobForFreelancer(job, {
        headline: p.headline,
        bio: p.bio,
        skills: p.skills,
        credentials: p.credentials,
        hourlyRate: p.hourlyRate,
        workMode: p.workMode,
        location: p.location,
        maxTravelMinutes: p.maxTravelMinutes,
        availability: p.availability,
        availabilityWindows: p.availabilityWindows,
        industries: p.industries,
      });
      return {
        score: match.score,
        available: match.availability.status === "AVAILABLE",
        // Zwaarst wegende minpunt (compliance-eerst) voedt het grootste-knelpunt-signaal.
        topGapLabel: topGapReasonComplianceFirst(match.reasons),
      };
    });

  return {
    ...summarizeJobReach(candidates),
    bottleneck: summarizeReachBottleneck(candidates),
  };
}
