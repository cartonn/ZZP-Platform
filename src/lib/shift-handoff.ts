// Shift-overname — pure regels (productbesluit 16-6-2026, concurrentie-backlog punt 3).
//
// Governance ("overname + goedkeuring"): de huidige ZZP'er van een ACTIEVE samenwerking biedt de
// inzet ter overname aan; de franchiser (tenant) of admin keurt de aanvraag goed of af. Dit spiegelt
// de no-show-governance (een melder opent, een beheerder beoordeelt).
//
// VEILIGE SCOPE (Wet-DBA): goedkeuring legt alléén de beslissing vast + informeert. Ze verplaatst geen
// contract/modelovereenkomst en herschikt de samenwerking niet. De feitelijke herplaatsing blijft via
// de bestaande annuleer/vervang-flow — een nieuwe ZZP'er heeft een eigen contract nodig.
//
// Pure functies — los unit-getest, geen DB/IO. Spiegelt het CREDENTIAL_TRANSITIONS-patroon (enums.ts).

import { type ShiftHandoffStatus } from "@/lib/enums";

// Expliciete overgangsmap (CLAUDE.md regel 3). Alleen een OPEN aanvraag kan een eindstatus krijgen;
// een afgehandelde aanvraag (goedgekeurd/afgewezen/ingetrokken) is terminaal — geen heropening.
export const SHIFT_HANDOFF_TRANSITIONS: Record<ShiftHandoffStatus, readonly ShiftHandoffStatus[]> =
  {
    OPEN: ["APPROVED", "REJECTED", "CANCELLED"],
    APPROVED: [],
    REJECTED: [],
    CANCELLED: [],
  };

export class ShiftHandoffTransitionError extends Error {
  readonly from: ShiftHandoffStatus;
  readonly to: ShiftHandoffStatus;
  constructor(from: ShiftHandoffStatus, to: ShiftHandoffStatus) {
    super(`Ongeldige overname-statusovergang: ${from} -> ${to}`);
    this.name = "ShiftHandoffTransitionError";
    this.from = from;
    this.to = to;
  }
}

/** Is de overgang `from -> to` toegestaan volgens de transitie-map? */
export function canTransitionHandoff(from: ShiftHandoffStatus, to: ShiftHandoffStatus): boolean {
  return SHIFT_HANDOFF_TRANSITIONS[from].includes(to);
}

/** Werp `ShiftHandoffTransitionError` als de overgang ongeldig is. Gebruik bij elke statuswijziging. */
export function assertHandoffTransition(from: ShiftHandoffStatus, to: ShiftHandoffStatus): void {
  if (!canTransitionHandoff(from, to)) {
    throw new ShiftHandoffTransitionError(from, to);
  }
}

export interface CanRequestHandoffInput {
  /** Status van de samenwerking. Alleen op een ACTIEVE inzet kan een overname worden aangevraagd. */
  collaborationStatus: string;
  /** Is de actor de huidige ZZP'er van deze samenwerking? Alleen die mag de overname openen. */
  isCurrentFreelancer: boolean;
}

/**
 * Mag deze actor een overname-aanvraag openen? Alleen de huidige ZZP'er van een ACTIEVE samenwerking.
 * (Het "max. één OPEN per samenwerking"-grens wordt server-side bij de mutatie afgedwongen, niet hier —
 * dat vereist een DB-lookup en valt buiten deze pure functie.)
 */
export function canRequestHandoff({
  collaborationStatus,
  isCurrentFreelancer,
}: CanRequestHandoffInput): boolean {
  return isCurrentFreelancer && collaborationStatus === "ACTIVE";
}
