// Vertrouwensniveau: deterministisch en uitlegbaar. Combineert identiteitsverificatie en
// geverifieerde certificaten tot één signaal dat opdrachtgevers vertrouwen geeft.
// Server-side waarheid; regels beslissen, geen black box. Pure functie, getest.

export const TRUST_LEVELS = ["BASIS", "DEELS", "VOLLEDIG"] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

export interface TrustInput {
  identityVerified: boolean;
  verifiedCredentialCount: number;
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

  const both = input.identityVerified && input.verifiedCredentialCount > 0;
  const either = input.identityVerified || input.verifiedCredentialCount > 0;
  const level: TrustLevel = both ? "VOLLEDIG" : either ? "DEELS" : "BASIS";

  return { level, label: LABEL[level], reasons, missing };
}
