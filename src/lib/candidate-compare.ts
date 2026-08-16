// Pure vergelijkingsmotor voor kandidaten op één opdracht. De opdrachtgever shortlist reacties,
// maar moest ze tot nu toe één voor één doorscrollen om te kiezen. Deze module zet een set
// kandidaten naast elkaar en wijst per dimensie de uitspringer aan (uniek beste; bij gelijkspel
// geen winnaar — eerlijk, geen willekeurige uitlichting). Geen I/O, muteert de invoer niet.

import { type ComplianceStatus } from "@/lib/matching";
import { type TrustLevel } from "@/lib/trust";
import { type StartFit, START_FIT_SHORT_LABEL } from "@/lib/candidate-availability";
import { type CandidateProximity, proximityLabel } from "@/lib/candidate-proximity";
import { type SharedHistory } from "@/lib/candidate-history";
import { toCsv } from "@/lib/csv";

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
  /**
   * Kort NL-label ("Vrij vanaf 15 jul") met de eerstvolgende inzetbare dag, alleen gezet wanneer de
   * kandidaat op de startdatum zélf niet inzetbaar is (`blocked`/`none`) maar binnen de horizon wél;
   * anders `undefined`. Zo blijft een niet-passende startdatum toch een plan-optie i.p.v. een dood spoor.
   */
  nextFitLabel?: string;
  /** Geschatte reistijd naar de opdracht, of null bij remote/onbekende plaats (geen chip). */
  proximity?: CandidateProximity | null;
  /**
   * Gemiddelde opdrachtgever-reputatie (sterren) uit gepubliceerde beoordelingen, of null bij geen
   * enkele beoordeling — dan draagt het vertrouwensniveau het signaal (geen misleidende "0 sterren").
   */
  reviewRating?: { average: number; count: number } | null;
  /**
   * Afgeronde samenwerkingen tussen déze opdrachtgever en de kandidaat, of null als er nog nooit
   * met deze opdrachtgever is samengewerkt. Sterk, laag-risico rehire-signaal.
   */
  sharedHistory?: SharedHistory | null;
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
  /** Id van de uniek hoogste reputatie (gemiddelde sterren), of null. */
  bestRatingId: string | null;
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
      bestRatingId: null,
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
    // Alleen kandidaten mét minstens één beoordeling doen mee (count 0 → null, geen valse winnaar).
    bestRatingId: pickUniqueBest(candidates, (c) =>
      c.reviewRating && c.reviewRating.count > 0 ? c.reviewRating.average : null,
    ),
  };
}

// --- CSV-export ------------------------------------------------------------
// Serialiseert de vergelijking naar CSV zodat de opdrachtgever de kandidaten-shortlist kan
// bewaren of delen (parity met de andere ledger-exports). Puur: geen DB, geen I/O. Kandidaatnamen
// zijn vrije gebruikerstekst, daarom via `toCsv` (RFC 4180-quoting + CWE-1236 formule-injectie-guard).
// Score en aanbeveling komen als losse params binnen (`scoreById`/`recommendedId`) om een circulaire
// import met de ranking-module te vermijden.

const TRUST_LABEL: Record<TrustLevel, string> = {
  BASIS: "Basis",
  DEELS: "Deels",
  VOLLEDIG: "Volledig",
};

const COMPLIANCE_LABEL: Record<ComplianceStatus, string> = {
  COMPLIANT: "Compleet",
  WARNING: "Aandacht",
  NON_COMPLIANT: "Niet compleet",
};

/**
 * Bouwt de CSV-tekst voor de kandidatenvergelijking: één rij per kandidaat, in de meegegeven
 * volgorde (al aflopend op matchscore). Decimalen krijgen een komma (NL-conventie). Ontbrekende
 * velden blijven leeg; een opdracht zonder certificaat-eis toont compliance als "n.v.t.".
 */
export function exportCandidateComparisonCsv(input: {
  candidates: CompareCandidate[];
  comparison: CandidateComparison;
  scoreById: Record<string, number>;
  recommendedId: string | null;
}): string {
  const header = [
    "Kandidaat",
    "Totaalprofiel",
    "Aanbevolen",
    "Match",
    "Tariefvoorstel (EUR/uur)",
    "Vertrouwen",
    "Reputatie",
    "Compliance",
    "Eerste keer akkoord",
    "Beschikbaar op startdatum",
    "Reistijd",
    "Eerdere samenwerkingen",
  ];

  const rows: (string | number)[][] = input.candidates.map((c) => [
    c.name,
    input.scoreById[c.id] ?? "",
    c.id === input.recommendedId ? "Ja" : "",
    c.matchScore != null ? `${c.matchScore}%` : "",
    c.proposedRate != null ? String(c.proposedRate) : "",
    TRUST_LABEL[c.trustLevel],
    c.reviewRating
      ? `${String(c.reviewRating.average).replace(".", ",")} (${c.reviewRating.count})`
      : "",
    c.complianceStatus === null ? "n.v.t." : COMPLIANCE_LABEL[c.complianceStatus],
    c.firstTimeRightRate != null ? `${c.firstTimeRightRate}%` : "",
    c.startFit && c.startFit !== "unknown" ? START_FIT_SHORT_LABEL[c.startFit] : "",
    c.proximity ? proximityLabel(c.proximity) : "",
    c.sharedHistory ? String(c.sharedHistory.count) : "",
  ]);

  return toCsv([header, ...rows]);
}
