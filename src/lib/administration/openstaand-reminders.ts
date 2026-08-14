// Per-factuur eligibility voor een handmatige betaalherinnering op de openstaande-postenlijst
// (`/openstaand`). De ZZP'er (crediteur) chase't debiteuren normaal per factuur vanaf het
// factuurdetail; dit bouwt dezelfde `canSendPaymentReminder`-beoordeling voor élke openstaande post
// in één keer, zodat de nudge direct in de debiteurenlijst kan staan — dezelfde bron van waarheid als
// het detail (auth→rol→ownership→server-herbevestiging blijft in de server-action). Puur en
// deterministisch: of een herinnering mag, hangt af van de echte factuurstatus + de laatste
// herinnering (uit het auditlogboek), nooit van de client.

import {
  canSendPaymentReminder,
  type ManualReminderEligibility,
} from "@/lib/manual-payment-reminder";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";

export interface ReminderCandidate {
  id: string;
  /** Legacy `InvoiceStatus` (voor losse facturen). */
  status: string;
  /** Cascade-lifecycle (null voor een losse factuur). */
  lifecycleStatus: InvoiceLifecycleState | null;
  issuedAt: Date | null;
  dueAt: Date | null;
}

/**
 * Bouwt per factuur-id de handmatige-herinnering-eligibility voor de ZZP'er (crediteur).
 *
 * Deze helper wordt uitsluitend gevoed met facturen die de actor als crediteur bezit (de
 * `/openstaand`-query scoopt op `collaboration.freelancer.userId`), dus `isFreelancerOwner` is per
 * definitie `true`. De echte gate (rol + ownership + afkoelperiode) blijft in `sendPaymentReminder`;
 * dit bepaalt enkel of de knop getoond mag worden.
 */
export function buildReminderEligibilityMap(
  candidates: ReminderCandidate[],
  lastReminderAtById: Map<string, Date>,
  now: Date = new Date(),
): Map<string, ManualReminderEligibility> {
  const map = new Map<string, ManualReminderEligibility>();
  for (const c of candidates) {
    map.set(
      c.id,
      canSendPaymentReminder(
        {
          isFreelancerOwner: true,
          status: c.status,
          lifecycleStatus: c.lifecycleStatus,
          issuedAt: c.issuedAt,
          dueAt: c.dueAt,
          lastReminderAt: lastReminderAtById.get(c.id) ?? null,
        },
        now,
      ),
    );
  }
  return map;
}
