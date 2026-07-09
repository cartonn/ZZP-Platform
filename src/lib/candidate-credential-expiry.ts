import type { CredentialType, CredentialStatus } from "@/lib/enums";

/**
 * Beslismoment-signaal voor de opdrachtgever op /kandidaten.
 *
 * `computeCompliance` (matching.ts) beoordeelt of een kandidaat *nu* aan de certificaateisen voldoet.
 * Maar een certificaat dat vandaag geldig is, kan vóór of kort na de **startdatum** van de opdracht
 * verlopen — dan is de kandidaat bij aanvang (of vlak erna) alsnog niet compliant. Deze module maakt
 * dat verval-risico expliciet op het moment dat de opdrachtgever kiest, zodat "COMPLIANT" geen valse
 * gerustheid geeft. Spiegelt de bestaande expiry-motor (credentials.ts) op het selectiemoment.
 *
 * Bewust alleen certificaten die *nu geldig-geverifieerd* zijn (VERIFIED én nog niet verlopen): een
 * ontbrekend, in-beoordeling of reeds verlopen certificaat wordt al door de compliance-blokkade gedekt.
 */

/** Venster (dagen) ná de startdatum waarbinnen een verval nog een waarschuwing waard is. */
export const CREDENTIAL_JOB_EXPIRY_WINDOW_DAYS = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface CandidateCredentialInput {
  type: CredentialType;
  status: CredentialStatus;
  expiresAt?: Date | null;
}

/**
 * - `before-start`: verloopt op of vóór de startdatum → bij aanvang al niet meer geldig (ernstig).
 * - `soon-after-start`: verloopt binnen het venster ná de start → vervalt tijdens de eerste periode (let op).
 */
export type CredentialExpiryPhase = "before-start" | "soon-after-start";

export interface CredentialExpiryConcern {
  type: CredentialType;
  expiresAt: Date;
  phase: CredentialExpiryPhase;
  /** Hele dagen tussen startdatum en verval; negatief = verloopt vóór de start. */
  daysFromStartToExpiry: number;
}

export interface CandidateExpirySummary {
  concerns: CredentialExpiryConcern[];
  /** Zwaarste fase over alle concerns: `before-start` domineert `soon-after-start`. */
  worstPhase: CredentialExpiryPhase;
}

/**
 * Beoordeelt of een van de vereiste, nu-geldige certificaten van de kandidaat vervalt vóór of kort na
 * de startdatum van de opdracht. Geeft `null` wanneer er geen startdatum is (timing niet te beoordelen)
 * of geen enkel vereist certificaat een risico vormt.
 *
 * Puur en deterministisch; `now` injecteerbaar voor tests.
 */
export function summarizeCandidateCredentialExpiry(input: {
  requiredTypes: readonly CredentialType[];
  credentials: readonly CandidateCredentialInput[];
  jobStartDate: Date | null | undefined;
  now?: Date;
  windowDays?: number;
}): CandidateExpirySummary | null {
  const { requiredTypes, credentials, jobStartDate } = input;
  if (!jobStartDate) return null;
  if (requiredTypes.length === 0) return null;

  const now = input.now ?? new Date();
  const nowMs = now.getTime();
  const startMs = jobStartDate.getTime();
  const windowMs = (input.windowDays ?? CREDENTIAL_JOB_EXPIRY_WINDOW_DAYS) * MS_PER_DAY;

  const required = new Set(requiredTypes);
  const concerns: CredentialExpiryConcern[] = [];

  for (const type of required) {
    // De op dit moment geldige geverifieerde certificaten van dit type (VERIFIED, mét vervaldatum,
    // nog niet verlopen). Neem de laatst-vervallende — dat is degene waarop de compliance leunt.
    const validVerified = credentials.filter(
      (c) =>
        c.type === type && c.status === "VERIFIED" && c.expiresAt && c.expiresAt.getTime() > nowMs,
    );
    if (validVerified.length === 0) continue;

    const latest = validVerified.reduce((best, c) =>
      (c.expiresAt as Date).getTime() > (best.expiresAt as Date).getTime() ? c : best,
    );
    const expiresAt = latest.expiresAt as Date;
    const expMs = expiresAt.getTime();

    // Verval buiten het venster ná de start → geen zorg.
    if (expMs > startMs + windowMs) continue;

    const phase: CredentialExpiryPhase = expMs <= startMs ? "before-start" : "soon-after-start";
    concerns.push({
      type,
      expiresAt,
      phase,
      daysFromStartToExpiry: Math.floor((expMs - startMs) / MS_PER_DAY),
    });
  }

  if (concerns.length === 0) return null;

  // Ernstig eerst; binnen een fase de vroegste vervaldatum bovenaan.
  concerns.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase === "before-start" ? -1 : 1;
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  });

  return { concerns, worstPhase: concerns[0].phase };
}
