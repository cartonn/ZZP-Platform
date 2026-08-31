import { prisma } from "@/lib/db";
import { findIdleCapacity, type IdleCapacity } from "@/lib/availability-gaps";
import { type AvailabilityWindowType, type CollaborationStatus } from "@/lib/enums";

/**
 * Laadt de onbenutte beschikbaarheid ("idle capacity") van één ZZP'er: de open dagen die de ZZP'er
 * deelde als inzetbaar (AVAILABLE/LIMITED) maar waar (nog) geen samenwerking op loopt. Spiegelt exact
 * hoe `/beschikbaarheid` de invoer bouwt (dezelfde vensters + PROPOSED/ACTIVE-samenwerkingen en de
 * standaard-horizon van `findIdleCapacity`), zodat er geen drift is tussen die kaart en deze loader.
 *
 * Server-side is de waarheid (CLAUDE.md regel 1): de berekening gebeurt in de pure lib
 * (`availability-gaps.ts`), deze loader levert alleen de eigenaar-gescoopte invoer. De query is
 * tenant-veilig gescoped op `freelancerProfileId` / `freelancerId` van het eigen profiel — nooit data
 * van andere ZZP'ers. De rol-gate ligt op de route.
 */
/**
 * Idle capacity voor een reeds-bekend FreelancerProfile-id. Skipt de profiel-lookup en wordt gebruikt
 * op het hot `freelancerTasks`-pad (`pending-tasks.ts`), waar het profiel al geladen is — zo blijft de
 * actielijst-aanroep één extra profiel-query bespaard en spiegelt hij exact de reeds-geladen invoer.
 */
export async function getIdleCapacityForProfile(
  profileId: string,
  now?: Date,
): Promise<IdleCapacity> {
  const [rows, collabRows] = await Promise.all([
    // unbounded-allow: kalenderaggregatie vereist alle vensters van eigenaar
    prisma.availabilityWindow.findMany({
      where: { freelancerProfileId: profileId },
      orderBy: { startDate: "asc" },
      select: { startDate: true, endDate: true, type: true },
    }),
    // unbounded-allow: eigenaar-scoped lopende samenwerkingen; inherent klein
    prisma.collaboration.findMany({
      where: { freelancerId: profileId, status: { in: ["PROPOSED", "ACTIVE"] } },
      select: { status: true, startDate: true, endDate: true },
    }),
  ]);

  const windows = rows.map((w) => ({ ...w, type: w.type as AvailabilityWindowType }));

  return findIdleCapacity(
    windows,
    collabRows.map((c) => ({
      status: c.status as CollaborationStatus,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
    now ?? new Date(),
  );
}

export async function getFreelancerIdleCapacity(userId: string, now?: Date): Promise<IdleCapacity> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) return { openRanges: [], totalOpenDays: 0, hasAny: false };

  return getIdleCapacityForProfile(profile.id, now);
}
