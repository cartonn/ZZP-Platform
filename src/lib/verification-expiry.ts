// Expiry-signaal voor de admin-verificatiewachtrij (`/admin/verificaties`).
//
// De wachtrij toont per ingediend certificaat (status SUBMITTED) al twee triage-assen: FIFO-eerlijkheid
// (het wacht-badge) en downstream-waarde (het "Gevraagd"-badge). Wat ontbrak: een kwaliteits-as die de
// admin behoedt voor het goedkeuren van een bewijsstuk dat al verlopen is (of het vandaag/binnenkort is).
//
// Waarom dit telt: `isExpired` (`credentials.ts`) rekent een VERIFIED-credential met een verstreken
// `expiresAt` als verlopen. Keurt de admin dus een SUBMITTED-certificaat goed waarvan `expiresAt` in het
// verleden ligt, dan is de credential *direct* ongeldig en klapt de eerstvolgende `runExpiryTask` hem naar
// EXPIRED — verspilde beoordeling en een compliance-gat. Het correcte antwoord is afwijzen en een vernieuwd
// document vragen; daarvoor moet de admin een verlopen inzending kunnen onderscheiden van een gezonde.
//
// Puur en deterministisch: geen db-/auth-import, geen schemawijziging. Leest uitsluitend de al-geladen
// `expiresAt` en hergebruikt de status-agnostische primitief `daysUntilExpiry` (de VERIFIED-gepoortte
// `isExpired`/`isExpiringSoon` zijn hier bewust niet bruikbaar — die geven `false` voor SUBMITTED).

import { daysUntilExpiry } from "@/lib/credentials";

/** Venster waarbinnen een nog-geldig maar bijna verlopen bewijsstuk een waarschuwing verdient. */
export const SUBMITTED_EXPIRY_SOON_DAYS = 30;

export type SubmittedExpiryKind = "expired" | "expiring-soon" | "valid";

/**
 * Classificeer een ingediend bewijsstuk op vervaldatum.
 * - `expired`: `expiresAt` ligt op of vóór `now` (exact dezelfde grens als `isExpired`).
 * - `expiring-soon`: nog geldig, maar verloopt binnen `SUBMITTED_EXPIRY_SOON_DAYS` hele dagen.
 * - `valid`: geen vervaldatum, of verloopt later dan het venster.
 */
export function classifySubmittedExpiry(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): SubmittedExpiryKind {
  if (!expiresAt) return "valid";
  // Zelfde tijdstip-vergelijking als `isExpired`, zodat "reeds verlopen" niet afhangt van dag-flooring.
  if (expiresAt.getTime() <= now.getTime()) return "expired";
  const days = daysUntilExpiry(expiresAt, now);
  // Na de bovenstaande grens is `days` altijd >= 0; binnen het venster = bijna verlopen.
  if (days !== null && days <= SUBMITTED_EXPIRY_SOON_DAYS) return "expiring-soon";
  return "valid";
}

/**
 * Korte NL-badgetekst voor het signaal; `null` bij `valid` (rust boven ruis — dan rendert de UI niets).
 */
export function submittedExpiryLabel(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): string | null {
  const kind = classifySubmittedExpiry(expiresAt, now);
  if (kind === "valid") return null;
  if (kind === "expired") return "Reeds verlopen";
  const days = daysUntilExpiry(expiresAt, now);
  if (days === 0) return "Verloopt vandaag";
  if (days === 1) return "Verloopt morgen";
  return `Verloopt over ${days} dagen`;
}

export interface SubmittedExpirySummary {
  /** Aantal inzendingen waarvan de vervaldatum al verstreken is. */
  expiredCount: number;
  /** Aantal inzendingen dat nog geldig is maar binnen het venster verloopt. */
  expiringSoonCount: number;
}

/** Tel de expiry-signalen over de hele (ongefilterde) wachtrij voor de kop-samenvatting. */
export function summarizeSubmittedExpiry(
  items: ReadonlyArray<{ expiresAt: Date | null }>,
  now: Date = new Date(),
): SubmittedExpirySummary {
  let expiredCount = 0;
  let expiringSoonCount = 0;
  for (const item of items) {
    const kind = classifySubmittedExpiry(item.expiresAt, now);
    if (kind === "expired") expiredCount += 1;
    else if (kind === "expiring-soon") expiringSoonCount += 1;
  }
  return { expiredCount, expiringSoonCount };
}
