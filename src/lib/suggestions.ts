// Proactieve matching, kant van de opdrachtgever: bij een gepubliceerde opdracht herkent het
// systeem zélf welke (openbare) ZZP'ers passen en nog niet reageerden. Spiegelbeeld van
// recommendations.ts. Hergebruikt de server-berekende matchscore + compliance + vertrouwensniveau.
//
// Inhoudelijke (semantische) gelijkenis tussen opdracht en profiel voedt de matchscore als kleine,
// uitlegbare `semantic`-component (zie matching.ts) én dient als verklaring; de tiebreaker bij exact
// gelijke score blijft als secundaire sort.

import { prisma } from "@/lib/db";
import { awayUntil } from "@/lib/availability";
import {
  type Availability,
  type AvailabilityWindowType,
  type CredentialType,
  type CredentialStatus,
} from "@/lib/enums";
import {
  jobProfileRelatedness,
  scoreJobForFreelancer,
  SEMANTIC_HIGHLIGHT_THRESHOLD,
  type ComplianceStatus,
} from "@/lib/matching";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";
import { lockedInJobIds } from "@/lib/data/job-locked-in";

export interface FreelancerSuggestion {
  freelancerId: string;
  name: string;
  score: number;
  compliance: ComplianceStatus;
  trustLevel: TrustLevel;
  availability: Availability;
  /**
   * Einddatum van een lopende UNAVAILABLE-periode ("Afwezig t/m X"), of `null` als de ZZP'er nu niet
   * expliciet afwezig is. Los van `availability`: een lopend UNAVAILABLE-venster maakt de coarse status
   * misleidend (die kan op AVAILABLE staan of naar een tóékomstig inzetbaar venster wijzen), terwijl de
   * ZZP'er vandaag niet inzetbaar is. Zo tonen suggesties hetzelfde afwezigheidssignaal als het publieke
   * profiel (`/zzp/[id]`), `/kandidaten` en `/reacties` i.p.v. een tegensprekend "Beschikbaar".
   */
  awayUntil: Date | null;
  /** Korte functietitel/headline van de ZZP'er (bv. "Verpleegkundige (BIG)"). */
  headline: string | null;
  /** Standplaats. */
  location: string | null;
  /** Uurtarief in euro (heel getal), of null. */
  rate: number | null;
  /** Inhoudelijke gelijkenis met de opdracht, 0..1. Voedt de `semantic`-scorecomponent; tiebreaker bij gelijke score. */
  relatedness?: number;
  /** Sluit inhoudelijk sterk aan (boven de drempel) — voor de verklaring in de UI. */
  related?: boolean;
}

/** Drempel waaronder een ZZP'er niet relevant genoeg is om voor te stellen. */
export const SUGGESTION_MIN_SCORE = 70;
/** Maximaal aantal openbare profielen dat we scoren (begrenst het werk). */
const SCAN_LIMIT = 200;

/**
 * Vorm van een gescoorde opdracht: precies de velden die `scoreProfilesForJob` nodig heeft.
 * Komt overeen met de include op de query's hieronder (skills, credentialRequirements, industryId).
 */
interface ScorableJob {
  id: string;
  title: string;
  description: string | null;
  industryId: string | null;
  rateMin: number | null;
  rateMax: number | null;
  workMode: string;
  location: string | null;
  skills: ReadonlyArray<{ skillId: string; required: boolean; skill: { name: string } | null }>;
  credentialRequirements: ReadonlyArray<{ credentialType: string; required: boolean }>;
}

/**
 * Vorm van een geladen profiel: precies de include's van de profiel-pool-query. Gedeeld door de
 * per-opdracht- en de geaggregeerde (client) route, zodat één pool tegen meerdere opdrachten kan
 * worden gescoord zonder de zware findMany per opdracht te herhalen.
 */
