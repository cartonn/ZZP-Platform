import { AuthorizationError, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { parseWeekdays } from "@/lib/weekdays";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { collaborationScheduleEvents, type ScheduleCollaboration } from "@/lib/calendar/schedule";
import { type CollaborationStatus } from "@/lib/enums";

// Agenda-export (.ics) van het eigen werkrooster: de actieve samenwerkingen van de ingelogde
// gebruiker worden server-side opgehaald en als RFC 5545-kalender teruggegeven. Alleen de eigen
// partij (opdrachtgever óf ZZP'er) — nooit andermans rooster. Het pad bevat geen punt, zodat de
// middleware-sessiebescherming geldt; daarbovenop dwingt requireActor() de auth hier af.
export async function GET() {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const collaborations = await prisma.collaboration.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ company: { userId: actor.id } }, { freelancer: { userId: actor.id } }],
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

  const mapped: ScheduleCollaboration[] = collaborations.map((c) => {
    const isClient = c.company.userId === actor.id;
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

  const ics = buildIcsCalendar(collaborationScheduleEvents(mapped), {
    prodId: "-//ZZP Platform//Rooster//NL",
    calendarName: "ZZP Platform — Rooster",
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rooster.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
