import { AuthorizationError, requireActor } from "@/lib/authz";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { collaborationScheduleEvents } from "@/lib/calendar/schedule";
import { loadUserScheduleCollaborations } from "@/lib/calendar/user-schedule";
import { administrativeDeadlineEvents } from "@/lib/calendar/deadlines";
import { loadUserAdministrativeDeadlines } from "@/lib/calendar/user-deadlines";

// Agenda-export (.ics) van het eigen werkrooster: de actieve samenwerkingen van de ingelogde
// gebruiker worden server-side opgehaald en als RFC 5545-kalender teruggegeven. Alleen de eigen
// partij (opdrachtgever óf ZZP'er) — nooit andermans rooster. Het pad bevat geen punt, zodat de
// middleware-sessiebescherming geldt; daarbovenop dwingt requireActor() de auth hier af.
//
// Voor een automatisch bijgewerkt abonnement (webcal) gebruikt de UI /api/agenda/feed.ics met een
// stateless token; dit endpoint blijft de eenmalige, sessie-gebonden download.
export async function GET() {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }

  const [mapped, deadlines] = await Promise.all([
    loadUserScheduleCollaborations(actor.id),
    loadUserAdministrativeDeadlines(actor.id, actor.role),
  ]);

  const ics = buildIcsCalendar(
    [...collaborationScheduleEvents(mapped), ...administrativeDeadlineEvents(deadlines)],
    {
      prodId: "-//Handslag//Rooster//NL",
      calendarName: "Handslag — Rooster",
    },
  );

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rooster.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
