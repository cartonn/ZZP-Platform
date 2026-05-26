// Credential-logica: statusovergangen (via CREDENTIAL_TRANSITIONS) en expiry.
// Server-side is de waarheid (CLAUDE.md regel 1 & 3). Pure functies, geen I/O.

import {
  CREDENTIAL_TRANSITIONS,
  type CredentialStatus,
  type CredentialType,
  type VerificationDecision,
} from "@/lib/enums";

/** Nederlandse labels per certificaattype — één bron voor de hele UI. */
export const CREDENTIAL_TYPE_LABEL: Record<CredentialType, string> = {
  VOG: "VOG",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificaat",
  INSURANCE: "Verzekering",
  LICENSE: "Licentie",
  OTHER: "Overig",
};

export class TransitionError extends Error {
  readonly from: CredentialStatus;
  readonly to: CredentialStatus;
  constructor(from: CredentialStatus, to: CredentialStatus) {
    super(`Ongeldige statusovergang: ${from} -> ${to}`);
    this.name = "TransitionError";
    this.from = from;
    this.to = to;
  }
}

/** Is de overgang `from -> to` toegestaan volgens de transitie-map? */
export function canTransition(from: CredentialStatus, to: CredentialStatus): boolean {
  return CREDENTIAL_TRANSITIONS[from].includes(to);
}

/** Werp `TransitionError` als de overgang ongeldig is. Gebruik dit bij elke statuswijziging. */
export function assertTransition(from: CredentialStatus, to: CredentialStatus): void {
  if (!canTransition(from, to)) {
    throw new TransitionError(from, to);
  }
}

/**
 * Bepaalt de te zetten status bij een verificatiebeslissing.
 * REJECTED vereist een (niet-lege) reden — server-side afgedwongen (CLAUDE.md verificatieflow stap 4).
 */
export function statusForDecision(
  current: CredentialStatus,
  decision: VerificationDecision,
  reason?: string | null,
): CredentialStatus {
  if (decision === "REJECTED" && !reason?.trim()) {
    throw new Error("Een afwijzing vereist een reden.");
  }
  const next: CredentialStatus = decision === "VERIFIED" ? "VERIFIED" : "REJECTED";
  assertTransition(current, next);
  return next;
}

export interface ExpiryInput {
  status: CredentialStatus;
  expiresAt?: Date | null;
}

/**
 * Alleen een VERIFIED-credential kan verlopen (CLAUDE.md verificatieflow stap 5).
 * Een credential zonder `expiresAt` verloopt nooit.
 */
export function isExpired(credential: ExpiryInput, now: Date = new Date()): boolean {
  if (credential.status !== "VERIFIED") return false;
  if (!credential.expiresAt) return false;
  return credential.expiresAt.getTime() <= now.getTime();
}

/** Aantal hele dagen tot expiry; `null` als er geen vervaldatum is. Negatief = verlopen. */
export function daysUntilExpiry(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  const ms = expiresAt.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/** Bijna verlopen: VERIFIED, nog niet verlopen, en binnen `withinDays`. */
export function isExpiringSoon(
  credential: ExpiryInput,
  withinDays = 30,
  now: Date = new Date(),
): boolean {
  if (credential.status !== "VERIFIED" || !credential.expiresAt) return false;
  if (isExpired(credential, now)) return false;
  const days = daysUntilExpiry(credential.expiresAt, now);
  return days !== null && days <= withinDays;
}

/**
 * Geeft de nieuwe status als een credential door expiry moet wijzigen, anders `null`.
 * Gebruikt door de expiry-job (Sessie 5) om VERIFIED -> EXPIRED te markeren.
 */
export function expiryTransition(
  credential: ExpiryInput,
  now: Date = new Date(),
): CredentialStatus | null {
  if (isExpired(credential, now) && canTransition(credential.status, "EXPIRED")) {
    return "EXPIRED";
  }
  return null;
}
