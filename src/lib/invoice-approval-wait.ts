// Wachttijd-signaal per ingediende cascade-factuur: "hoe lang wacht een ingediende factuur al op
// goedkeuring door de opdrachtgever?" Dat moment telt voor de cashflow: pas ná goedkeuring (APPROVED)
// loopt de betaalcascade door — een factuur die op SUBMITTED blijft hangen blokkeert stil de betaling
// én het inkomen van de ZZP'er.
//
// Downstream-spiegel van het urenstaat-wachtsignaal (`performance-wait.ts`): daar wacht de ingediende
// urenstaat op goedkeuring vóór er gefactureerd mag worden; hier wacht de daaropvolgende factuur op
// goedkeuring vóór er betaald mag worden. De opdrachtgever-nudge (`invoice-approval-reminders.ts`) port
// op dag 3/7 op basis van hetzelfde indienmoment. Puur en deterministisch, geen schemawijziging —
// afgeleid uit de onveranderlijke `Invoice.issuedAt` (gezet bij de SUBMITTED-overgang) + de huidige
// `lifecycleStatus`.

import { REMINDERS } from "@/lib/config";

const MS_PER_DAY = 86_400_000;

/**
 * Drempel in dagen waarboven een ingediende factuur "aandacht" verdient. Afgeleid uit dezelfde
 * herinneringscadans die de opdrachtgever nudged (`invoiceApprovalDays`, dag 3 en 7): ná de laatste
 * herinnering heeft de opdrachtgever twee signalen gehad en nog niets gedaan → dan heeft de ZZP'er reden
 * de goedkeuring te laten escaleren. Eén bron van waarheid, dus geen drift met de nudge.
 */
export const INVOICE_APPROVAL_WAIT_ATTENTION_DAYS = Math.max(...REMINDERS.invoiceApprovalDays);

export interface InvoiceApprovalWaitInput {
  /** lifecycleStatus van de factuur (DRAFT/SUBMITTED/APPROVED/PAID/PROCESSED/…). */
  lifecycleStatus: string;
  /** Indienmoment (`Invoice.issuedAt`, onveranderlijk gezet bij → SUBMITTED); null vóór indienen. */
  issuedAt: Date | null;
}

export interface InvoiceApprovalWait {
  /** Aantal hele dagen dat de factuur al op goedkeuring wacht (≥ 0). */
  daysWaiting: number;
  /** De factuur wacht langer dan gebruikelijk (drempel overschreden). */
  attention: boolean;
}

/**
 * Berekent het wachttijd-signaal voor één factuur. Geeft `null` terug tenzij de factuur op goedkeuring
 * wácht: alleen `SUBMITTED` mét een `issuedAt` telt. Een concept (DRAFT) is nog aan de ZZP'er zelf en
 * een goedgekeurde/betaalde/verwerkte factuur wacht niet meer. `now` wordt geïnjecteerd zodat de leeftijd
 * reproduceerbaar is. Een `issuedAt` in de toekomst (data-ruis) levert 0 dagen, nooit een misleidend
 * negatief getal.
 */
export function summarizeInvoiceApprovalWait(
  input: InvoiceApprovalWaitInput,
  now: Date = new Date(),
): InvoiceApprovalWait | null {
  if (input.lifecycleStatus !== "SUBMITTED" || input.issuedAt == null) return null;

  const daysWaiting = Math.max(
    0,
    Math.floor((now.getTime() - input.issuedAt.getTime()) / MS_PER_DAY),
  );

  return { daysWaiting, attention: daysWaiting >= INVOICE_APPROVAL_WAIT_ATTENTION_DAYS };
}
