// Betaal-pending-status van een factuur: staat hij nog open voor betaling door de opdrachtgever?
// Eén bron van waarheid voor élk oppervlak dat de betaalgegevens (IBAN, betaalkenmerk, bedrag) toont
// — het factuurdetail (PaymentDetailsCard) én de factuur-PDF — zodat de twee niet driften. Puur en
// deterministisch (CLAUDE.md regel 1). Geen geldstroom: dit is statusafleiding, geen incasso.

import { type InvoiceLifecycleState } from "@/lib/lifecycles";

// Cascade-lifecycle-statussen waarbij de opdrachtgever de betaalgegevens nog nodig heeft: vanaf de
// indiening (SUBMITTED) tot en met te laat (OVERDUE). Bewust breder dan `isAwaitingPayment`
// (manual-payment-reminder.ts, die pas vanaf APPROVED telt): de opdrachtgever wil de IBAN/het
// betaalkenmerk al zien zodra de factuur is ingediend. Een betaalde/geannuleerde/gecrediteerde of
// nog niet ingediende factuur valt buiten deze set → geen betaalinstructie.
const PAYMENT_PENDING_LIFECYCLE: readonly InvoiceLifecycleState[] = [
  "SUBMITTED",
  "APPROVED",
  "OVERDUE",
];

/**
 * Staat de factuur nog open voor betaling? Zo ja, dan horen de betaalgegevens getoond te worden op
 * zowel het factuurdetail als de factuur-PDF; zo nee (betaald/geannuleerd/gecrediteerd/concept), dan
 * niet — dat voorkomt een onterechte betaalprompt op bijv. een geannuleerde factuur.
 *
 * Cascade-facturen (met `lifecycleStatus`) leiden af uit de lifecycle; losse facturen uit de legacy
 * `status`. Puur; spiegelt de gate die `facturen/[id]` voor de `PaymentDetailsCard` gebruikt.
 */
export function isInvoicePaymentPending(
  status: string,
  lifecycleStatus: InvoiceLifecycleState | null,
): boolean {
  if (lifecycleStatus != null) return PAYMENT_PENDING_LIFECYCLE.includes(lifecycleStatus);
  return status === "SENT" || status === "OVERDUE";
}
