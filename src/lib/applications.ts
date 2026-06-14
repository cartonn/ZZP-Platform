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

export type BulkTransitionItem = { id: string; from: ApplicationStatus };
export type BulkTransitionPlan = {
  /** ids whose `from -> to` is an allowed transition */
  eligible: string[];
  /** ids skipped because the transition is not allowed (incl. no-op from===to) */
  skipped: string[];
};

/** Pure: split a selection into the ids that may transition to `to` and those that may not.
 *  Server-side truth — the UI never decides eligibility. */
export function planBulkApplicationTransition(
  items: BulkTransitionItem[],
  to: ApplicationStatus,
): BulkTransitionPlan {
  const eligible: string[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    if (canTransitionApplication(item.from, to)) {
      eligible.push(item.id);
    } else {
      skipped.push(item.id);
    }
  }
  return { eligible, skipped };
}