interface ScorableProfile {
  id: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  hourlyRate: number | null;
  workMode: string;
  availability: string;
  maxTravelMinutes: number | null;
  user: { name: string | null; identityVerifiedAt: Date | null };
  skills: ReadonlyArray<{ skillId: string; skill: { name: string } | null }>;
  credentials: ReadonlyArray<{ type: string; status: string; expiresAt: Date | null }>;
  industries: ReadonlyArray<{ industryId: string }>;
  availabilityWindows: ReadonlyArray<{ startDate: Date; endDate: Date; type: string }>;
}

/** Prisma-select voor de profiel-pool. Gedeeld, zodat beide route's exact dezelfde velden laden. */
const PROFILE_POOL_SELECT = {
  id: true,
  headline: true,
  bio: true,
  location: true,
  hourlyRate: true,
  workMode: true,
  availability: true,
  maxTravelMinutes: true,
  user: { select: { name: true, identityVerifiedAt: true } },
  skills: { select: { skillId: true, skill: { select: { name: true } } } },
  credentials: { select: { type: true, status: true, expiresAt: true } },
  // Branche(s) van het profiel — voedt de branche-factor: een profiel uit een andere sector
  // dan de opdracht verschijnt niet meer bovenaan bij de opdrachtgever.
  industries: { select: { industryId: true } },
  availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
} as const;

/**
 * Scoort een geladen profiel-pool tegen één opdracht en levert de topsuggesties. Puur (geen I/O):
 * `scoreJobForFreelancer` + de semantische matcher zijn deterministisch. Zo kan dezelfde pool tegen
 * meerdere opdrachten worden gescoord zonder de findMany per opdracht te herhalen.
 *
 * `applied` = freelancerId's die al (niet-ingetrokken) op deze opdracht reageerden; die sluiten we uit.
 */
