// Wachttijd-signaal per ingediende urenstaat voor de ZZP'er. Beantwoordt op /diensten de kernvraag
// bij een nog-onbesliste urenstaat: "hoe lang wacht mijn ingediende urenstaat al op goedkeuring?"
// Dat moment telt: pas ná goedkeuring (APPROVED) mag de ZZP'er factureren — een urenstaat die op
// SUBMITTED blijft hangen blokkeert stil de facturatie-cascade én de cashflow. Concurrenten
// (Temper/Zorgwerk) tonen de status van een ingediende dienst; wij maken de wachttijd expliciet en
// eerlijk, met een nudge zodra de opdrachtgever de gebruikelijke termijn overschrijdt.
//
// Spiegelbeeld van het reactie-wachtsignaal (`application-wait.ts`, ZZP'er-kant) en van de
// opdrachtgever-nudge (`performance-approval-reminders.ts`, die de opdrachtgever op dag 3/7 port).
// Puur en deterministisch, geen schemawijziging — afgeleid uit de onveranderlijke
// `Performance.submittedAt` + de huidige `status`.

import { REMINDERS } from "@/lib/config";
import { plural } from "@/lib/plural";

const MS_PER_DAY = 86_400_000;

/**
 * Drempel in dagen waarboven een ingediende urenstaat "aandacht" verdient. Afgeleid uit dezelfde
 * herinneringscadans die de opdrachtgever nudged (`performanceApprovalDays`, dag 3 en 7): ná de
 * laatste herinnering heeft de opdrachtgever twee signalen gehad en nog niets gedaan → dan heeft de
 * ZZP'er reden hem zelf aan te stoten. Eén bron van waarheid, dus geen drift met de nudge.
 */
export const PERFORMANCE_WAIT_ATTENTION_DAYS = Math.max(...REMINDERS.performanceApprovalDays);

export interface PerformanceWaitInput {
  /** PerformanceStatus van de urenstaat (DRAFT/SUBMITTED/APPROVED/REJECTED/…). */
  status: string;
  /** Indienmoment (onveranderlijk gezet bij → SUBMITTED); null vóór indienen. */
  submittedAt: Date | null;
}

export interface PerformanceWait {
  /** Aantal hele dagen dat de urenstaat al op goedkeuring wacht (≥ 0). */
  daysWaiting: number;
  /** De urenstaat wacht langer dan gebruikelijk (drempel overschreden). */
  attention: boolean;
}

/**
 * Berekent het wachttijd-signaal voor één urenstaat. Geeft `null` terug tenzij de urenstaat op
 * goedkeuring wácht: alleen `SUBMITTED` mét een `submittedAt` telt. Een concept (DRAFT) is nog aan de
 * ZZP'er zelf, een afgekeurde (REJECTED) toont al zijn reden, en een goedgekeurde/verwerkte urenstaat
 * wacht niet meer. `now` wordt geïnjecteerd zodat de leeftijd reproduceerbaar is. Een `submittedAt` in
 * de toekomst (data-ruis) levert 0 dagen, nooit een misleidend negatief getal.
 */
export function summarizePerformanceWait(
  input: PerformanceWaitInput,
  now: Date = new Date(),
): PerformanceWait | null {
  if (input.status !== "SUBMITTED" || input.submittedAt == null) return null;

  const daysWaiting = Math.max(
    0,
    Math.floor((now.getTime() - input.submittedAt.getTime()) / MS_PER_DAY),
  );

  return { daysWaiting, attention: daysWaiting >= PERFORMANCE_WAIT_ATTENTION_DAYS };
}

/**
 * Korte NL-chip-tekst bij een wachtsignaal. "Vandaag ingediend" op dag 0 (het telwoord "0 dagen"
 * leest misleidend); daarboven "Wacht al X dag(en) op goedkeuring". Puur, dus testbaar.
 */
export function performanceWaitLabel(wait: PerformanceWait): string {
  if (wait.daysWaiting === 0) return "Vandaag ingediend, wacht op goedkeuring";
  return `Wacht al ${plural(wait.daysWaiting, "dag", "dagen")} op goedkeuring`;
}

/**
 * Telt hoeveel urenstaten uit een set aandacht vragen (langer dan gebruikelijk op goedkeuring
 * wachten). Pure samenvatting voor de aandachtsregel boven de lijst; muteert de invoer niet.
 */
export function countPerformancesAwaitingAttention(
  inputs: readonly PerformanceWaitInput[],
  now: Date = new Date(),
): number {
  let count = 0;
  for (const input of inputs) {
    if (summarizePerformanceWait(input, now)?.attention) count += 1;
  }
  return count;
}
