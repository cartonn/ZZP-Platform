// Domain-event laag (ARCHITECTURE.md §2.1). Vaste vorm voor elke betekenisvolle handeling;
// een append-only store + idempotentie maken het systeem "dynamisch" zonder dubbele gevolgen.
// Pure types + een in-memory store voor tests. De prisma-store leeft in `event-store.ts`.

import { z } from "zod";
import { USER_ROLES } from "@/lib/enums";

// Actor kan een rol zijn of het systeem (tijdgestuurde/afgeleide events).
export const ACTOR_ROLES = [...USER_ROLES, "SYSTEM"] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];
export const actorRoleSchema = z.enum(ACTOR_ROLES);

// De cascade-events (PLATFORM_OVERHAUL.md §4, Events A-F + zijpaden).
export const DOMAIN_EVENT_TYPES = [
  "CONTRACT_SIGNED", //          A
  "PERFORMANCE_SUBMITTED", //    B1 (urenstaat/oplevering ingediend)
  "PERFORMANCE_APPROVED", //     B2 (goedgekeurd -> concept-factuur)
  "PERFORMANCE_REJECTED", //     B2' (zijpad)
  "INVOICE_SUBMITTED", //        C  (ZZP'er dient factuur in)
  "INVOICE_APPROVED", //         D  (opdrachtgever keurt factuur goed)
  "INVOICE_REJECTED", //         D' (zijpad)
  "PAYMENT_MARKED", //           E  (gemarkeerd betaald)
  "PAYMENT_CONFIRMED", //        E  (ontvangst bevestigd)
  "PAYMENT_OVERDUE", //          zijpad: betaling te laat
  "PAYMENT_REMINDER", //         herinnering vóór de vervaldag (reminder-engine)
  "INVOICE_CREDITED", //         zijpad: creditfactuur
  "DISPUTE_OPENED", //           zijpad: dispuut/escalatie
  "PLATFORM_FEE_INVOICED", //    F  (optioneel, default uit)
  "DBA_SIGNAL_RAISED", //        DBA-monitoring (§6)
] as const;
export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];
export const domainEventTypeSchema = z.enum(DOMAIN_EVENT_TYPES);

/** Invoer voor het publiceren van een event. */
export interface DomainEventInput {
  type: DomainEventType;
  actorRole: ActorRole;
  actorId?: string | null;
  subjectType: string; //   bv. "Contract", "Invoice", "Performance"
  subjectId: string;
  payload?: Record<string, unknown>;
  /** Bindt een hele cascade aaneen (contract -> urenstaat -> factuur -> betaling). */
  correlationId?: string | null;
  /** Optionele idempotentiesleutel: hetzelfde logische event tweemaal publiceren = één event. */
  dedupeKey?: string | null;
  occurredAt?: Date;
}

/** Een opgeslagen event (payload geparsed). Onveranderlijk. */
export interface StoredEvent {
  id: string;
  type: DomainEventType;
  actorRole: ActorRole;
  actorId: string | null;
  subjectType: string;
  subjectId: string;
  payload: Record<string, unknown>;
  correlationId: string | null;
  dedupeKey: string | null;
  occurredAt: Date;
}

export interface AppendResult {
  /** False als het event al bestond (dedupe op `dedupeKey`). */
  created: boolean;
  event: StoredEvent;
}

/**
 * Persistentie-abstractie voor de event-bus. De runtime gebruikt een prisma-store; tests een
 * in-memory store. Idempotentie zit op twee niveaus: `append` dedupt op `dedupeKey`,
 * `claimHandler` zorgt dat een handler per event hooguit één keer draait.
 */
export interface EventStore {
  /** Voeg een event toe; dedupt op `dedupeKey` indien gezet. */
  append(input: DomainEventInput): Promise<AppendResult>;
  /** Claim een handler voor een event. True = nieuw geclaimd (draaien); false = al gedaan. */
  claimHandler(eventId: string, handler: string): Promise<boolean>;
  /** Geef een claim terug (bv. nadat een handler faalde) zodat hij opnieuw kan draaien. */
  releaseHandler(eventId: string, handler: string): Promise<void>;
  /** Alle events van één cascade, op tijd oplopend. */
  byCorrelation(correlationId: string): Promise<StoredEvent[]>;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `evt_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** In-memory store voor tests (deterministisch, geen DB). */
export class InMemoryEventStore implements EventStore {
  private events: StoredEvent[] = [];
  private byDedupe = new Map<string, StoredEvent>();
  private claims = new Set<string>(); // "eventId::handler"

  async append(input: DomainEventInput): Promise<AppendResult> {
    if (input.dedupeKey) {
      const existing = this.byDedupe.get(input.dedupeKey);
      if (existing) return { created: false, event: existing };
    }
    const event: StoredEvent = {
      id: nextId(),
      type: input.type,
      actorRole: input.actorRole,
      actorId: input.actorId ?? null,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      payload: input.payload ?? {},
      correlationId: input.correlationId ?? null,
      dedupeKey: input.dedupeKey ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    };
    this.events.push(event);
    if (event.dedupeKey) this.byDedupe.set(event.dedupeKey, event);
    return { created: true, event };
  }

  async claimHandler(eventId: string, handler: string): Promise<boolean> {
    const key = `${eventId}::${handler}`;
    if (this.claims.has(key)) return false;
    this.claims.add(key);
    return true;
  }

  async releaseHandler(eventId: string, handler: string): Promise<void> {
    this.claims.delete(`${eventId}::${handler}`);
  }

  async byCorrelation(correlationId: string): Promise<StoredEvent[]> {
    return this.events
      .filter((e) => e.correlationId === correlationId)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }

  /** Testhulp: alle events (kopie). */
  all(): StoredEvent[] {
    return [...this.events];
  }
}