export function scoreProfilesForJob(
  job: ScorableJob,
  profiles: readonly ScorableProfile[],
  applied: ReadonlySet<string>,
  limit: number,
  now: number = Date.now(),
): FreelancerSuggestion[] {
  const scored: FreelancerSuggestion[] = profiles
    .filter((p) => !applied.has(p.id))
    .map((p) => {
      // Eén canonieke relatedness voor score (via scoreJobForFreelancer) én verklaring/tiebreaker.
      const relatedness = jobProfileRelatedness(
        { title: job.title, description: job.description },
        { headline: p.headline, bio: p.bio },
      );
      // Inhoudelijke aansluiting voedt de score als kleine, uitlegbare component (niet slechts een
      // tiebreaker). De tiebreaker in topSuggestions/mergeClientSuggestions blijft als secundaire sort.
      const match = scoreJobForFreelancer(job, { ...p, relatednessScore: relatedness });
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
      return {
        freelancerId: p.id,
        name: p.user.name ?? "—",
        score: match.score,
        compliance: match.compliance.status,
        trustLevel: trust.level,
        availability: match.availability.status,
        // Afgeleid uit dezelfde vensters die de matchscore voedt; `awayUntil` telt alleen een
        // UNAVAILABLE-venster dat `now` dekt (niet een toekomstige afwezigheid).
        awayUntil: awayUntil(
          p.availabilityWindows.map((w) => ({
            startDate: w.startDate,
            endDate: w.endDate,
            type: w.type as AvailabilityWindowType,
          })),
          new Date(now),
        ),
        headline: p.headline,
        location: p.location,
        rate: p.hourlyRate,
        relatedness,
        related: relatedness >= SEMANTIC_HIGHLIGHT_THRESHOLD,
      };
    });

  return topSuggestions(scored, { minScore: SUGGESTION_MIN_SCORE, limit });
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

  // Alle scoor-velden van de opdracht in één query, i.p.v. een tweede findUnique per opdracht.
  const jobs = await prisma.job.findMany({
    where: { companyId: company.id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      description: true,
      industryId: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      tenantId: true,
      status: true,
      skills: { select: { skillId: true, required: true, skill: { select: { name: true } } } },
      credentialRequirements: { select: { credentialType: true, required: true } },
      // Ingetrokken reacties uitsluiten: zo'n ZZP'er mag weer als suggestie verschijnen.
      applications: { where: { status: { not: "WITHDRAWN" } }, select: { freelancerId: true } },
    },
  });
  if (jobs.length === 0) return [];

  // Reeds-vergeven opdrachten uitsluiten: een opdracht met een vastgelegde kandidaat (ACCEPTED-reactie
  // in de propose-limbo) óf een niet-geannuleerde samenwerking vraagt niet langer om méér kandidaten.
  // Zonder deze poort suggereert de opdrachtgever-workspace ZZP'ers (en biedt "Nodig alle uit" aan) voor
  // een rol die al bezet is — terwijl dezelfde schermen de onbezet-/koud-signalen wél onderdrukken
  // (`getClientColdJobs`). Eén canonieke bron (`lockedInJobIds`), zodat de poort niet kan driften.
  const lockedIn = await lockedInJobIds(jobs.map((j) => j.id));
  const openJobs = jobs.filter((j) => j.status === "PUBLISHED" && !lockedIn.has(j.id));
  if (openJobs.length === 0) return [];

  // De profiel-pool is per opdracht identiek gescopet: `discoverableFreelancerWhere` heeft geen
  // opdracht-specifieke velden en `tenantId` is voor alle opdrachten van dit bedrijf dezelfde (Job.tenantId
  // is gedenormaliseerd uit Company.tenantId). We halen de pool daarom éénmaal per unieke tenantId op —
  // in de praktijk exact één query — i.p.v. dezelfde zware findMany tot 10× te herhalen. Mocht een
  // opdracht toch een afwijkende tenantId hebben (data-drift), dan krijgt die zijn eigen, correct
  // gescopete pool, zodat de uitkomst identiek blijft en cross-tenant PII nooit lekt. Alleen tenants
  // van nog-onvergeven opdrachten scannen — een tenant waarvan élke opdracht al bezet is, kost niets.
  const uniqueTenantIds = Array.from(new Set(openJobs.map((j) => j.tenantId)));
  const poolByTenant = new Map<string | null, ScorableProfile[]>();
  await Promise.all(
    uniqueTenantIds.map(async (tenantId) => {
      const profiles = await prisma.freelancerProfile.findMany({
        where: { ...discoverableFreelancerWhere, tenantId },
        orderBy: { updatedAt: "desc" },
        take: SCAN_LIMIT,
        select: PROFILE_POOL_SELECT,
      });
      poolByTenant.set(tenantId, profiles);
    }),
  );

  const now = Date.now();
  const all: ClientFreelancerSuggestion[] = [];
  for (const job of openJobs) {
    const pool = poolByTenant.get(job.tenantId) ?? [];
    const applied = new Set(job.applications.map((a) => a.freelancerId));
    const suggestions = scoreProfilesForJob(job, pool, applied, limit, now);
    for (const s of suggestions) {
      all.push({ ...s, jobId: job.id, jobTitle: job.title });
    }
  }

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

  // Reeds-vergeven opdracht: geen suggesties (en dus geen "Nodig alle uit"-uitnodigingen — die actie
  // gebruikt exact deze lijst als gezaghebbende kandidatenbron). Een opdracht blijft PUBLISHED zolang de
  // hire loopt (ACCEPTED-reactie in de propose-limbo óf een PROPOSED/ACTIVE-samenwerking), dus de
  // status-poort alleen laat een vergeven rol nog kandidaten werven — precies de asymmetrie die de
  // koud-/onbezet-signalen elders al dichten. Eén canonieke bron (`lockedInJobIds`) → geen drift. We
  // poorten vóór de profiel-scan, zodat een vergeven opdracht die zware findMany niet eens draait.
  if ((await lockedInJobIds([job.id])).has(job.id)) return [];

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
    select: PROFILE_POOL_SELECT,
  });

  return scoreProfilesForJob(job, profiles, applied, limit);
}
