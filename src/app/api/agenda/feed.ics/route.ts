import { type NextRequest } from "next/server";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { collaborationScheduleEvents } from "@/lib/calendar/schedule";
import { loadUserScheduleCollaborations } from "@/lib/calendar/user-schedule";
import { administrativeDeadlineEvents } from "@/lib/calendar/deadlines";
import { loadUserAdministrativeDeadlines } from "@/lib/calendar/user-deadlines";
import { type UserRole } from "@/lib/enums";
import { verifyAgendaFeedToken } from "@/lib/calendar/feed-token";
import { shareTokenSecret } from "@/lib/share-token";
import { agendaFeedRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";
import { requestMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";

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

  // Brute-force-/scrape-rem (security-review M-4, parity met het vertrouwensdossier): de route is
  // sessieloos en elke poging kost DB-I/O. VÓÓR de tokenverificatie zodat het gokken van de
  // feed-token-ruimte wordt afgeremd. Gekeyd op IP én de `u`-parameter (gebruiker-id uit de URL),
  // zodat één IP niet alle gebruikers-tokens sequentieel kan aftasten binnen één venster. Bij
  // overschrijding: 429 + Retry-After (enforceRateLimit), niet de 404-oracle — een limiet is geen
  // uitspraak over het bestaan van een gebruiker.
  const { ipAddress } = await requestMeta();
  const limited = await enforceRateLimit(
    agendaFeedRateLimiter,
    `${ipAddress ?? "onbekend"}|${userId ?? "onbekend"}`,
  );
  if (limited) return limited;

  // Ongeldig/ontbrekend token → 404 (geen onderscheid tussen "bestaat niet" en "fout token", zodat
  // de respons niets over het bestaan van een gebruiker prijsgeeft). Verificatie vóór elke DB-I/O.
  if (!userId || !token || !verifyAgendaFeedToken(userId, token, secret)) {
    return new Response("Niet gevonden", { status: 404 });
  }

  // Liveness-poort (CLAUDE.md regel 1: server-side status is de waarheid). Het HMAC-token is
  // deterministisch en per gebruiker onveranderlijk, dus een geldig token blijft ná schorsing of
  // anonimisering (AVG art. 17) geldig. De sessie-export (/api/agenda) snijdt zo'n account live af
  // via currentActor() (status !== ACTIVE of anonymizedAt → geen actor); deze publieke feed moet
  // dezelfde liveness afdwingen. Zonder deze check blijft een geschorst (bv. wegens fraude/misbruik)
  // of gewist account zijn werkrooster — inclusief de NAAM van de tegenpartij (derde-partij-PII) —
  // serveren op een publieke bearer-URL. 404 (niet 403) zodat de respons niets over het bestaan of
  // de status van het account prijsgeeft. Vóór elke DB-I/O van het rooster.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, anonymizedAt: true, role: true },
  });
  if (!user || user.anonymizedAt || user.status !== "ACTIVE") {
    return new Response("Niet gevonden", { status: 404 });
  }

  const [mapped, deadlines] = await Promise.all([
    loadUserScheduleCollaborations(userId),
    loadUserAdministrativeDeadlines(userId, user.role as UserRole),
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
      "Content-Disposition": 'inline; filename="rooster.ics"',
      // Kort cachebaar: agenda-apps pollen periodiek; laat een tussenliggende cache het even
      // vasthouden zonder het rooster te lang te laten verouderen.
      "Cache-Control": "private, max-age=300",
    },
  });
}
