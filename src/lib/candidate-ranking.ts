// Gewogen totaalrangschikking bovenop de per-dimensie-vergelijking (`candidate-compare.ts`).
// De vergelijkingstabel wijst per onderdeel de uitspringer aan, maar liet de opdrachtgever met
// negen losse trofeeën zitten die hij zélf moest wegen. Deze module verdicht de dimensies tot één
// transparante totaalscore (0–100) per kandidaat en, alléén bij een duidelijke én veilige koploper,
// een "aanbevolen keuze" met korte onderbouwing. Deterministisch, geen I/O, muteert de invoer niet.
// Beslis-hulp, geen beslisser: bij gelijke stand of een non-compliant koploper volgt géén aanbeveling
// (eerlijk — de opdrachtgever weegt dan zelf), consistent met de "gelijkspel → geen winnaar"-lijn.

import { type CompareCandidate, pickUniqueBest } from "@/lib/candidate-compare";
import { type TrustLevel } from "@/lib/trust";
import { type ComplianceStatus } from "@/lib/matching";
import { type StartFit } from "@/lib/candidate-availability";
import { type ProximityLevel } from "@/lib/candidate-proximity";

/**
 * Gewichten per dimensie (som = 1). Match en compliance wegen het zwaarst: de match drukt de
 * inhoudelijke fit uit, compliance is de harde randvoorwaarde. Een kandidaat die niet meedoet aan
 * een dimensie (onbekende data) telt die dimensie niet mee — hij wordt er niet voor gestraft, de
 * noemer krimpt mee. Zo blijft de score eerlijk vergelijkbaar tussen kandidaten met verschillende
 * beschikbare signalen.
 */
export const RANKING_WEIGHTS = {
  match: 0.3,
  compliance: 0.2,
  trust: 0.12,
  delivery: 0.12,
  reputation: 0.12,
  startFit: 0.08,
  proximity: 0.06,
} as const;

/** Minimale voorsprong (totaalscore-punten) op de nummer twee vóór we een koploper aanbevelen. */
export const RECOMMENDATION_MARGIN = 4;

const TRUST_NORM: Record<TrustLevel, number> = { BASIS: 0, DEELS: 0.5, VOLLEDIG: 1 };
const COMPLIANCE_NORM: Record<ComplianceStatus, number> = {
  NON_COMPLIANT: 0,
  WARNING: 0.5,
  COMPLIANT: 1,
};
// Alleen dimensies met een oordeel dragen bij; "unknown" doet niet mee (null → uit de noemer).
const START_FIT_NORM: Partial<Record<StartFit, number>> = {
  available: 1,
  limited: 0.5,
  blocked: 0,
  none: 0,
};
const PROXIMITY_NORM: Record<ProximityLevel, number> = { near: 1, moderate: 0.5, far: 0 };

/** Genormaliseerde waarde 0–1 per dimensie, of null wanneer de kandidaat er niet aan meedoet. */
function dimensionValues(c: CompareCandidate): { weight: number; value: number }[] {
  const dims: { weight: number; value: number | null }[] = [
    { weight: RANKING_WEIGHTS.match, value: c.matchScore == null ? null : c.matchScore / 100 },
    {
      weight: RANKING_WEIGHTS.compliance,
      value: c.complianceStatus == null ? null : COMPLIANCE_NORM[c.complianceStatus],
    },
    { weight: RANKING_WEIGHTS.trust, value: TRUST_NORM[c.trustLevel] },
    {
      weight: RANKING_WEIGHTS.delivery,
      value: c.firstTimeRightRate == null ? null : c.firstTimeRightRate / 100,
    },
    {
      weight: RANKING_WEIGHTS.reputation,
      value:
        c.reviewRating && c.reviewRating.count > 0 ? Math.min(1, c.reviewRating.average / 5) : null,
    },
    {
      weight: RANKING_WEIGHTS.startFit,
      value: c.startFit == null ? null : (START_FIT_NORM[c.startFit] ?? null),
    },
    {
      weight: RANKING_WEIGHTS.proximity,
      value: c.proximity == null ? null : PROXIMITY_NORM[c.proximity.level],
    },
  ];
  return dims.filter((d): d is { weight: number; value: number } => d.value !== null);
}

/**
 * Totaalscore 0–100 voor één kandidaat: gewogen gemiddelde over de dimensies waar hij data voor
 * heeft. Trust is er altijd, dus de noemer is nooit nul. Afgerond op hele punten.
 */
