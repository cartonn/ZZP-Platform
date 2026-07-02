// Vertrouwensniveau: deterministisch en uitlegbaar. Combineert identiteitsverificatie en
// geverifieerde certificaten tot één signaal dat opdrachtgevers vertrouwen geeft.
// Server-side waarheid; regels beslissen, geen black box. Pure functie, getest.

export const TRUST_LEVELS = ["BASIS", "DEELS", "VOLLEDIG"] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

export interface TrustInput {
  identityVerified: boolean;
  verifiedCredentialCount: number;
  /**
   * Of de platformbrede verplichte documenten (VOG + verzekering) geldig zijn aangeleverd.
   * Default true (backward-compatible). Ontbreekt er één, dan kan het niveau niet "VOLLEDIG" zijn —
   * anders botst het sterkste vertrouwenssignaal met "Nog niet inzetbaar".
   */
  mandatoryDocsComplete?: boolean;
}

export interface TrustResult {
  level: TrustLevel;
  label: string;
  reasons: string[];
  missing: string[];
}

const LABEL: Record<TrustLevel, string> = {
  BASIS: "Basisprofiel",
  DEELS: "Deels geverifieerd",
  VOLLEDIG: "Volledig geverifieerd",
};

/**
 * Korte uitleg per niveau, voor tooltips/hovertekst waar de volledige `TrustExplanation`-kaart niet
 * past (bv. de vergelijk-tabel). Spiegelt exact de regels in `computeTrustLevel` — één bron.
 */
export const TRUST_LEVEL_EXPLANATION: Record<TrustLevel, string> = {
  BASIS: "Nog niets geverifieerd: geen identiteit en geen geverifieerd certificaat.",
  DEELS:
    "Identiteit óf minstens één certificaat is geverifieerd — nog niet allebei plus de verplichte documenten.",
  VOLLEDIG:
    "Identiteit én minstens één certificaat geverifieerd, met alle verplichte documenten geldig.",
};

export function computeTrustLevel(input: TrustInput): TrustResult {
  const reasons: string[] = [];
  const missing: string[] = [];

  if (input.identityVerified) reasons.push("Identiteit geverifieerd");
  else missing.push("Verifieer je identiteit");

  if (input.verifiedCredentialCount > 0) {
    reasons.push(
      input.verifiedCredentialCount === 1
        ? "1 geverifieerd certificaat"
        : `${input.verifiedCredentialCount} geverifieerde certificaten`,
    );
  } else {
    missing.push("Laat minstens één certificaat verifiëren");
  }

  const mandatoryComplete = input.mandatoryDocsComplete ?? true;
  if (!mandatoryComplete) {
    missing.push("Lever je verplichte documenten aan (VOG en verzekering)");
  }

  // "VOLLEDIG" vereist identiteit + minstens één geverifieerd certificaat ÉN de verplichte documenten.
  const full = input.identityVerified && input.verifiedCredentialCount > 0 && mandatoryComplete;
  const either = input.identityVerified || input.verifiedCredentialCount > 0;
  const level: TrustLevel = full ? "VOLLEDIG" : either ? "DEELS" : "BASIS";

  return { level, label: LABEL[level], reasons, missing };
}
