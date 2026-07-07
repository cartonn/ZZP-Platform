// Handmatige betaalherinnering: de ZZP'er (crediteur) kan de opdrachtgever eenmalig per
// afkoelperiode aan een openstaande, verzonden factuur herinneren — een in-platform nudge
// náást de automatische aanmaningsladder (payment-reminders.ts) en het aanmaning-sjabloon
// (aanmaning.ts). Puur en deterministisch; geen geldstroom (Besluit 1): dit is statusregistratie
// + signalering, geen incasso. De server is de waarheid — of een herinnering mag, hangt af van de
// echte factuurstatus en de laatste herinnering, nooit van de client.

import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { daysOverdue } from "@/lib/payment-reminders";
import { DAY_MS } from "@/lib/date-boundary";

/** Minimale afkoelperiode (dagen) tussen twee handmatige herinneringen op dezelfde factuur. */
export const MANUAL_REMINDER_COOLDOWN_DAYS = 2;

// Cascade-lifecycle-statussen waarbij de opdrachtgever nog moet betalen.
const AWAITING_PAYMENT_LIFECYCLE: readonly InvoiceLifecycleState[] = ["APPROVED", "OVERDUE"];

export interface ManualReminderInput {
  /** Is de actor de crediteur (ZZP'er/uitschrijver) van deze factuur? */
  isFreelancerOwner: boolean;
  /** Legacy `InvoiceStatus` (voor losse facturen). */
  status: string;
  /** Cascade-lifecycle (null voor een losse factuur). */
  lifecycleStatus: InvoiceLifecycleState | null;
  /** Wanneer de factuur is uitgereikt; `null` = nog niet verstuurd, dus niets te herinneren. */
  issuedAt: Date | null;
  dueAt: Date | null;
  /** Tijdstip van de laatste handmatige herinnering, of `null` als er nog geen was. */
  lastReminderAt: Date | null;
}

export type ManualReminderReason = "not-owner" | "not-issued" | "not-awaiting-payment" | "cooldown";

export interface ManualReminderEligibility {
  eligible: boolean;
  reason?: ManualReminderReason;
  /** Hele dagen ná de vervaldag (0 als niet te laat of geen vervaldatum). */
  daysOverdue: number;
  /** Eerstvolgende moment waarop opnieuw herinnerd mag worden (alleen bij `cooldown`). */
  nextAllowedAt: Date | null;
}

/** Wacht de factuur (cascade óf los) nog op betaling door de opdrachtgever? */
export function isAwaitingPayment(
  status: string,
  lifecycleStatus: InvoiceLifecycleState | null,
): boolean {
  if (lifecycleStatus != null) return AWAITING_PAYMENT_LIFECYCLE.includes(lifecycleStatus);
  return status === "SENT" || status === "OVERDUE";
}

/**
 * Mag de ZZP'er nú een handmatige betaalherinnering sturen? Eigenaarschap + uitgereikt + nog
 * onbetaald + buiten de afkoelperiode. Volgorde van de checks bepaalt de teruggegeven `reason`.
 */
export function canSendPaymentReminder(
  input: ManualReminderInput,
  now: Date = new Date(),
): ManualReminderEligibility {
  const over = input.dueAt ? Math.max(0, daysOverdue(input.dueAt, now)) : 0;

  if (!input.isFreelancerOwner)
    return { eligible: false, reason: "not-owner", daysOverdue: over, nextAllowedAt: null };
  if (!input.issuedAt)
    return { eligible: false, reason: "not-issued", daysOverdue: over, nextAllowedAt: null };
  if (!isAwaitingPayment(input.status, input.lifecycleStatus))
    return {
      eligible: false,
      reason: "not-awaiting-payment",
      daysOverdue: over,
      nextAllowedAt: null,
    };

  if (input.lastReminderAt) {
    const nextAllowedAt = new Date(
      input.lastReminderAt.getTime() + MANUAL_REMINDER_COOLDOWN_DAYS * DAY_MS,
    );
    if (now.getTime() < nextAllowedAt.getTime())
      return { eligible: false, reason: "cooldown", daysOverdue: over, nextAllowedAt };
  }

  return { eligible: true, daysOverdue: over, nextAllowedAt: null };
}
