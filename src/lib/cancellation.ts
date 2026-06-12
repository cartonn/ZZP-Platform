// Annuleringsregels (productbesluit eigenaar 12-6-2026, concurrentie-backlog punt 6):
// de opdrachtgever annuleert kosteloos tot CANCELLATION_FREE_DAYS dagen vóór de start;
// daarna (of na de start) ontstaat een betalingsverplichting. Alleen een actieve samenwerking
// (ondertekend contract) kan betalingsplichtig annuleren — een voorstel zonder handtekening
// schept geen verplichting. De ZZP'er-annulering is nooit betalingsplichtig via deze regel;
// dat pad wordt geregistreerd en loopt via herplaatsing/no-show.
// Server-side de waarheid: het oordeel wordt als snapshot op de samenwerking vastgelegd
// op het moment van annuleren (cancellationChargeable).

import { CANCELLATION_FREE_DAYS } from "@/lib/config";

const DAY_MS = 86_400_000;

export interface CancellationInput {
  /** Annuleert de opdrachtgever (true) of de ZZP'er (false)? */
  byClient: boolean;
  /** Is de samenwerking actief (contract ondertekend)? */
  active: boolean;
  /** Geplande startdatum; null = geen startdatum vastgelegd. */
  startDate: Date | null;
  now: Date;
}

export interface CancellationAssessment {
  /** Ontstaat er een betalingsverplichting bij annuleren op `now`? */
  chargeable: boolean;
  /**
   * Laatste moment waarop de opdrachtgever nog kosteloos kan annuleren
   * (startdatum − CANCELLATION_FREE_DAYS). Null wanneer de kostenregel niet van
   * toepassing is (geen startdatum, niet actief, of annulering door de ZZP'er).
   */
  freeUntil: Date | null;
}

export function assessCancellation(input: CancellationInput): CancellationAssessment {
  const { byClient, active, startDate, now } = input;
  if (!byClient || !active || !startDate) return { chargeable: false, freeUntil: null };
  const freeUntil = new Date(startDate.getTime() - CANCELLATION_FREE_DAYS * DAY_MS);
  return { chargeable: now.getTime() > freeUntil.getTime(), freeUntil };
}
