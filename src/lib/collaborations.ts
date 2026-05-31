// Samenwerking-logica: statusovergangen via expliciete map (CLAUDE.md regel 3).
// Pure functies, getest.

import { type CollaborationStatus } from "@/lib/enums";

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
