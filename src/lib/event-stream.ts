// Presentatielaag voor de domein-event-stream (cascade-backbone) in het ADMIN-toezicht.
// Pure functies, geen I/O: NL-labels per event-type/actorrol, categorisatie (kern/zijpad/
// monitoring), groepering per correlatie (één cascade = contract -> urenstaat -> factuur ->
// betaling) en een samenvatting. De query leeft in `src/lib/data/event-stream.ts`.

import {
  DOMAIN_EVENT_TYPES,
  type ActorRole,
  type DomainEventType,
  type StoredEvent,
} from "@/lib/events";

// --- Labels -----------------------------------------------------------------

const DOMAIN_EVENT_LABELS: Record<DomainEventType, string> = {
  CONTRACT_SIGNED: "Contract getekend",
  PERFORMANCE_SUBMITTED: "Urenstaat/oplevering ingediend",
  PERFORMANCE_APPROVED: "Urenstaat/oplevering goedgekeurd",
  PERFORMANCE_REJECTED: "Urenstaat/oplevering afgekeurd",
  INVOICE_SUBMITTED: "Factuur ingediend",
  INVOICE_APPROVED: "Factuur goedgekeurd",
  INVOICE_REJECTED: "Factuur afgekeurd",
  PAYMENT_MARKED: "Betaling gemarkeerd",
  PAYMENT_CONFIRMED: "Ontvangst bevestigd",
  PAYMENT_OVERDUE: "Betaling te laat",
  PAYMENT_REMINDER: "Betaalherinnering verstuurd",
  INVOICE_CREDITED: "Creditfactuur opgemaakt",
  DISPUTE_OPENED: "Dispuut geopend",
  DISPUTE_RESOLVED: "Dispuut opgelost",
  PLATFORM_FEE_INVOICED: "Platformfee gefactureerd",
  DBA_SIGNAL_RAISED: "DBA-signaal geconstateerd",
};

/** NL-label voor een event-type; valt voor onbekende typen terug op een leesbare vorm. */
export function eventTypeLabel(type: string): string {
  return (
    DOMAIN_EVENT_LABELS[type as DomainEventType] ??
    type
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

const ACTOR_ROLE_LABELS: Record<ActorRole, string> = {
  FREELANCER: "ZZP'er",
  CLIENT: "Opdrachtgever",
  ADMIN: "Beheerder",
  FRANCHISER: "Bemiddelaar",
  SYSTEM: "Systeem",
};

/** NL-label voor de actorrol; valt voor onbekende waarden terug op de ruwe string. */
export function actorRoleLabel(role: string): string {
  return ACTOR_ROLE_LABELS[role as ActorRole] ?? role;
}

// --- Categorisatie ----------------------------------------------------------

export type EventCategory = "core" | "side" | "monitoring";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  core: "Hoofdcascade",
  side: "Zijpad",
  monitoring: "Monitoring",
};

const SIDE_PATH_TYPES = new Set<DomainEventType>([
  "PERFORMANCE_REJECTED",
  "INVOICE_REJECTED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REMINDER",
  "INVOICE_CREDITED",
  "DISPUTE_OPENED",
  "DISPUTE_RESOLVED",
  "PLATFORM_FEE_INVOICED",
]);

/** Kern (A-E), zijpad (afkeuren/credit/dispuut/herinnering/fee) of monitoring (DBA). */
export function eventCategory(type: string): EventCategory {
  if (type === "DBA_SIGNAL_RAISED") return "monitoring";
  if (SIDE_PATH_TYPES.has(type as DomainEventType)) return "side";
  return "core";
}

// --- Groepering per correlatie ----------------------------------------------

export interface EventChain {
  /** Correlatie-id van de cascade, of `null` voor losse events zonder keten. */
  correlationId: string | null;
  /** Events van deze keten, oplopend op `occurredAt` (oudste eerst). */
  events: StoredEvent[];
  /** Tijdstip van het eerste event in de keten. */
  firstAt: Date;
  /** Tijdstip van het laatste event in de keten. */
  latestAt: Date;
}

/**
 * Groepeer events tot ketens per `correlationId`, nieuwste keten eerst. Events zónder correlatie
 * vormen elk een eigen losse keten (ze horen bij niets anders). Binnen een keten oplopend op tijd;
 * bij gelijke tijd stabiel op id zodat de volgorde deterministisch is. Muteert de invoer niet.
 */
export function groupByCorrelation(events: StoredEvent[]): EventChain[] {
  const grouped = new Map<string, StoredEvent[]>();
  const singletons: StoredEvent[] = [];

  for (const event of events) {
    if (event.correlationId) {
      const bucket = grouped.get(event.correlationId);
      if (bucket) bucket.push(event);
      else grouped.set(event.correlationId, [event]);
    } else {
      singletons.push(event);
    }
  }

  const byTimeThenId = (a: StoredEvent, b: StoredEvent) =>
    a.occurredAt.getTime() - b.occurredAt.getTime() || a.id.localeCompare(b.id);

  const chains: EventChain[] = [];

  for (const [correlationId, bucket] of grouped) {
    const sorted = [...bucket].sort(byTimeThenId);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) continue; // buckets bevatten altijd ≥1 event; guard voor de typechecker
    chains.push({
      correlationId,
      events: sorted,
      firstAt: first.occurredAt,
      latestAt: last.occurredAt,
    });
  }

  for (const event of singletons) {
    chains.push({
      correlationId: null,
      events: [event],
      firstAt: event.occurredAt,
      latestAt: event.occurredAt,
    });
  }

  const lastId = (chain: EventChain) => chain.events[chain.events.length - 1]?.id ?? "";

  // Nieuwste keten bovenaan; bij gelijke tijd stabiel op het id van het laatste event.
  return chains.sort(
    (a, b) => b.latestAt.getTime() - a.latestAt.getTime() || lastId(b).localeCompare(lastId(a)),
  );
}

// --- Samenvatting -----------------------------------------------------------

export interface EventStreamSummary {
  /** Totaal aantal events in de selectie. */
  total: number;
  /** Aantal onderscheiden cascades (correlaties); losse events tellen elk als één. */
  cascades: number;
  /** Aantal events per categorie. */
  byCategory: Record<EventCategory, number>;
}

/** Tel events totaal, per categorie en het aantal onderscheiden cascades. Pure functie. */
export function summarizeEventStream(events: StoredEvent[]): EventStreamSummary {
  const byCategory: Record<EventCategory, number> = { core: 0, side: 0, monitoring: 0 };
  const correlations = new Set<string>();
  let looseEvents = 0;

  for (const event of events) {
    byCategory[eventCategory(event.type)] += 1;
    if (event.correlationId) correlations.add(event.correlationId);
    else looseEvents += 1;
  }

  return {
    total: events.length,
    cascades: correlations.size + looseEvents,
    byCategory,
  };
}

/** Alle event-typen met hun NL-label, in canonieke volgorde — voor de filter-UI. */
export const EVENT_TYPE_OPTIONS: ReadonlyArray<{ type: DomainEventType; label: string }> =
  DOMAIN_EVENT_TYPES.map((type) => ({ type, label: DOMAIN_EVENT_LABELS[type] }));
