import { type NextRequest } from "next/server";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { collaborationScheduleEvents } from "@/lib/calendar/schedule";
import { loadUserScheduleCollaborations } from "@/lib/calendar/user-schedule";
import { verifyAgendaFeedToken } from "@/lib/calendar/feed-token";
import { shareTokenSecret } from "@/lib/share-token";

// Publieke, abonneerbare agenda-feed (webcal). Bewust GEEN sessie: een externe agenda-app
// (Google/Apple) haalt deze URL periodiek op en kan niet inloggen. In plaats daarvan draagt de
// URL een stateless HMAC-token (feed-token.ts) dat aan de gebruiker is gebonden. Het pad bevat een
// punt (`feed.ics`), waardoor de middleware-matcher het overslaat en dit endpoint publiek is —
// de tokenverificatie hieronder is de enige poort.
//
// Blootgestelde data = exact het eigen werkrooster van die gebruiker (jobtitel, tegenpartij,
// data/weekdagen), identiek aan de bestaande eenmalige export. Het token is een bearer-capability:
// wie de link heeft, ziet het rooster — net als de "geheime adres"-feeds van agenda-apps.
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("u");
  const token = request.nextUrl.searchParams.get("t");
  const secret = shareTokenSecret();

  // Ongeldig/ontbrekend token → 404 (geen onderscheid tussen "bestaat niet" en "fout token", zodat
  // de respons niets over het bestaan van een gebruiker prijsgeeft). Verificatie vóór elke DB-I/O.
  if (!userId || !token || !verifyAgendaFeedToken(userId, token, secret)) {
    return new Response("Niet gevonden", { status: 404 });
  }

  const mapped = await loadUserScheduleCollaborations(userId);

  const ics = buildIcsCalendar(collaborationScheduleEvents(mapped), {
    prodId: "-//ZZP Platform//Rooster//NL",
    calendarName: "ZZP Platform — Rooster",
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="rooster.ics"',
      // Kort cachebaar: agenda-apps pollen periodiek; laat een tussenliggende cache het even
      // vasthouden zonder het rooster te lang te laten verouderen.
      "Cache-Control": "private, max-age=300",
    },
  });
}