export function overallCandidateScore(c: CompareCandidate): number {
  const dims = dimensionValues(c);
  const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = dims.reduce((s, d) => s + d.weight * d.value, 0);
  return Math.round((weighted / totalWeight) * 100);
}

export interface CandidateRanking {
  /** Alle kandidaten, aflopend op totaalscore (deterministische tiebreak: match, dan naam). */
  ordered: { id: string; name: string; score: number }[];
  /** Snelle lookup id → totaalscore. */
  scoreById: Record<string, number>;
  /** Id van de aanbevolen kandidaat, of null bij gelijke stand / non-compliant koploper. */
  recommendedId: string | null;
  /** Naam van de aanbevolen kandidaat (gemak voor de UI), of null. */
  recommendedName: string | null;
  /** Korte redenen (max 3) waarom de aanbevolen kandidaat vooroploopt; leeg als er geen zijn. */
  reasons: string[];
}

const EMPTY: CandidateRanking = {
  ordered: [],
  scoreById: {},
  recommendedId: null,
  recommendedName: null,
  reasons: [],
};

/**
 * Rangschik de kandidaten op totaalscore en bepaal — voorzichtig — de aanbevolen keuze.
 *
 * Een aanbeveling volgt alleen als de koploper (a) uniek is met een voorsprong ≥
 * `RECOMMENDATION_MARGIN` op de nummer twee en (b) niet NON_COMPLIANT is (een kandidaat die niet aan
 * de harde eisen voldoet kronen we nooit, ook niet bij een hoge score). Anders blijft de ranglijst
 * zichtbaar maar zonder aanbeveling — de opdrachtgever weegt dan zelf.
 */
export function rankCandidates(candidates: CompareCandidate[]): CandidateRanking {
  if (candidates.length < 2) return EMPTY;

  const scoreById: Record<string, number> = {};
  const matchById: Record<string, number> = {};
  for (const c of candidates) {
    scoreById[c.id] = overallCandidateScore(c);
    matchById[c.id] = c.matchScore ?? -1;
  }

  const ordered = [...candidates]
    .map((c) => ({ id: c.id, name: c.name, score: scoreById[c.id]! }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        matchById[b.id]! - matchById[a.id]! ||
        a.name.localeCompare(b.name, "nl"),
    );

  // candidates.length >= 2 is hierboven gegarandeerd, dus ordered heeft minstens twee elementen.
  const top = ordered[0]!;
  const second = ordered[1]!;
  const topCandidate = candidates.find((c) => c.id === top.id)!;
  const clearLeader = top.score - second.score >= RECOMMENDATION_MARGIN;
  const safeLeader = topCandidate.complianceStatus !== "NON_COMPLIANT";

  if (!clearLeader || !safeLeader) {
    return { ordered, scoreById, recommendedId: null, recommendedName: null, reasons: [] };
  }

  return {
    ordered,
    scoreById,
    recommendedId: top.id,
    recommendedName: top.name,
    reasons: buildReasons(candidates, topCandidate),
  };
}

/**
 * Onderbouwing voor de aanbevolen kandidaat: de sterkste, waar-ware punten in prioriteitsvolgorde
 * (max 3). Leunt op dezelfde uniek-beste-bepaling als de vergelijkingstabel, zodat de reden nooit
 * de tabel tegenspreekt ("hoogste match" verschijnt alleen als de trofee daar ook staat).
 */
function buildReasons(candidates: CompareCandidate[], top: CompareCandidate): string[] {
  const bestMatchId = pickUniqueBest(candidates, (c) => c.matchScore);
  const bestDeliveryId = pickUniqueBest(candidates, (c) => c.firstTimeRightRate);
  const bestRatingId = pickUniqueBest(candidates, (c) =>
    c.reviewRating && c.reviewRating.count > 0 ? c.reviewRating.average : null,
  );

  const reasons: string[] = [];
  if (bestMatchId === top.id) reasons.push("hoogste match");
  if (top.complianceStatus === "COMPLIANT") reasons.push("voldoet aan de eisen");
  if (top.sharedHistory) reasons.push("eerder met jou samengewerkt");
  if (top.trustLevel === "VOLLEDIG") reasons.push("volledig geverifieerd");
  if (bestDeliveryId === top.id) reasons.push("hoogste leverbetrouwbaarheid");
  if (bestRatingId === top.id) reasons.push("beste reputatie");
  return reasons.slice(0, 3);
}
