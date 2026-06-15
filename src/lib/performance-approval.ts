// Prestatie-goedkeuring: doorlooptijd-helpers voor de cascade-stap B
// (urenstaat/oplevering → goedkeuring door de opdrachtgever). Puur en testbaar
// zonder DB. Een ingediende prestatie die blijft liggen stalt de hele
// facturatiecascade (geen concept-factuur, geen betaling); dit maakt zichtbaar
// hoe lang er al gewacht wordt zodat de opdrachtgever tijdig keurt.
//
// De generieke dag-/labelhelpers worden gedeeld met de verificatie-wachtrij —
// "vandaag ingediend" / "N dagen wachtend" geldt voor beide wachtrijen.
import { daysWaiting, waitingLabel } from "@/lib/verification-queue";

export { daysWaiting, waitingLabel };

/** Vanaf hoeveel hele dagen een ingediende prestatie "te lang" op goedkeuring wacht. */
export const PERFORMANCE_APPROVAL_STALE_DAYS = 3;

export interface PerformanceApprovalHealth {
  /** Aantal prestaties dat op goedkeuring wacht. */
  pending: number;
  /** Dagen dat de langst wachtende prestatie wacht (0 bij een lege wachtrij). */
  oldestDays: number;
  /** Aantal prestaties dat al >= PERFORMANCE_APPROVAL_STALE_DAYS wacht. */
  staleCount: number;
}

/**
 * Vat de wachtrij van ingediende prestaties samen. Items zonder `submittedAt`
 * (nog niet ingediend) worden genegeerd; de invoer hoeft niet gesorteerd te zijn
 * en wordt niet gemuteerd.
 */
export function summarizePerformanceApproval(
  items: ReadonlyArray<{ submittedAt: Date | null }>,
  now: Date | number,
): PerformanceApprovalHealth {
  let pending = 0;
  let oldestDays = 0;
  let staleCount = 0;
  for (const item of items) {
    if (!item.submittedAt) continue;
    pending += 1;
    const days = daysWaiting(item.submittedAt, now);
    if (days > oldestDays) oldestDays = days;
    if (days >= PERFORMANCE_APPROVAL_STALE_DAYS) staleCount += 1;
  }
  return { pending, oldestDays, staleCount };
}
