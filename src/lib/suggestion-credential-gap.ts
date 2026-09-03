// Vertaalt de vereiste-certificaat-gaten van een opdrachtgever-suggestie ("Geschikte ZZP'ers") naar
// labels voor de UI. Verlopen en ontbrekend blijven gescheiden: een verlopen bewijs vraagt om
// vernieuwen (bijna in orde), een ontbrekend bewijs is verder weg — zo ziet de opdrachtgever precies
// welke actie de match zou dichten i.p.v. alleen een generieke "niet compliant". Puur/deterministisch.

import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import type { CredentialType } from "@/lib/enums";

export interface CredentialGapSummary {
  /** Labels van vereiste certificaten die verlopen zijn (waren geldig, nu niet meer). */
  expired: string[];
  /** Labels van vereiste certificaten waarvoor géén bruikbaar bewijs bestaat. */
  missing: string[];
}

/**
 * Zet de vereiste-certificaat-gaten om naar getoonde labels. Dedupt (een type verschijnt hooguit één
 * keer) en behoudt de invoervolgorde. `expired` en `missing` zijn wederzijds uitsluitend per type
 * (`computeCompliance` plaatst een type in precies één categorie), maar worden hier onafhankelijk
 * behandeld zodat de aanroeper geen aanname over die invariant hoeft te maken.
 */
export function summarizeCredentialGap(
  expired: readonly CredentialType[],
  missing: readonly CredentialType[],
): CredentialGapSummary {
  const toLabels = (types: readonly CredentialType[]) =>
    Array.from(new Set(types)).map((t) => CREDENTIAL_TYPE_LABEL[t]);
  return { expired: toLabels(expired), missing: toLabels(missing) };
}

/** True zodra er iets te tonen valt (een verlopen óf ontbrekend vereist certificaat). */
export function hasCredentialGap(summary: CredentialGapSummary): boolean {
  return summary.expired.length > 0 || summary.missing.length > 0;
}
