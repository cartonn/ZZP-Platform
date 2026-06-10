// Rechtsvermoeden van werknemerschap — tarief-drempelcheck.
// Bij een uurtarief onder €38 kan de werkende een rechtsvermoeden van loondienst inroepen
// (wetsvoorstel VBAR, aangenomen 21-4-2026, verwachte inwerkingtreding 1-1-2027).
// Dit is een hulpmiddel, geen juridisch advies; het platform geeft geen oordeel.

import { RECHTSVERMOEDEN_DREMPEL_CENTS } from "@/lib/config";

export interface RechtsvermoedensResult {
  belowThreshold: boolean;
  thresholdCents: number;
}

/**
 * Beoordeelt of een uurtarief onder de rechtsvermoeden-drempel van €38/uur valt.
 * @param rateCents - uurtarief in centen, of null als het tarief onbekend is.
 * @returns belowThreshold=true als het tarief bekend én onder de drempel ligt.
 *          Bij null-tarief is belowThreshold altijd false (geen signaal zonder gegeven).
 */
export function assessRateThreshold(rateCents: number | null): RechtsvermoedensResult {
  return {
    belowThreshold: rateCents !== null && rateCents < RECHTSVERMOEDEN_DREMPEL_CENTS,
    thresholdCents: RECHTSVERMOEDEN_DREMPEL_CENTS,
  };
}

/**
 * Beknopte Nederlandse uitlegtekst voor de drempelwaarschuwing.
 * Altijd met disclaimer — nooit als juridisch oordeel presenteren.
 */
export function rechtsvermoedenHint(): string {
  return (
    `Dit tarief ligt onder €${RECHTSVERMOEDEN_DREMPEL_CENTS / 100}/uur. ` +
    "Vanaf de verwachte inwerkingtreding van het rechtsvermoeden werknemerschap (1-1-2027) " +
    "kan de werkende bij een uurtarief onder deze grens een beroep doen op loondienst. " +
    "Hulpmiddel — geen juridisch advies."
  );
}

/** Vaste disclaimer bij het rechtsvermoeden-signaal. */
export const RECHTSVERMOEDEN_DISCLAIMER =
  "Dit is een signaal ter informatie en geen juridisch advies. " +
  "Raadpleeg een juridisch adviseur voor de gevolgen voor uw specifieke situatie.";
