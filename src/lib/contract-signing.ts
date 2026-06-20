// Contract-ondertekening: doorlooptijd-helpers voor cascade-stap A (een
// voorgestelde samenwerking → contract ondertekenen). Puur en testbaar zonder DB.
// Een samenwerking die in PROPOSED blijft staan stalt de hele facturatiecascade
// (geen getekend contract → geen uren, geen factuur, geen betaling); dit maakt
// zichtbaar hoe lang er al op ondertekening gewacht wordt.
//
// De generieke dag-/labelhelpers worden gedeeld met de verificatie-wachtrij —
// "vandaag" / "N dagen wachtend" geldt voor beide wachtrijen.
import { daysWaiting, waitingLabel } from "@/lib/verification-queue";

export { daysWaiting, waitingLabel };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vanaf hoeveel hele dagen een voorgestelde samenwerking "te lang" op ondertekening wacht. */
export const CONTRACT_SIGNING_STALE_DAYS = 5;

export interface ContractSigningHealth {
  /** Aantal samenwerkingen dat op ondertekening wacht (status PROPOSED). */
  pending: number;
  /** Dagen dat de langst wachtende samenwerking wacht (0 bij een lege wachtrij). */
  oldestDays: number;
  /** Aantal samenwerkingen dat al >= CONTRACT_SIGNING_STALE_DAYS wacht. */
  staleCount: number;
}

/**
 * Vat de wachtrij van voorgestelde-maar-nog-niet-getekende samenwerkingen samen.
 * Het anker is `createdAt` (het voorstelmoment) — een onveranderlijk veld, in
 * tegenstelling tot `updatedAt` dat bij elke wijziging opschuift. De invoer hoeft
 * niet gesorteerd te zijn en wordt niet gemuteerd.
 */
export function summarizeContractSigning(
  items: ReadonlyArray<{ createdAt: Date }>,
  now: Date | number,
): ContractSigningHealth {
  let oldestDays = 0;
  let staleCount = 0;
  for (const item of items) {
    const days = daysWaiting(item.createdAt, now);
    if (days > oldestDays) oldestDays = days;
    if (days >= CONTRACT_SIGNING_STALE_DAYS) staleCount += 1;
  }
  return { pending: items.length, oldestDays, staleCount };
}

/**
 * Het laatste tijdstip dat nog NIET als "te lang wachtend" telt: alles met
 * `createdAt <= contractSigningStaleThreshold(now)` wacht >= CONTRACT_SIGNING_STALE_DAYS
 * dagen. Gebruikt door de statistieken-query om de telling met een goedkope
 * `count`-primitive te doen (geen onbegrensde findMany).
 */
export function contractSigningStaleThreshold(now: Date | number): Date {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return new Date(nowMs - CONTRACT_SIGNING_STALE_DAYS * DAY_MS);
}
