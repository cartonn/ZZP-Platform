// Inzetbaarheidsstatus (Pidz INACTIVE-gate als verklaarbaar signaal, ADR-0006 Besluit C hybride).
// Combineert de bestaande losse signalen — verplichte documenten, profiel-compleetheid, identiteit
// en recency — tot één status met uitleg: ACTIEF / AANDACHT / INACTIEF. Pure functie (geen I/O),
// los getest. Bewust een SIGNAAL, geen nieuwe harde plaatsings-blokkade: de enige harde gate blijft
// de per-opdracht NON_COMPLIANT-check bij signContract.

import { type Availability } from "@/lib/enums";
import { type FreelancerCredential } from "@/lib/matching";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";

export type EngageabilityStatus = "ACTIEF" | "AANDACHT" | "INACTIEF";

export interface EngageabilityInput {
  credentials: readonly FreelancerCredential[];
  /** Profiel-compleetheid 0–100 (computeFreelancerCompleteness). */
  completeness: number;
  availability: Availability;
  identityVerified: boolean;
  /** Laatste login; null = onbekend (telt niet als verouderd, geen straf). */
  lastActiveAt: Date | null;
}

export interface EngageabilityResult {
  status: EngageabilityStatus;
  label: string;
  /** Wat in orde is (voor de uitleg). */
  reasons: string[];
  /** Harde redenen waarom (nog) niet inzetbaar — verplichte documenten. */
  blockers: string[];
  /** Zachte aandachtspunten (inzetbaar, maar met smet). */
  attention: string[];
  recencyStale: boolean;
}

// Drempels als expliciete consts (één bron, makkelijk bij te stellen).
export const COMPLETENESS_THRESHOLD = 70;
export const RECENCY_STALE_DAYS = 60;

const STATUS_LABEL: Record<EngageabilityStatus, string> = {
  ACTIEF: "Inzetbaar",
  AANDACHT: "Aandacht nodig",
  INACTIEF: "Nog niet inzetbaar",
};

const DAY_MS = 86_400_000;

/**
 * Bepaalt de inzetbaarheidsstatus + uitleg. INACTIEF zodra een verplicht document ontbreekt of is
 * verlopen (harde eis). Anders AANDACHT bij een aandachtspunt (doc in beoordeling, onvolledig
 * profiel, niet beschikbaar, identiteit niet geverifieerd, lang niet ingelogd). Anders ACTIEF.
 */
export function computeEngageability(
  input: EngageabilityInput,
  now: Date = new Date(),
): EngageabilityResult {
  const md = mandatoryDocuments(input.credentials, now);

  const blockers: string[] = [];
  for (const item of md.items) {
    const label = CREDENTIAL_TYPE_LABEL[item.type] ?? item.type;
    if (item.state === "missing") blockers.push(`${label} ontbreekt`);
    else if (item.state === "expired") blockers.push(`${label} is verlopen`);
  }

  const attention: string[] = [];
  for (const item of md.items) {
    if (item.state === "inReview") {
      const label = CREDENTIAL_TYPE_LABEL[item.type] ?? item.type;
      attention.push(`${label} in beoordeling`);
    }
  }
  if (input.completeness < COMPLETENESS_THRESHOLD) {
    attention.push(`Profiel is ${input.completeness}% compleet`);
  }
  if (input.availability === "UNAVAILABLE") attention.push("Momenteel niet beschikbaar");
  if (!input.identityVerified) attention.push("Identiteit niet geverifieerd");

  const recencyStale =
    input.lastActiveAt != null &&
    now.getTime() - input.lastActiveAt.getTime() > RECENCY_STALE_DAYS * DAY_MS;
  if (recencyStale) attention.push(`Langer dan ${RECENCY_STALE_DAYS} dagen niet ingelogd`);

  const reasons: string[] = [];
  if (md.allSatisfied) reasons.push("Verplichte documenten in orde");
  if (input.identityVerified) reasons.push("Identiteit geverifieerd");
  if (input.completeness >= COMPLETENESS_THRESHOLD) reasons.push("Profiel compleet");

  const status: EngageabilityStatus =
    blockers.length > 0 ? "INACTIEF" : attention.length > 0 ? "AANDACHT" : "ACTIEF";

  return { status, label: STATUS_LABEL[status], reasons, blockers, attention, recencyStale };
}
