// Generieke toestandsmachine (CLAUDE.md regel 3: statusovergangen via expliciete map).
// Veralgemeniseert het bestaande `assert*Transition`-patroon (credentials/invoices/
// collaborations) tot één herbruikbare bouwsteen. Pure functies, geen I/O.
//
// Gebruik:
//   const sm = defineStateMachine("Invoice", { DRAFT: ["SENT"], SENT: ["PAID"], PAID: [] });
//   sm.assert("DRAFT", "SENT");   // ok
//   sm.assert("PAID", "DRAFT");   // gooit StateTransitionError

export class StateTransitionError extends Error {
  readonly entity: string;
  readonly from: string;
  readonly to: string;
  constructor(entity: string, from: string, to: string) {
    super(`Ongeldige ${entity}-statusovergang: ${from} -> ${to}`);
    this.name = "StateTransitionError";
    this.entity = entity;
    this.from = from;
    this.to = to;
  }
}

export interface StateMachine<S extends string> {
  /** Naam van de entiteit, voor heldere foutmeldingen. */
  readonly entity: string;
  /** Alle bekende toestanden. */
  readonly states: readonly S[];
  /** De volledige overgangsmap. */
  readonly transitions: Readonly<Record<S, readonly S[]>>;
  /** Is de overgang `from -> to` toegestaan? */
  can(from: S, to: S): boolean;
  /** Werp `StateTransitionError` als de overgang ongeldig is. */
  assert(from: S, to: S): void;
  /** Toegestane vervolgtoestanden vanuit `from`. */
  next(from: S): readonly S[];
  /** Is dit een eindtoestand (geen uitgaande overgangen)? */
  isTerminal(state: S): boolean;
  /** Is `value` een bekende toestand? (runtime guard) */
  isState(value: unknown): value is S;
}

/**
 * Bouwt een toestandsmachine uit een expliciete overgangsmap. De sleutels van `transitions`
 * vormen de complete verzameling toestanden; elke doeltoestand moet ook een sleutel zijn.
 */
export function defineStateMachine<S extends string>(
  entity: string,
  transitions: Record<S, readonly S[]>,
): StateMachine<S> {
  const states = Object.keys(transitions) as S[];
  const stateSet = new Set<string>(states);

  // Validatie bij definitie: geen overgang naar een onbekende toestand (vangt typefouten).
  for (const from of states) {
    for (const to of transitions[from]) {
      if (!stateSet.has(to)) {
        throw new Error(
          `${entity}: overgang ${from} -> ${to} verwijst naar onbekende toestand "${to}".`,
        );
      }
    }
  }

  function can(from: S, to: S): boolean {
    return (transitions[from] ?? []).includes(to);
  }

  return {
    entity,
    states,
    transitions,
    can,
    assert(from: S, to: S): void {
      if (!can(from, to)) throw new StateTransitionError(entity, from, to);
    },
    next(from: S): readonly S[] {
      return transitions[from] ?? [];
    },
    isTerminal(state: S): boolean {
      return (transitions[state] ?? []).length === 0;
    },
    isState(value: unknown): value is S {
      return typeof value === "string" && stateSet.has(value);
    },
  };
}
