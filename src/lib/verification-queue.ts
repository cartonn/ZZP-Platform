// Verificatie-wachtrij: doorlooptijd-helpers voor de certificaat-verificatie
// (kerndifferentiatie). Puur en testbaar zonder DB; gedeeld door de
// verificatie-wachtrij (/admin/verificaties) en de platform-statistieken
// (/admin/statistieken) zodat beide hetzelfde "te lang wachtend" hanteren.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vanaf hoeveel hele dagen wachten een aanvraag "te lang in de wachtrij" is. */
export const VERIFICATION_STALE_DAYS = 5;

/** Aantal hele dagen dat een aanvraag al wacht sinds indienen (>= 0). */
export function daysWaiting(since: Date, now: Date | number): number {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return Math.max(0, Math.floor((nowMs - since.getTime()) / DAY_MS));
}

/** NL-label voor het aantal wachtdagen. */
export function waitingLabel(days: number): string {
  if (days === 0) return "vandaag ingediend";
  return `${days} dag${days === 1 ? "" : "en"} wachtend`;
}

export interface VerificationQueueHealth {
  /** Aantal aanvragen in de wachtrij. */
  pending: number;
  /** Dagen dat de langst wachtende aanvraag wacht (0 bij een lege wachtrij). */
  oldestDays: number;
  /** Aantal aanvragen dat al >= VERIFICATION_STALE_DAYS wacht. */
  staleCount: number;
}

/**
 * Vat een wachtrij van ingediende certificaten samen. De items hoeven niet
 * gesorteerd te zijn; de invoer wordt niet gemuteerd.
 */
export function summarizeVerificationQueue(
  items: ReadonlyArray<{ updatedAt: Date }>,
  now: Date | number,
): VerificationQueueHealth {
  let oldestDays = 0;
  let staleCount = 0;
  for (const item of items) {
    const days = daysWaiting(item.updatedAt, now);
    if (days > oldestDays) oldestDays = days;
    if (days >= VERIFICATION_STALE_DAYS) staleCount += 1;
  }
  return { pending: items.length, oldestDays, staleCount };
}

/**
 * Het oudste tijdstip dat nog NIET als "te lang wachtend" telt: alles met
 * `updatedAt <= staleThreshold(now)` wacht >= VERIFICATION_STALE_DAYS dagen.
 * Gebruikt door de statistieken-query om de telling met een goedkope
 * `count`-primitive te doen (geen onbegrensde findMany).
 */
export function staleThreshold(now: Date | number): Date {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return new Date(nowMs - VERIFICATION_STALE_DAYS * DAY_MS);
}
