// Voordraag-overzicht per open dienst voor de bemiddelaar (FRANCHISER) op de dienst-**detailpagina**.
// Beantwoordt in één oogopslag de kernvraag bij een openstaande dienst: "kan ik deze dienst NU vullen
// uit mijn eigen roster, of moet ik werven?" — precies de vraag die de lijst-chip (`dienst-fill-signal`)
// al beantwoordt op de diensten-lijst, maar die op de detailpagina — waar de vulbeslissing valt —
// ontbrak. Zonder dit overzicht moet de bemiddelaar de hele voordraag-lijst afscannen.
//
// Pure afleiding over de reeds-geladen `RosterCandidate[]` (uit `getRosterCandidatesForDienst`): geen
// extra query, geen schemawijziging, geen mutatie. Server-side is de waarheid (CLAUDE.md regel 1) —
// de inzetbaarheid + matchscore per kandidaat zijn al server-berekend; hier tellen we alleen.
//
// Consistentie met de lijst-chip: dezelfde "geschikt"-drempel (`READY_MATCH_MIN_SCORE`, match ≥ 60)
// zodat het detail-overzicht en het lijst-signaal nooit een andere lat leggen voor "geschikte match".

import { type RosterCandidate } from "@/lib/franchise/dienst-voordracht";
import { READY_MATCH_MIN_SCORE } from "@/lib/franchise/dienst-fill-signal";
import { plural } from "@/lib/plural";

export interface VoordraagOverview {
  /** Totaal aantal roster-vakmensen (de hele voordraag-lijst). */
  total: number;
  /**
   * Direct voordraagbaar NU: inzetbaar (niet INACTIEF), goede match (≥ drempel), nog niet voorgedragen,
   * nog niet zelf gereageerd én geen dubbele-boeking-risico. De actionabele set — hier druk je op de knop.
   */
  readyToPropose: number;
  /** Geschikte matches: inzetbaar én match ≥ drempel (ongeacht of ze al benaderd/geboekt zijn). Pooldiepte. */
  strongMatches: number;
  /** Geschikte match die al is voorgedragen óf zelf al heeft gereageerd — in beweging, wacht op de ZZP'er. */
  alreadyEngaged: number;
  /** Geschikte, nog-niet-benaderde match met een dubbele-boeking-risico (overlappende actieve samenwerking). */
  doubleBookingRisk: number;
  /** Roster-vakmensen die (nog) niet inzetbaar zijn (INACTIEF) — niet voordraagbaar tot hersteld. */
  notEngageable: number;
}

/**
 * Pure kern: decomposeer de voordraag-lijst in een beslis-overzicht. `strongMatches` splitst exact op in
 * `readyToPropose + alreadyEngaged + doubleBookingRisk` (elke geschikte match valt in precies één bak),
 * zodat de bemiddelaar het gat tussen "geschikt" en "nu voordraagbaar" kan verklaren zonder de lijst te
 * lezen. Deterministisch, los van de DB-laag testbaar.
 */
export function summarizeVoordraagOverview(
  candidates: readonly RosterCandidate[],
): VoordraagOverview {
  let readyToPropose = 0;
  let strongMatches = 0;
  let alreadyEngaged = 0;
  let doubleBookingRisk = 0;
  let notEngageable = 0;

  for (const c of candidates) {
    if (c.engageabilityStatus === "INACTIEF") {
      notEngageable += 1;
      continue;
    }
    if (c.matchScore < READY_MATCH_MIN_SCORE) continue;

    strongMatches += 1;
    if (c.proposed || c.hasApplied) {
      alreadyEngaged += 1;
    } else if (c.doubleBooking.count > 0) {
      doubleBookingRisk += 1;
    } else {
      readyToPropose += 1;
    }
  }

  return {
    total: candidates.length,
    readyToPropose,
    strongMatches,
    alreadyEngaged,
    doubleBookingRisk,
    notEngageable,
  };
}

export type VoordraagVerdictTone = "success" | "warning" | "default";

export interface VoordraagVerdict {
  headline: string;
  tone: VoordraagVerdictTone;
}

/**
 * Eén verklarende kopregel + toon boven het overzicht. Drie uitkomsten:
 *  - er staan direct voordraagbare vakmensen klaar (success, "act now");
 *  - er zijn wel geschikte matches maar geen vrije (al benaderd of dubbel geboekt) → neutraal wachten;
 *  - geen enkele geschikte match in het roster → werving nodig (warning).
 */
export function voordraagVerdict(o: VoordraagOverview): VoordraagVerdict {
  if (o.readyToPropose > 0) {
    return {
      headline: `${plural(o.readyToPropose, "vakmens", "vakmensen")} direct voordraagbaar uit je roster.`,
      tone: "success",
    };
  }
  if (o.strongMatches > 0) {
    return {
      headline: "Geschikte matches zijn al benaderd of elders geboekt — geen vrije voordracht nu.",
      tone: "default",
    };
  }
  return {
    headline: "Geen geschikte match in je roster — werving of verbreding nodig.",
    tone: "warning",
  };
}

/**
 * Compacte context-regel voor wat er tussen "geschikt" en "direct voordraagbaar" zit, plus niet-inzetbaren.
 * Geeft alleen de niet-nul onderdelen terug (bv. "2 al benaderd · 1 dubbele-boeking-risico"), of `null`
 * als er niets toe te lichten valt — dan blijft de UI rustig.
 */
export function voordraagContextParts(o: VoordraagOverview): string[] {
  const parts: string[] = [];
  if (o.alreadyEngaged > 0) parts.push(`${o.alreadyEngaged} al benaderd`);
  if (o.doubleBookingRisk > 0) {
    parts.push(`${o.doubleBookingRisk} dubbele-boeking-risico`);
  }
  if (o.notEngageable > 0) parts.push(`${o.notEngageable} niet inzetbaar`);
  return parts;
}
