// Voordragen uit het roster: de bemiddelaar (FRANCHISER) draagt een eigen roster-ZZP'er voor op een
// open dienst binnen de eigen tenant. Een voordracht plaatst GEEN reactie namens de ZZP'er (die
// behoudt de regie): het is een uitnodiging + een gezaghebbend voordracht-auditrecord + een
// notificatie die de ZZP'er vraagt zelf te reageren. Server-side is de waarheid — de inzetbaarheid
// (computeEngageability) wordt hier opnieuw berekend; een INACTIEF-ZZP'er kan niet worden voorgedragen.
//
// Deze module bevat de data-laag + pure beslislogica los van de server-action, zodat de
// authz-/inzetbaarheids-/idempotentie-regels los te testen zijn.

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type Availability } from "@/lib/enums";
import {
  type FreelancerCredential,
  type JobMatchSource,
  type FreelancerMatchSource,
  scoreJobForFreelancer,
  topGapReasonComplianceFirst,
} from "@/lib/matching";
import { computeEngageability } from "@/lib/engageability";

/** Het voordracht-auditrecord is de gezaghebbende markering (zoals POOL_INVITED bij publicatie). */
export const PROPOSAL_ACTION = "FRANCHISE_FREELANCER_PROPOSED";

export interface RosterCandidate {
  freelancerId: string;
  name: string;
  headline: string | null;
  /** Inzetbaarheid — INACTIEF ⇒ voordragen server-side geweigerd. */
  engageabilityStatus: "ACTIEF" | "AANDACHT" | "INACTIEF";
  engageabilityLabel: string;
  /** Harde reden(en) waarom (nog) niet inzetbaar (bv. "VOG ontbreekt"). */
  blockers: string[];
  /** Server-berekende matchscore (0-100) van deze ZZP'er voor déze dienst. */
  matchScore: number;
  /** Sterkste positieve matchreden (troef), of `null`. */
  topReason: string | null;
  /** Grootste matchkloof (minpunt), of `null`. */
  topGap: string | null;
  /** Al voorgedragen voor deze dienst (voordracht-audit aanwezig). */
  proposed: boolean;
  /** ZZP'er heeft zelf al gereageerd (Application, niet ingetrokken). */
  hasApplied: boolean;
}

export type ProposeResult = { ok: true; already: boolean } | { ok: false; error: string };

interface EngageabilitySource {
  completeness: number;
  availability: string;
  credentials: { type: string; status: string; expiresAt: Date | null }[];
  user: { identityVerifiedAt: Date | null; lastLoginAt: Date | null };
}

/** Bouwt een engageability-resultaat uit een roster-profiel (dezelfde bron als /franchise/zzpers). */
export function candidateEngageability(f: EngageabilitySource, now: Date = new Date()) {
  return computeEngageability(
    {
      credentials: f.credentials.map(
        (c): FreelancerCredential => ({
          type: c.type as FreelancerCredential["type"],
          status: c.status as FreelancerCredential["status"],
          expiresAt: c.expiresAt,
        }),
      ),
      completeness: f.completeness,
      availability: f.availability as Availability,
      identityVerified: f.user.identityVerifiedAt != null,
      lastActiveAt: f.user.lastLoginAt,
    },
    now,
  );
}

/** Roster-profiel met alles wat inzetbaarheid én matchscore nodig hebben (één laad-vorm). */
export interface RosterFreelancerSource extends EngageabilitySource {
  id: string;
  headline: string | null;
  bio: string | null;
  hourlyRate: number | null;
  workMode: string;
  location: string | null;
  maxTravelMinutes: number | null;
  user: EngageabilitySource["user"] & { name: string | null };
  skills: { skillId: string }[];
  industries: { industryId: string }[];
  availabilityWindows: { startDate: Date; endDate: Date; type: string }[];
}

/**
 * Pure kern: rangschik de roster-ZZP'ers op matchkwaliteit voor déze dienst. Elke ZZP'er krijgt zijn
 * inzetbaarheid (`computeEngageability`) én zijn server-berekende matchscore + troef/minpunt
 * (`scoreJobForFreelancer`, dezelfde motor als de Reacties-lijst en `/kandidaten`). Sortering: eerst
 * de voordraagbare ZZP'ers (INACTIEF is server-side geweigerd, dus onderaan), daarbinnen aflopende
 * matchscore, tiebreak op naam. Los van de DB-laag testbaar.
 */
