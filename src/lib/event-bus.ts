// In-process event-bus (ARCHITECTURE.md §2.1). Handlers registreren zich op een event-type;
// `publish` persisteert het event via de EventStore en draait de handlers idempotent.
//
// Idempotentie:
//  - `append` dedupt op `dedupeKey` (publicatieniveau).
//  - per handler claimt de bus het event (`claimHandler`); een al-geclaimde handler draait niet
//    opnieuw. Faalt een handler, dan geeft de bus de claim terug zodat hij bij replay opnieuw
//    kan draaien. Zo levert een event tweemaal verwerken nooit dubbele gevolgen op.

import {
  type DomainEventInput,
  type DomainEventType,
  type EventStore,
  type StoredEvent,
} from "@/lib/events";

/** Een handler reageert op een event met vervolgacties (de cascade). */
export type EventHandlerFn = (event: StoredEvent) => Promise<void> | void;

export interface RegisteredHandler {
  /** Unieke, stabiele naam — gebruikt als idempotentie-claim. Wijzig niet lichtvaardig. */
  name: string;
  type: DomainEventType;
  handle: EventHandlerFn;
}

export interface PublishResult {
  event: StoredEvent;
  /** False als het event al bestond (dedupe). */
  created: boolean;
  handlersRun: string[];
  handlersSkipped: string[];
}

export class EventBus {
  private handlers = new Map<DomainEventType, RegisteredHandler[]>();

  constructor(private readonly store: EventStore) {}

  /** Registreer een handler. Eén handlernaam per event-type (dubbele naam = fout). */
  register(handler: RegisteredHandler): void {
    const list = this.handlers.get(handler.type) ?? [];
    if (list.some((h) => h.name === handler.name)) {
      throw new Error(
        `Handler "${handler.name}" is al geregistreerd voor event "${handler.type}".`,
      );
    }
    list.push(handler);
    this.handlers.set(handler.type, list);
  }

  /** Geregistreerde handlers voor een type (kopie). */
  handlersFor(type: DomainEventType): RegisteredHandler[] {
    return [...(this.handlers.get(type) ?? [])];
  }

  /**
   * Publiceer een event en draai de handlers idempotent. Een al-bestaand event (dedupe) draait
   * alsnog de nog-niet-geclaimde handlers — zo herstelt een onderbroken cascade zich bij replay.
   */
  async publish(input: DomainEventInput): Promise<PublishResult> {
    const { created, event } = await this.store.append(input);
    const handlersRun: string[] = [];
    const handlersSkipped: string[] = [];

    for (const handler of this.handlers.get(event.type) ?? []) {
      const claimed = await this.store.claimHandler(event.id, handler.name);
      if (!claimed) {
        handlersSkipped.push(handler.name);
        continue;
      }
      try {
        await handler.handle(event);
        handlersRun.push(handler.name);
      } catch (err) {
        // Claim teruggeven zodat de handler bij een volgende publish/replay opnieuw draait.
        await this.store.releaseHandler(event.id, handler.name);
        throw err;
      }
    }

    return { event, created, handlersRun, handlersSkipped };
  }
}
