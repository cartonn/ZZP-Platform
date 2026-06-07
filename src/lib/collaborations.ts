// Samenwerking-logica: statusovergangen via expliciete map (CLAUDE.md regel 3).
// Pure functies, getest.

import { type CollaborationStatus } from "@/lib/enums";
import { type ComplianceStatus } from "@/lib/matching";

/**
 * Inzetbaarheid-gate (ADR-0006, C-hybride). Een samenwerking mag pas ACTIEF worden als de ZZP'er aan
 * de harde certificaateisen van de opdracht voldoet. NON_COMPLIANT betekent: een vereist certificaat
 * ontbreekt of is verlopen — dan kan de samenwerking niet starten. WARNING ("in beoordeling" /
 * "verloopt binnenkort") blokkeert niet: reageren en plaatsen blijft mogelijk, het wordt nog verwerkt.
 */
export function complianceBlocksPlacement(status: ComplianceStatus): boolean {
  return status === "NON_COMPLIANT";
}

export class CollaborationTransitionError extends Error {
  constructor(from: CollaborationStatus, to: CollaborationStatus) {
    super(`Ongeldige samenwerking-statusovergang: ${from} -> ${to}`);
    this.name = "CollaborationTransitionError";
  }
}

export const COLLABORATION_TRANSITIONS: Record<
  CollaborationStatus,
  readonly CollaborationStatus[]
> = {
  PROPOSED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionCollaboration(
  from: CollaborationStatus,
  to: CollaborationStatus,
): boolean {
  return COLLABORATION_TRANSITIONS[from].includes(to);
}

export function assertCollaborationTransition(
  from: CollaborationStatus,
  to: CollaborationStatus,
): void {
  if (!canTransitionCollaboration(from, to)) throw new CollaborationTransitionError(from, to);
}
