// Prisma-gebonden EventStore (runtime). Tests gebruiken InMemoryEventStore uit events.ts.
// Append-only; idempotentie via unieke `dedupeKey` (publicatie) en de EventHandlerRun-marker
// (handler). JSON-payload wordt als String opgeslagen (portabiliteit SQLite/Postgres).

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { EventBus } from "@/lib/event-bus";
import {
  type AppendResult,
  type DomainEventInput,
  type DomainEventType,
  type EventStore,
  type StoredEvent,
} from "@/lib/events";

type DomainEventRow = {
  id: string;
  type: string;
  actorRole: string;
  actorId: string | null;
  subjectType: string;
  subjectId: string;
  payload: string;
  correlationId: string | null;
  dedupeKey: string | null;
  occurredAt: Date;
};

function toStored(row: DomainEventRow): StoredEvent {
  let payload: Record<string, unknown> = {};
  try {
    payload = row.payload ? (JSON.parse(row.payload) as Record<string, unknown>) : {};
  } catch {
    payload = {};
  }
  return {
    id: row.id,
    type: row.type as DomainEventType,
    actorRole: row.actorRole as StoredEvent["actorRole"],
    actorId: row.actorId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    payload,
    correlationId: row.correlationId,
    dedupeKey: row.dedupeKey,
    occurredAt: row.occurredAt,
  };
}

export class PrismaEventStore implements EventStore {
  async append(input: DomainEventInput): Promise<AppendResult> {
    // Dedupe-check vooraf (snelle pad). De unieke index vangt de race alsnog af.
    if (input.dedupeKey) {
      const existing = await prisma.domainEvent.findUnique({
        where: { dedupeKey: input.dedupeKey },
      });
      if (existing) return { created: false, event: toStored(existing) };
    }

    try {
      const row = await prisma.domainEvent.create({
        data: {
          type: input.type,
          actorRole: input.actorRole,
          actorId: input.actorId ?? null,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          payload: JSON.stringify(input.payload ?? {}),
          correlationId: input.correlationId ?? null,
          dedupeKey: input.dedupeKey ?? null,
          occurredAt: input.occurredAt ?? new Date(),
        },
      });
      return { created: true, event: toStored(row) };
    } catch (err) {
      // Race op dedupeKey: een ander proces won. Lees het bestaande event.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        input.dedupeKey
      ) {
        const existing = await prisma.domainEvent.findUnique({
          where: { dedupeKey: input.dedupeKey },
        });
        if (existing) return { created: false, event: toStored(existing) };
      }
      throw err;
    }
  }

  async claimHandler(eventId: string, handler: string): Promise<boolean> {
    try {
      await prisma.eventHandlerRun.create({ data: { eventId, handler } });
      return true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return false; // al geclaimd
      }
      throw err;
    }
  }

  async releaseHandler(eventId: string, handler: string): Promise<void> {
    await prisma.eventHandlerRun.deleteMany({ where: { eventId, handler } });
  }

  async byCorrelation(correlationId: string): Promise<StoredEvent[]> {
    const rows = await prisma.domainEvent.findMany({
      where: { correlationId },
      orderBy: { occurredAt: "asc" },
    });
    return rows.map(toStored);
  }
}

// Eén bus per proces (singleton), net als de prisma-client. Handlers registreren zich hier
// (cascade-handlers volgen in Fase 3).
const globalForBus = globalThis as unknown as { eventBus?: EventBus };

export const eventBus = globalForBus.eventBus ?? new EventBus(new PrismaEventStore());

if (process.env.NODE_ENV !== "production") {
  globalForBus.eventBus = eventBus;
}
