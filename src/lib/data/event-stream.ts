// Server-side query voor de domein-event-stream (ADMIN-toezicht). Leest het append-only
// `DomainEvent`-logboek begrensd uit en levert geparsete `StoredEvent`s aan de presentatielaag
// (`src/lib/event-stream.ts`). Read-only; geen mutatie.

import "server-only";
import { prisma } from "@/lib/db";
import { type DomainEventType, type StoredEvent } from "@/lib/events";

/** Harde bovengrens op het aantal geladen events (geen ongebonden findMany). */
export const EVENT_STREAM_LIMIT = 200;

function parsePayload(raw: string): Record<string, unknown> {
  try {
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * De recentste domein-events (nieuwste eerst), begrensd op {@link EVENT_STREAM_LIMIT}. De
 * presentatielaag groepeert ze per correlatie en filtert op categorie.
 */
export async function fetchRecentDomainEvents(): Promise<StoredEvent[]> {
  const rows = await prisma.domainEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: EVENT_STREAM_LIMIT,
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type as DomainEventType,
    actorRole: row.actorRole as StoredEvent["actorRole"],
    actorId: row.actorId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    payload: parsePayload(row.payload),
    correlationId: row.correlationId,
    dedupeKey: row.dedupeKey,
    occurredAt: row.occurredAt,
  }));
}
