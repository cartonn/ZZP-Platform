// Bereik-signaal voor de opdrachtgever: hoeveel passende, publiek-vindbare ZZP'ers een
// gepubliceerde opdracht kan bereiken (los van wie al reageerde), en hoeveel daarvan nu
// beschikbaar zijn. Concurrenten (Pidz/Zorgwerk) nodigen matchende ZZP'ers automatisch uit
// "binnen uren"; wij maken het bereik vooraf verklaarbaar zodat de opdrachtgever tarief of
// eisen kan bijsturen vóór de opdracht koud wordt. Pure functies, getest. Server-side is de
// waarheid (CLAUDE.md regel 1): de client toont het bereik, berekent het nooit zelf.

/** Minimale matchscore om als "passend bereik" mee te tellen. */
export const REACH_MIN_SCORE = 50;
/** Drempel voor een sterke match (gelijk aan de suggestie-/rooster-drempel, 70). */
export const REACH_STRONG_SCORE = 70;
/** Vanaf hoeveel sterke + beschikbare ZZP'ers het bereik "goed" is. */
export const REACH_GOOD_STRONG_AVAILABLE = 3;

export interface ReachCandidate {
  /** Matchscore 0-100 uit de verklaarbare matchmotor. */
  score: number;
  /** Of de ZZP'er nu beschikbaar is (availability AVAILABLE). */
  available: boolean;
}

export type ReachLevel = "good" | "moderate" | "low";

export interface ReachSummary {
  /** Passende ZZP'ers (score ≥ REACH_MIN_SCORE) die nog niet reageerden. */
  total: number;
  /** Passend én een sterke match (score ≥ REACH_STRONG_SCORE). */
  strong: number;
  /** Passend én nu beschikbaar. */
  available: number;
  /** Sterke match én nu beschikbaar — de zuiverste indicatie van snelle reacties. */
  strongAvailable: number;
  level: ReachLevel;
  /** Sturingstip bij beperkt bereik; null wanneer het bereik goed is. */
  hint: string | null;
}

/**
 * Vat een gescoorde, vindbare ZZP-pool samen tot een bereik-indicatie voor de opdrachtgever.
 * Puur en deterministisch: telt alleen, beslist niets over zichtbaarheid (dat doet de fetcher
 * via de tenant-/discoverable-scope). Telt elke kandidaat hoogstens één keer per bucket.
 */
export function summarizeJobReach(candidates: readonly ReachCandidate[]): ReachSummary {
  let total = 0;
  let strong = 0;
  let available = 0;
  let strongAvailable = 0;

  for (const c of candidates) {
    if (c.score < REACH_MIN_SCORE) continue;
    total += 1;
    if (c.available) available += 1;
    if (c.score >= REACH_STRONG_SCORE) {
      strong += 1;
      if (c.available) strongAvailable += 1;
    }
  }

  let level: ReachLevel;
  if (strongAvailable >= REACH_GOOD_STRONG_AVAILABLE) {
    level = "good";
  } else if (strongAvailable >= 1 || available >= REACH_GOOD_STRONG_AVAILABLE) {
    level = "moderate";
  } else {
    level = "low";
  }

  let hint: string | null = null;
  if (level === "low") {
    hint =
      total === 0
        ? "Nog geen passende ZZP'ers gevonden. Verruim de eisen, het tarief of de werkvorm om je bereik te vergroten."
        : "Beperkt bereik aan direct beschikbare ZZP'ers. Een hoger tarief, minder verplichte eisen of een flexibelere werkvorm vergroot je kans op snelle reacties.";
  } else if (level === "moderate") {
    hint =
      "Je opdracht bereikt enkele passende ZZP'ers. Verruim eventueel het tarief of de eisen voor meer keuze.";
  }

  return { total, strong, available, strongAvailable, level, hint };
}
