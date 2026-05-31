// Freelancer-zoekfunctionaliteit voor opdrachtgevers: server-berekende kaartdata +
// pure filterlogica. Toont alleen PUBLIC profielen; trust + beschikbaarheid server-side.

import { prisma } from "@/lib/db";
import { summarizeAvailability } from "@/lib/availability";
import { computeTrustLevel, type TrustLevel } from "@/lib/trust";

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
export async function getAllPublicFreelancers(): Promise<FreelancerCard[]> {
  const now = new Date();

  const profiles = await prisma.freelancerProfile.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: 300,
    include: {
      user: { select: { id: true, name: true, identityVerifiedAt: true } },
      skills: { include: { skill: { select: { id: true, name: true } } } },
      credentials: { select: { status: true, expiresAt: true } },
      availabilityWindows: { orderBy: { startDate: "asc" } },
    },
  });

  return profiles.map((p) => {
    const verifiedCredentialCount = p.credentials.filter(
      (c) => c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt > now),
    ).length;
    const trust = computeTrustLevel({
      identityVerified: !!p.user.identityVerifiedAt,
      verifiedCredentialCount,
    });
    const availability = summarizeAvailability(
      p.availabilityWindows as {
        startDate: Date;
        endDate: Date;
        type: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
      }[],
      now,
    );

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
    };
  });
}
