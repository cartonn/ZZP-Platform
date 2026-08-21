// Forensische trail voor de publieke agenda-feed (`/api/agenda/feed.ics`) — AVG art. 5(2)
// (verantwoordingsplicht) / OWASP A09 (Security Logging & Monitoring Failures).
//
// De feed-URL draagt een niet-intrekbaar bearer-token en serveert derde-partij-PII: de namen van
// tegenpartijen in het werkrooster van de gebruiker. Zonder auditsignaal is een gelekt of gescraped
// feed-token forensisch onzichtbaar — er blijft niets over dan de ephemere in-memory rate-limit-
// tellers. Elke andere gevoelige weergaveroute (het vertrouwensdossier, documenten, DBA-dossiers)
// laat wél een spoor na; deze niet-intrekbare bearer-feed deed dat als enige niet.
//
// De feed wordt echter door externe agenda-apps (Google/Apple) periodiek gepolld — vaak elke paar
// minuten, ongoing. Per-poll auditen zou de trail overspoelen met ruis en zelf een opslag-/PII-
// probleem worden. Daarom gede-dupliceerd op (gebruiker, bron-IP, kalenderdag): hooguit één
// `AGENDA_FEED_VIEWED`-regel per distincte pollende of scrapende bron per dag. Zo wordt élke nieuwe
// bron (bv. een scraper vanaf een ander IP dan de legitieme agenda-app) precies één keer per dag
// vastgelegd — mét IP en user-agent — terwijl de normale poll-ruis wegvalt.

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export const AGENDA_FEED_VIEWED = "AGENDA_FEED_VIEWED";

/** Start van de UTC-kalenderdag van `now` — het dedup-venster (één regel per bron per dag). */
export function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Log één geslaagde weergave van de publieke agenda-feed, gede-dupliceerd per (gebruiker, IP, dag).
 * `now` wordt geïnjecteerd zodat het dedup-venster deterministisch en testbaar is. Alleen aanroepen
 * ná de token- én liveness-poort (een geldige, geautoriseerde serve) — een geweigerd verzoek mag
 * geen weergave-regel schrijven. Best-effort: een fout in de audit-schrijf mag de feed nooit breken.
 */
export async function auditAgendaFeedView(params: {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  now: Date;
}): Promise<void> {
  const { userId, ipAddress, userAgent, now } = params;

  // Bestaat er vandaag al een regel voor deze bron? Prisma vertaalt `ipAddress: null` naar `IS NULL`,
  // zodat ook de "onbekend IP"-bucket correct wordt gede-dupliceerd (geen ruis-explosie zonder IP).
  const already = await prisma.auditLog.findFirst({
    where: {
      action: AGENDA_FEED_VIEWED,
      entityType: "User",
      entityId: userId,
      ipAddress: ipAddress ?? null,
      createdAt: { gte: startOfUtcDay(now) },
    },
    select: { id: true },
  });
  if (already) return;

  await audit({
    actorId: null,
    action: AGENDA_FEED_VIEWED,
    entityType: "User",
    entityId: userId,
    ipAddress,
    userAgent,
  });
}
