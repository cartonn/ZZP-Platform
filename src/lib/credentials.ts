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

/** Pad naar het bewerken-scherm van een certificaat — de plek waar je een nieuw bewijsstuk uploadt
 * (en daarmee een afgewezen/verlopen certificaat opnieuw ter verificatie aanbiedt). Eén bron zodat
 * notificaties en knoppen naar exact dezelfde herstelactie linken. */
export function credentialEditPath(id: string): string {
  return `/certificaten/${id}/bewerken`;
}

export interface RecoveryNotice {
  tone: "danger" | "warning";
  title: string;
  message: string;
}

/**
 * Contextuele herstelmelding voor het bewerken-formulier: wat is er aan de hand en wat moet de
 * ZZP'er doen om weer geverifieerd te raken. Alleen voor de statussen die herstel vragen
 * (REJECTED/EXPIRED); anders `null`. De herstelactie is overal dezelfde: een nieuw bewijsstuk
 * uploaden zet het certificaat terug naar "in beoordeling".
 */
export function credentialRecoveryNotice(status: CredentialStatus): RecoveryNotice | null {
  if (status === "REJECTED") {
    return {
      tone: "danger",
      title: "Dit certificaat is afgewezen",
      message:
        "Upload hieronder een nieuw, correct bewijsstuk. Daarmee bied je het certificaat opnieuw ter verificatie aan.",
    };
  }
  if (status === "EXPIRED") {
    return {
      tone: "warning",
      title: "Dit certificaat is verlopen",
      message:
        "Upload hieronder het vernieuwde bewijsstuk met de nieuwe vervaldatum. Daarmee bied je het certificaat opnieuw ter verificatie aan.",
    };
  }
  return null;
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

/**
 * Aantal geldige, geverifieerde certificaten: VERIFIED én niet verlopen. Dit is de basis voor het
 * vertrouwensniveau (zie computeTrustLevel) — een verlopen bewijsstuk telt niet meer mee.
 */
export function activeVerifiedCount(
  credentials: readonly ExpiryInput[],
  now: Date = new Date(),
): number {
  return credentials.filter((c) => c.status === "VERIFIED" && !isExpired(c, now)).length;
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

export interface SupersedeInput {
  id: string;
  type: string;
  status: CredentialStatus;
  expiresAt?: Date | null;
}

/**
 * Welke VERIFIED-certificaten worden door een nieuwer, nu-geldig geverifieerd certificaat van
 * HETZELFDE type overbodig gemaakt? Een "superseded" exemplaar is een certificaat waarvan het
 * verval niet meer relevant is: er bestaat al een geldige vervanger die minstens even lang (of
 * onbeperkt) meegaat. De compliance leunt per type op het laatst-vervallende geldige exemplaar
 * (zie `collaborationCredentialExpiryConcerns`), dus een ouder, eerder-vervallend exemplaar hoeft
 * de ZZP'er niet meer te vernieuwen — een "verloopt binnenkort"-nudge daarop is een valse melding.
 *
 * Regel: certificaat C (VERIFIED, nu geldig, mét vervaldatum) is superseded zodra er een ánder
 * VERIFIED-certificaat D van hetzelfde type bestaat dat nú geldig is (niet verlopen) én
 * - geen vervaldatum heeft (verloopt nooit), of
 * - later verloopt dan C.
 * Retourneert de set met de ids van de superseded exemplaren. Puur/deterministisch.
 */
export function supersededVerifiedCredentialIds(
  credentials: readonly SupersedeInput[],
  now: Date = new Date(),
): Set<string> {
  const nowMs = now.getTime();
  const validVerifiedByType = new Map<string, SupersedeInput[]>();
  for (const c of credentials) {
    if (c.status !== "VERIFIED") continue;
    if (c.expiresAt != null && c.expiresAt.getTime() <= nowMs) continue; // al verlopen → dekt niets
    const list = validVerifiedByType.get(c.type);
    if (list) list.push(c);
    else validVerifiedByType.set(c.type, [c]);
  }

  const superseded = new Set<string>();
  for (const list of validVerifiedByType.values()) {
    if (list.length < 2) continue;
    for (const c of list) {
      if (c.expiresAt == null) continue; // verloopt nooit → nooit superseded
      const cExp = c.expiresAt.getTime();
      const covered = list.some(
        (d) => d.id !== c.id && (d.expiresAt == null || d.expiresAt.getTime() > cExp),
      );
      if (covered) superseded.add(c.id);
    }
  }
  return superseded;
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
