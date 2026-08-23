import { NextResponse } from "next/server";
import { AuthorizationError, requireActor } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { brokerAgendaEvents } from "@/lib/franchise/agenda";
import { loadBrokerAgenda } from "@/lib/data/franchise-agenda";
import { exportRateLimiter } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-guard";

// De route hangt van de sessie (cookies via requireActor) af en mag nooit statisch worden
// geoptimaliseerd — parity met de zuster-export-routes (o.a. franchise/zzpers/export).
export const dynamic = "force-dynamic";

// Bemiddelaar operations-agenda (.ics): de operationele roster-deadlines van de ingelogde FRANCHISER
// — aflopende plaatsingen + verlopende rostercertificaten — als RFC 5545-kalender. Alleen de eigen
// tenant (roster), sessie-gebonden download (geen publieke token-feed, zodat de gevoeligheid van een
// bearer-URL niet meegroeit met roster-brede data). Het pad bevat geen punt, zodat de middleware-
// sessiebescherming geldt; daarbovenop dwingt requireActor() de auth hier af.
export async function GET() {
  let actor;
  try {
    actor = await requireActor();
  } catch (e) {
    // Een mid-sessie geschorst/geanonimiseerd account houdt een geldige JWT (middleware laat door op
    // de stale claim), maar requireActor() leest vers uit de DB en werpt 401/403. Vang dat af tot een
    // nette response i.p.v. een rauwe 500 — parity met /api/agenda en de andere export-routes.
    if (e instanceof AuthorizationError) return new Response(e.message, { status: e.status });
    throw e;
  }
  if (actor.role !== "FRANCHISER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const limited = await enforceRateLimit(exportRateLimiter, `franchise-agenda:${actor.id}`);
  if (limited) return limited;

  const agenda = await loadBrokerAgenda(actor);
  const ics = buildIcsCalendar(brokerAgendaEvents(agenda), {
    prodId: "-//Handslag//Bemiddeling//NL",
    calendarName: "Handslag — Roosteragenda",
  });

  // AVG art. 5(2) (verantwoordingsplicht): leg de export van roster-PII vast — parity met de andere
  // franchise-export-routes. Zo is "wie exporteerde wat wanneer" traceerbaar. Geen PII in de metadata.
  await prisma.auditLog.create({
    data: auditData({
      actorId: actor.id,
      action: "FRANCHISE_AGENDA_EXPORTED",
      entityType: "Collaboration",
      entityId: "self",
      metadata: {
        collaborations: agenda.collaborations.length,
        credentials: agenda.credentials.length,
      },
    }),
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roosteragenda.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
