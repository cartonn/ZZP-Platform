// AVG "recht op verwijdering" — pure logica voor het anonimiseren van een account.
//
// Beheer voert een door de gebruiker aangevraagde verwijdering uit door de
// persoonsgegevens onomkeerbaar te overschrijven. Records met een wettelijke
// (fiscale) bewaarplicht — facturen — blijven bestaan; de persoonsgegevens op
// het account zelf worden onleesbaar gemaakt. Deze module bevat alleen pure
// functies (geen DB/IO) zodat de regels los testbaar en deterministisch zijn.

import { type UserRole } from "@/lib/enums";

/** Weergavenaam waarmee een geanonimiseerd account wordt getoond. */
export const ANONYMIZED_NAME = "Verwijderde gebruiker";

/** Redactie-marker die in de plaats komt van uit auditlog-metadata verwijderde persoonsgegevens. */
export const AUDIT_PII_REDACTED = "[verwijderd]";

/**
 * AVG art. 17 (recht op vergetelheid) dekt óók de auditlog. Meerdere audit-events schrijven het
 * rauwe e-mailadres van de betrokkene in de JSON-metadata (mislukte login, rate-limit, bulk-import);
 * de overschrijving van `User.email` bij anonimisering raakt die kopieën niet. Deze pure helper
 * redact het e-mailadres uit één metadata-string: elk stringveld dat exact (hoofletter-ongevoelig)
 * gelijk is aan het opgegeven adres wordt vervangen door de redactie-marker. Andere velden (bv.
 * `role`, status-overgangen) blijven staan — die zijn niet naar de persoon herleidbaar en
 * operationeel nodig. De exact-match voorkomt dat het adres van een ándere gebruiker (dat dit adres
 * als substring bevat) per ongeluk wordt geraakt. Geeft de invoer ongewijzigd terug als er niets te
 * redacten valt of de metadata geen geldige JSON-object-string is (defensief; `auditData` schrijft
 * altijd JSON, maar we vertrouwen niet blind).
 */
export function scrubAuditMetadataEmail(metadata: string | null, email: string): string | null {
  if (!metadata || !email) return metadata;
  let parsed: unknown;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return metadata;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return metadata;
  const obj = parsed as Record<string, unknown>;
  const target = email.toLowerCase();
  let changed = false;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.toLowerCase() === target) {
      obj[key] = AUDIT_PII_REDACTED;
      changed = true;
    }
  }
  return changed ? JSON.stringify(obj) : metadata;
}

/** Deterministisch, uniek pseudo-adres. Behoudt de unique-constraint op `email`
 *  zonder een herleidbaar adres te bewaren. `.invalid` is per RFC 6761 nooit een
 *  echt domein, dus er kan geen mail naartoe. */
export function anonymizedEmail(userId: string): string {
  return `verwijderd-${userId}@anoniem.invalid`;
}

export interface AnonymizationTarget {
  id: string;
  role: string;
  deletionRequestedAt: Date | null;
  anonymizedAt: Date | null;
}

export type AnonymizationCheck = { ok: true } | { ok: false; reason: string };

/** Guard voor de anonimisering. Server-side waarheid: alleen een beheerder mag
 *  uitvoeren, nooit op de eigen account, nooit op een andere beheerder (voorkomt
 *  dat het platform onbeheerbaar wordt), alleen wanneer er een openstaand
 *  verzoek is, en niet wanneer het account al geanonimiseerd is. */
export function canAnonymizeUser(
  actor: { id: string; role: UserRole | string },
  target: AnonymizationTarget,
): AnonymizationCheck {
  if (actor.role !== "ADMIN") {
    return { ok: false, reason: "Alleen een beheerder kan een verwijderverzoek afhandelen." };
  }
  if (actor.id === target.id) {
    return { ok: false, reason: "Je kunt je eigen account niet anonimiseren." };
  }
  if (target.role === "ADMIN") {
    return { ok: false, reason: "Een beheerdersaccount kan niet worden geanonimiseerd." };
  }
  if (target.anonymizedAt) {
    return { ok: false, reason: "Dit account is al geanonimiseerd." };
  }
  if (!target.deletionRequestedAt) {
    return { ok: false, reason: "Er is geen openstaand verwijderverzoek voor dit account." };
  }
  return { ok: true };
}

/** PII-velden die op de User-rij worden overschreven. `passwordHash` wordt leeggemaakt
 *  zodat inloggen onmogelijk wordt (bcrypt-vergelijking faalt altijd). */
export function userAnonymizationData(
  userId: string,
  now: Date,
): {
  name: string;
  email: string;
  passwordHash: string;
  status: "SUSPENDED";
  deletionRequestedAt: null;
  anonymizedAt: Date;
  identityVerifiedAt: null;
  verifiedLegalName: null;
  mustChangePassword: false;
  emailVerified: null;
} {
  return {
    name: ANONYMIZED_NAME,
    email: anonymizedEmail(userId),
    passwordHash: "",
    status: "SUSPENDED",
    deletionRequestedAt: null,
    anonymizedAt: now,
    identityVerifiedAt: null,
    verifiedLegalName: null,
    mustChangePassword: false,
    emailVerified: null,
  };
}

/** Vrije-tekst- en identificerende velden op het ZZP-profiel worden gewist; het
 *  profiel wordt op privé gezet zodat het nergens meer publiek verschijnt. */
export function freelancerProfileAnonymizationData(): {
  headline: null;
  bio: null;
  location: null;
  languages: null;
  kvkNumber: null;
  btwNumber: null;
  hourlyRate: null;
  visibility: "PRIVATE";
} {
  return {
    headline: null,
    bio: null,
    location: null,
    languages: null,
    kvkNumber: null,
    btwNumber: null,
    hourlyRate: null,
    visibility: "PRIVATE",
  };
}

/** Bedrijfsprofielvelden worden gewist; de naam wordt vervangen door de
 *  geanonimiseerde weergavenaam. */
export function companyAnonymizationData(): {
  name: string;
  description: null;
  website: null;
  location: null;
  logoKey: null;
} {
  return {
    name: ANONYMIZED_NAME,
    description: null,
    website: null,
    location: null,
    logoKey: null,
  };
}
