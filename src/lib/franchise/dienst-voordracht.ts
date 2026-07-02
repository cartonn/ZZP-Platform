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
import { type FreelancerCredential } from "@/lib/matching";
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

/**
 * De roster-ZZP'ers van de tenant met hun inzetbaarheid + voordracht-/reactiestatus voor één dienst.
 * Read-only. Geeft `null` bij een dienst buiten de eigen tenant (isolatie) of onbekende tenant.
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
    select: { id: true, tenantId: true },
  });
  if (!job || job.tenantId !== tenantId) return null;

  const [freelancers, proposals, applications] = await Promise.all([
    prisma.freelancerProfile.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        headline: true,
        completeness: true,
        availability: true,
        user: { select: { name: true, identityVerifiedAt: true, lastLoginAt: true } },
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

  return freelancers.map((f) => {
    const eng = candidateEngageability(f, now);
    return {
      freelancerId: f.id,
      name: f.user.name ?? "—",
      headline: f.headline,
      engageabilityStatus: eng.status,
      engageabilityLabel: eng.label,
      blockers: eng.blockers,
      proposed: proposedIds.has(f.id),
      hasApplied: appliedIds.has(f.id),
    };
  });
}
