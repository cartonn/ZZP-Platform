// Freelancer-zoekfunctionaliteit voor opdrachtgevers: server-berekende kaartdata +
// pure filterlogica. Toont alleen PUBLIC profielen; trust + beschikbaarheid server-side.

import { prisma } from "@/lib/db";
import { discoverableFreelancerWhere } from "@/lib/freelancer-visibility";
import { summarizeAvailability } from "@/lib/availability";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { type Availability, type CredentialType, type CredentialStatus } from "@/lib/enums";
import { type FreelancerTrackRecord } from "@/lib/freelancer-track-record";

// Korte beschikbaarheidstekst uit het scalaire profielveld, als terugval wanneer er geen inzetbaar
// venster is. UNAVAILABLE/UNKNOWN geven (terecht) geen "beschikbaar"-signaal → null.
const SCALAR_AVAILABILITY_SUMMARY: Partial<Record<Availability, string>> = {
  AVAILABLE: "Direct beschikbaar",
  LIMITED: "Beperkt beschikbaar",
};

export interface FreelancerCard {
  id: string;
  userId: string;
  name: string;
  headline: string | null;
  location: string | null;
  workMode: string;
  skillIds: string[];
  skillLabels: string[];
  trustLevel: TrustLevel;
  availabilitySummary: string | null;
  hourlyRate: number | null;
  completeness: number;
  trackRecord: FreelancerTrackRecord;
}

export interface FreelancerSearchFilters {
  query?: string;
  skillIds?: string[];
  trustLevel?: TrustLevel | "";
  availableOnly?: boolean;
}

/** Pure filter over vooraf geladen kaartdata — testbaar zonder DB. */
export function applyFreelancerFilters(
  cards: FreelancerCard[],
  filters: FreelancerSearchFilters,
): FreelancerCard[] {
  let result = [...cards];

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.headline?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.skillLabels.some((s) => s.toLowerCase().includes(q)),
    );
  }

  if (filters.skillIds?.length) {
    result = result.filter((c) => filters.skillIds!.some((id) => c.skillIds.includes(id)));
  }

  if (filters.trustLevel) {
    result = result.filter((c) => c.trustLevel === filters.trustLevel);
  }

  if (filters.availableOnly) {
    result = result.filter((c) => c.availabilitySummary !== null);
  }

  return result;
}

/** Haalt alle publieke ZZP-profielen op; berekent trust + beschikbaarheid server-side. */
export async function getAllPublicFreelancers(
  tenantScope: { tenantId?: string | null } = {},
): Promise<FreelancerCard[]> {
  const now = new Date();

  const profiles = await prisma.freelancerProfile.findMany({
    where: { ...discoverableFreelancerWhere, ...tenantScope },
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: {
      user: { select: { id: true, name: true, identityVerifiedAt: true } },
      skills: { include: { skill: { select: { id: true, name: true } } } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
      availabilityWindows: { orderBy: { startDate: "asc" } },
    },
  });

  // ids is pas bekend ná de profiel-fetch → track-record-queries in een aparte Promise.all.
  const ids = profiles.map((p) => p.id);

  const [completedGroups, approvedHoursRows] = await Promise.all([
    prisma.collaboration.groupBy({
      by: ["freelancerId"],
      where: { status: "COMPLETED", freelancerId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.collaboration.findMany({
      where: { freelancerId: { in: ids } },
      select: {
        freelancerId: true,
        performances: {
          where: { status: "APPROVED", type: "HOURS" },
          select: { hours: true },
        },
      },
    }),
  ]);

  // Map: freelancerId → completedCollaborations
  const completedMap = new Map<string, number>(
    completedGroups.map((g) => [g.freelancerId, g._count._all]),
  );

  // Map: freelancerId → approvedHours (som van alle APPROVED HOURS performances)
  const hoursMap = new Map<string, number>();
  for (const row of approvedHoursRows) {
    const sum = row.performances.reduce((acc, perf) => acc + (perf.hours ?? 0), 0);
    hoursMap.set(row.freelancerId, (hoursMap.get(row.freelancerId) ?? 0) + sum);
  }

  return profiles.map((p) => {
    const verifiedCredentialCount = p.credentials.filter(
      (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt > now),
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
    // Val terug op het scalaire beschikbaarheidsveld als er geen inzetbaar venster is — anders is een
    // ZZP'er die "Direct beschikbaar" koos maar (nog) geen venster invulde ten onrechte onzichtbaar
    // bij "Alleen beschikbaar" en zonder badge, terwijl de matching-engine hem wél als beschikbaar
    // telt. Spiegelt de scalar-fallback in matching.ts.
    const availability =
      summarizeAvailability(
        p.availabilityWindows as {
          startDate: Date;
          endDate: Date;
          type: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
        }[],
        now,
      ) ??
      SCALAR_AVAILABILITY_SUMMARY[p.availability as Availability] ??
      null;

    const trackRecord: FreelancerTrackRecord = {
      completedCollaborations: completedMap.get(p.id) ?? 0,
      approvedHours: hoursMap.get(p.id) ?? 0,
    };

    return {
      id: p.id,
      userId: p.user.id,
      name: p.user.name ?? "—",
      headline: p.headline ?? null,
      location: p.location ?? null,
      workMode: p.workMode,
      skillIds: p.skills.map((s) => s.skill.id),
      skillLabels: p.skills.map((s) => s.skill.name),
      trustLevel: trust.level,
      availabilitySummary: availability,
      hourlyRate: p.hourlyRate,
      completeness: p.completeness,
      trackRecord,
    };
  });
}
