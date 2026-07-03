// Pure vergelijkingsmotor voor kandidaten op één opdracht. De opdrachtgever shortlist reacties,
// maar moest ze tot nu toe één voor één doorscrollen om te kiezen. Deze module zet een set
// kandidaten naast elkaar en wijst per dimensie de uitspringer aan (uniek beste; bij gelijkspel
// geen winnaar — eerlijk, geen willekeurige uitlichting). Geen I/O, muteert de invoer niet.

import { type ComplianceStatus } from "@/lib/matching";
import { type TrustLevel } from "@/lib/trust";
import { type StartFit } from "@/lib/candidate-availability";

/** Eén kandidaat zoals de opdrachtgever die vergelijkt. Velden komen uit de bestaande motoren. */
export interface CompareCandidate {
  /** Application-id — stabiele sleutel voor de winnaar-markering. */
  id: string;
  name: string;
  /** Matchscore 0–100, of null als (nog) niet berekend. */
  matchScore: number | null;
  /** Voorgesteld tarief €/uur, of null als niet opgegeven. */
  proposedRate: number | null;
  trustLevel: TrustLevel;
  /** Compliance op de vereiste certificaten, of null als de opdracht er geen eist. */
  complianceStatus: ComplianceStatus | null;
  /** % in-één-keer-akkoord, of null bij te kleine steekproef (geen misleidend signaal). */
  firstTimeRightRate: number | null;
  /** Heeft de kandidaat een actueel beschikbaarheidsvenster aangegeven? */
  available: boolean;
  /** Beschikbaarheid op de startdatum van déze opdracht; `undefined` als de opdracht geen start heeft. */
  startFit?: StartFit;
}

export interface CandidateComparison {
  candidates: CompareCandidate[];
  /** Id van de uniek hoogste matchscore, of null bij gelijkspel/geen data. */
  bestMatchId: string | null;
  /** Id van het uniek scherpste (laagste) tarief, of null. */
  bestRateId: string | null;
  /** Id van het uniek hoogste vertrouwensniveau, of null. */
  bestTrustId: string | null;
  /** Id van de uniek sterkste compliance-status, of null. */
  bestComplianceId: string | null;
  /** Id van de uniek hoogste leverbetrouwbaarheid, of null. */
  bestDeliveryId: string | null;
}

const TRUST_RANK: Record<TrustLevel, number> = { BASIS: 0, DEELS: 1, VOLLEDIG: 2 };
const COMPLIANCE_RANK: Record<ComplianceStatus, number> = {
  NON_COMPLIANT: 0,
  WARNING: 1,
  COMPLIANT: 2,
};

/**
 * Vind de kandidaat met de uniek hoogste score. `score` geeft `null` terug voor een kandidaat die
 * niet meedoet aan deze dimensie (bv. onbekend tarief). Hoger = beter; gebruik een negatieve score
 * om "lager is beter" (tarief) te modelleren. Bij gelijkspel op de top → `null` (geen winnaar).
 */
export function pickUniqueBest(
  candidates: CompareCandidate[],
  score: (c: CompareCandidate) => number | null,
): string | null {
  let bestId: string | null = null;
  let bestScore = -Infinity;
  let tied = false;
  for (const c of candidates) {
    const s = score(c);
    if (s === null) continue;
    if (s > bestScore) {
      bestScore = s;
      bestId = c.id;
      tied = false;
    } else if (s === bestScore) {
      tied = true;
    }
  }
  return tied ? null : bestId;
}

/**
 * Bouw de vergelijking: kopieer de kandidaten (volgorde behouden) en bepaal per dimensie de
 * uniek-beste. Minimaal 2 kandidaten zijn nodig voor een zinvolle uitlichting, maar de functie
 * werkt ook met 1 (dan blijven alle winnaars null — niets om te vergelijken).
 */
export function buildCandidateComparison(candidates: CompareCandidate[]): CandidateComparison {
  // Met minder dan twee kandidaten valt er niets uit te lichten — geen winnaars.
  if (candidates.length < 2) {
    return {
      candidates: [...candidates],
      bestMatchId: null,
      bestRateId: null,
      bestTrustId: null,
      bestComplianceId: null,
      bestDeliveryId: null,
    };
  }
  return {
    candidates: [...candidates],
    bestMatchId: pickUniqueBest(candidates, (c) => c.matchScore),
    // Scherpste = laagste tarief → negeer en negatief maken zodat "hoger = beter" blijft gelden.
    bestRateId: pickUniqueBest(candidates, (c) =>
      c.proposedRate === null ? null : -c.proposedRate,
    ),
    bestTrustId: pickUniqueBest(candidates, (c) => TRUST_RANK[c.trustLevel]),
    bestComplianceId: pickUniqueBest(candidates, (c) =>
      c.complianceStatus === null ? null : COMPLIANCE_RANK[c.complianceStatus],
    ),
    bestDeliveryId: pickUniqueBest(candidates, (c) => c.firstTimeRightRate),
  };
}
