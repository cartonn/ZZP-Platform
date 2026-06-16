// Proactief vervalsignaal voor de franchise-oversight: vat de certificaten van één ZZP'er samen
// tot het meest urgente aankomende verloopmoment, zodat een franchiser ziet wat vernieuwd moet
// worden vóórdat een verplicht bewijsstuk verloopt en het vertrouwensniveau zakt. Puur, geen I/O;
// hergebruikt de bestaande venster-logica uit de vervalkalender — geen eigen drempels.

import {
  type ExpiryWindow,
  type ExpiryCredentialInput,
  summarizeExpiry,
} from "@/lib/credential-expiry-overview";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";

export type { ExpiryWindow };

export interface ExpiryAlert {
  /** Hele dagen tot het soonest verlopende certificaat; negatief = al verlopen; `null` = geen signaal. */
  soonestDays: number | null;
  /** Het venster van het meest urgente certificaat, of `null` als er niets aandacht vraagt. */
  window: ExpiryWindow | null;
  /** Aantal certificaten dat aandacht vraagt (verlopen of binnen de horizon). */
  count: number;
  /** Type van het meest urgente certificaat (voor een compacte chip-tekst), of `null`. */
  soonestType: ExpiryCredentialInput["type"] | null;
}

/** Leeg signaal: niets dat aandacht vraagt. */
const EMPTY: ExpiryAlert = { soonestDays: null, window: null, count: 0, soonestType: null };

/**
 * Vat de certificaten van één ZZP'er samen tot het meest urgente aankomende vervalsignaal.
 * Telt uitsluitend VERIFIED-certificaten met een vervaldatum binnen de horizon én certificaten die
 * al EXPIRED zijn (zie windowFor in de vervalkalender). Concept/ingediend/afgewezen tellen niet mee,
 * net als certificaten zonder vervaldatum. Read-only en deterministisch.
 */
export function summarizeExpiryAlert(
  credentials: readonly ExpiryCredentialInput[],
  now: Date = new Date(),
): ExpiryAlert {
  const overview = summarizeExpiry(credentials, now);
  // summarizeExpiry sorteert al op meest urgent eerst (kleinste/negatiefste dagen).
  const soonest = overview.items[0];
  if (!soonest) return EMPTY;
  return {
    soonestDays: soonest.days,
    window: soonest.window,
    count: overview.total,
    soonestType: soonest.type,
  };
}

/**
 * Compacte Nederlandse chip-tekst voor een vervalsignaal, bv. "VOG verloopt over 12 d" of
 * "1 certificaat verlopen". Geeft `null` als er niets aandacht vraagt.
 */
export function expiryAlertLabel(alert: ExpiryAlert): string | null {
  if (alert.window === null || alert.soonestDays === null) return null;
  const typeLabel = alert.soonestType ? CREDENTIAL_TYPE_LABEL[alert.soonestType] : "Certificaat";

  if (alert.window === "EXPIRED") {
    // Meerdere verlopen → tel ze; één → benoem het type.
    return alert.count > 1 ? `${alert.count} certificaten verlopen` : `${typeLabel} verlopen`;
  }

  // Aankomend verloop: benoem het soonest verlopende certificaat met de resterende dagen.
  const days = Math.max(alert.soonestDays, 0);
  const dayPart = days === 0 ? "vandaag" : `over ${days} d`;
  const suffix = alert.count > 1 ? ` +${alert.count - 1}` : "";
  return `${typeLabel} verloopt ${dayPart}${suffix}`;
}

/** Tone voor de Badge: verlopen = danger, aankomend = warning, niets = null. */
export function expiryAlertTone(alert: ExpiryAlert): "danger" | "warning" | null {
  if (alert.window === null) return null;
  return alert.window === "EXPIRED" ? "danger" : "warning";
}
