// Server-side loader: haalt het werkrooster (actieve samenwerkingen) van één gebruiker op en mapt
// het naar de pure ScheduleCollaboration-projectie die de .ics-serialisatie voedt. Gedeeld door de
// sessie-export (/api/agenda) én de publieke abonneer-feed (/api/agenda/feed.ics), zodat beide
// exact hetzelfde rooster en dezelfde scoping gebruiken — alleen de eigen partij (opdrachtgever óf
// ZZP'er), nooit andermans rooster.

import { prisma } from "@/lib/db";
import { parseWeekdays } from "@/lib/weekdays";
import { type ScheduleCollaboration } from "@/lib/calendar/schedule";
import { type CollaborationStatus } from "@/lib/enums";

/**
 * Laadt de actieve samenwerkingen waarin `userId` deelneemt (als opdrachtgever of als ZZP'er) en
 * mapt ze naar ScheduleCollaboration. De tegenpartij-naam wordt bepaald vanuit het perspectief van
 * de gebruiker. Puur read-only; geen mutatie.
 */
export async function loadUserScheduleCollaborations(
  userId: string,
): Promise<ScheduleCollaboration[]> {
  const collaborations = await prisma.collaboration.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ company: { userId } }, { freelancer: { userId } }],
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      weekdays: true,
      job: { select: { title: true } },
      company: { select: { name: true, userId: true } },
      freelancer: { select: { user: { select: { name: true } } } },
    },
  });

  return collaborations.map((c) => {
    const isClient = c.company.userId === userId;
    const counterpartyName = isClient ? (c.freelancer.user.name ?? "") : c.company.name;
    return {
      id: c.id,
      jobTitle: c.job.title,
      counterpartyName,
      status: c.status as CollaborationStatus,
      startDate: c.startDate,
      endDate: c.endDate,
      weekdays: parseWeekdays(c.weekdays),
    };
  });
}
