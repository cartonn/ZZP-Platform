// Geplande runner die verlopen routing-cacherijen (GeocodeCache, TravelRouteCache) HARD verwijdert.
// Beide tabellen bewaren PLATTE-TEKST locatiegegevens (query, fromQuery, toQuery) die naar Geoapify
// zijn gestuurd of daaruit zijn afgeleid — persoonsgegevens (herleidbare adres-/plaatsindicaties van
// ZZP'ers en opdrachten). Elke rij heeft een `expiresAt`, maar de leeslaag negeert verlopen rijen
// alleen LAZY (routing.ts): fysiek blijven ze staan, dus platte-tekst-locatie-PII stapelt zich voorbij
// de eigen TTL eindeloos op. Deze sweep dwingt de opslagbeperking (AVG art. 5(1)(e)) af door rijen met
// `expiresAt < now` daadwerkelijk te verwijderen uit BEIDE tabellen. Idempotent: een tweede run met
// dezelfde klok verwijdert niets meer. Werkt op SQLite én PostgreSQL (id-select per batch + deleteMany,
// want Prisma's deleteMany kent geen limit).

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";

export interface RoutingCacheRetentionResult {
  geocodePruned: number;
  routePruned: number;
}

/**
 * De canonieke where-vorm voor "snoeibare" routing-cacherijen: alles waarvan de eigen TTL (`expiresAt`)
 * vóór de cutoff ligt. Eén bron van waarheid, gedeeld door de snoeitaak (delete) én de
 * `/api/metrics`-backlog-gauge (count) — zowel `GeocodeCache` als `TravelRouteCache` dragen hetzelfde
 * `expiresAt`-veld, dus dezelfde vorm dekt beide tabellen. Zo kan de gauge niet driften t.o.v. de taak.
 * Anders dan de config-gevensterde retenties (audit/reacties/...) is er hier GEEN instelvenster: de TTL
 * zit per rij ingebakken, dus retentie is altijd "aan" en de cutoff is simpelweg `now`.
 */
export function prunableRoutingCacheWhere(cutoff: Date): { expiresAt: { lt: Date } } {
  return { expiresAt: { lt: cutoff } };
}

// Verwijder in begrensde batches i.p.v. één grote deleteMany: houdt de transactie/lock kort en
// voorkomt geheugendruk op een mogelijk grote cachetabel.
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een grote achterstand nooit één run oneindig
// laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

async function pruneGeocode(cutoff: Date): Promise<number> {
  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.geocodeCache.findMany({
      where: prunableRoutingCacheWhere(cutoff),
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.geocodeCache.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
    pruned += count;

    if (stale.length < BATCH_SIZE) break;
  }
  return pruned;
}

async function pruneRoute(cutoff: Date): Promise<number> {
  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.travelRouteCache.findMany({
      where: prunableRoutingCacheWhere(cutoff),
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.travelRouteCache.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
    pruned += count;

    if (stale.length < BATCH_SIZE) break;
  }
  return pruned;
}

export async function runRoutingCacheRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<RoutingCacheRetentionResult> {
  const now = opts.now ?? new Date();

  const geocodePruned = await pruneGeocode(now);
  const routePruned = await pruneRoute(now);

  // Registreer de snoei-actie voor operationele traceerbaarheid (art. 5(2) verantwoordingsplicht).
  // Geen PII: alleen aantallen + cutoff. Alleen bij daadwerkelijk snoeien, zodat een lege run de
  // auditlog niet vervuilt.
  if (geocodePruned > 0 || routePruned > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "ROUTING_CACHE_PRUNED",
        entityType: "GeocodeCache",
        entityId: "retention",
        metadata: { geocodePruned, routePruned, cutoff: now.toISOString() },
      }),
    });
  }

  return { geocodePruned, routePruned };
}
