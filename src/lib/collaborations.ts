// Samenwerking-logica: statusovergangen via expliciete map (CLAUDE.md regel 3).
// Pure functies, getest.

import { type CollaborationStatus, type CredentialType } from "@/lib/enums";
import {
  computeCompliance,
  type ComplianceStatus,
  type FreelancerCredential,
} from "@/lib/matching";

/**
 * Inzetbaarheid-gate (ADR-0006, C-hybride). Een samenwerking mag pas ACTIEF worden als de ZZP'er aan
 * de harde certificaateisen van de opdracht voldoet. NON_COMPLIANT betekent: een vereist certificaat
 * ontbreekt of is verlopen — dan kan de samenwerking niet starten. WARNING ("in beoordeling" /
 * "verloopt binnenkort") blokkeert niet: reageren en plaatsen blijft mogelijk, het wordt nog verwerkt.
 */
export function complianceBlocksPlacement(status: ComplianceStatus): boolean {
  return status === "NON_COMPLIANT";
}

/**
 * Is de plaatsing van deze samenwerking geblokkeerd door een certificaat-gat? Spiegelt exact de
 * server-guard in `signContract` (contract-commands.ts): een vereist certificaat dat ontbreekt of
 * verlopen is → NON_COMPLIANT → tekenen wordt geweigerd. Gebruikt door de next-action-engine om de
 * "Onderteken"-taak te onderdrukken in precies deze staat — anders is dat een dode knop (de server
 * gooit, de samenwerking blijft PROPOSED, de taak verdwijnt nooit) die bovendien het
 * samenwerkingsdetail tegenspreekt, dat de teken-knop dan al verbergt. Pure functie, testbaar zonder
 * DB; zelfde `computeCompliance`-bron als de command-guard → kan niet driften.
 */
export function collaborationPlacementBlocked(
  requiredTypes: readonly CredentialType[],
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
): boolean {
  if (requiredTypes.length === 0) return false;
  return complianceBlocksPlacement(computeCompliance(requiredTypes, credentials, now).status);
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