export function buildRosterCandidates(
  job: JobMatchSource,
  freelancers: readonly RosterFreelancerSource[],
  proposedIds: ReadonlySet<string>,
  appliedIds: ReadonlySet<string>,
  now: Date = new Date(),
): RosterCandidate[] {
  return freelancers
    .map((f): RosterCandidate => {
      const eng = candidateEngageability(f, now);
      const source: FreelancerMatchSource = {
        skills: f.skills,
        credentials: f.credentials,
        hourlyRate: f.hourlyRate,
        workMode: f.workMode,
        location: f.location,
        maxTravelMinutes: f.maxTravelMinutes,
        headline: f.headline,
        bio: f.bio,
        availability: f.availability,
        availabilityWindows: f.availabilityWindows,
        industries: f.industries,
      };
      const match = scoreJobForFreelancer(job, source, now);
      return {
        freelancerId: f.id,
        name: f.user.name ?? "—",
        headline: f.headline,
        engageabilityStatus: eng.status,
        engageabilityLabel: eng.label,
        blockers: eng.blockers,
        matchScore: match.score,
        topReason: match.reasons.find((r) => r.kind === "positive")?.label ?? null,
        // Een compliance-kloof (bv. "Mist vereist certificaat") staat altijd bovenaan — voor de
        // bemiddelaar is een ontbrekend verplicht bewijsstuk het zwaarste signaal.
        topGap: topGapReasonComplianceFirst(match.reasons),
        proposed: proposedIds.has(f.id),
        hasApplied: appliedIds.has(f.id),
      };
    })
    .sort((a, b) => {
      // Voordraagbare ZZP'ers bovenaan (INACTIEF kan niet worden voorgedragen), dan hoogste match.
      const aBlocked = a.engageabilityStatus === "INACTIEF" ? 1 : 0;
      const bBlocked = b.engageabilityStatus === "INACTIEF" ? 1 : 0;
      if (aBlocked !== bBlocked) return aBlocked - bBlocked;
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.name.localeCompare(b.name, "nl");
    });
}

/**
 * De roster-ZZP'ers van de tenant met hun inzetbaarheid, matchscore + voordracht-/reactiestatus voor
 * één dienst, gerangschikt op matchkwaliteit. Read-only. Geeft `null` bij een dienst buiten de eigen
 * tenant (isolatie) of onbekende tenant.
 */
export async function getRosterCandidatesForDienst(
  actor: Actor,
  jobId: string,
  now: Date = new Date(),
): Promise<RosterCandidate[] | null> {
  const tenantId = actor.tenantId;
  if (!tenantId) return null;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      tenantId: true,
      title: true,
      description: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      industryId: true,
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
    },
  });
  if (!job || job.tenantId !== tenantId) return null;

  const [freelancers, proposals, applications] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        headline: true,
        bio: true,
        completeness: true,
        availability: true,
        hourlyRate: true,
        workMode: true,
        location: true,
        maxTravelMinutes: true,
        user: { select: { name: true, identityVerifiedAt: true, lastLoginAt: true } },
        skills: { select: { skillId: true } },
        industries: { select: { industryId: true } },
        availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
      },
    }),
    // Gezaghebbende voordracht-markering: het auditrecord per ZZP'er voor deze dienst.
    prisma.auditLog.findMany({
      where: { action: PROPOSAL_ACTION, entityType: "Job", entityId: jobId },
      select: { metadata: true },
    }),
    prisma.application.findMany({
      where: { jobId, status: { not: "WITHDRAWN" } },
      select: { freelancerId: true },
    }),
  ]);

  const proposedIds = new Set(
    proposals
      .map((p) => {
        try {
          return p.metadata ? (JSON.parse(p.metadata).freelancerId as string) : null;
        } catch {
          return null;
        }
      })
      .filter((v): v is string => typeof v === "string"),
  );
  const appliedIds = new Set(applications.map((a) => a.freelancerId));

  return buildRosterCandidates(job, freelancers, proposedIds, appliedIds, now);
}
