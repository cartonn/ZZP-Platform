// Reactie-logica: statusovergangen (expliciete map) en plan-gating. Server-side waarheid.
// Pure functies, getest.

import { type ApplicationStatus } from "@/lib/enums";

export class ApplicationTransitionError extends Error {
  constructor(from: ApplicationStatus, to: ApplicationStatus) {
    super(`Ongeldige reactie-statusovergang: ${from} -> ${to}`);
    this.name = "ApplicationTransitionError";
  }
}

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  NEW: ["VIEWED", "SHORTLIST", "REJECTED", "ACCEPTED"],
  VIEWED: ["SHORTLIST", "REJECTED", "ACCEPTED"],
  SHORTLIST: ["ACCEPTED", "REJECTED", "VIEWED"],
  REJECTED: ["VIEWED", "SHORTLIST"], // heroverwegen
  ACCEPTED: ["SHORTLIST"], //           acceptatie terugdraaien
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from].includes(to);
}

export function assertApplicationTransition(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!canTransitionApplication(from, to)) throw new ApplicationTransitionError(from, to);
}

/**
 * Mag een freelancer nog reageren binnen zijn plan? `maxApplications === -1` = onbeperkt.
 * Server-side afgedwongen (CLAUDE.md regel 1).
 */
export function canApply(maxApplications: number, currentCount: number): boolean {
  if (maxApplications < 0) return true;
  return currentCount < maxApplications;
}
