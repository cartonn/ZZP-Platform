// Eén status-regel bovenaan het samenwerkingsdetail: "wat wordt er nú van wie verwacht?".
// Pure functie (geen I/O) die de bestaande cascade-fase (cascadeStage) samenvat tot één zin,
// vanuit het perspectief van de kijker. Zo opent het detail met handelingsperspectief in plaats
// van met een no-show-blok. Hergebruikt de fase-afleiding; verzint geen nieuwe statuslogica.

import { cascadeStage, type CascadeStageInput } from "@/lib/cascade/stage";

export interface CollaborationStatusLine {
  /** De samen te vatten zin. */
  text: string;
  /** Is de kijker nu aan zet? (bepaalt de nadruk in de UI). */
  youAreUp: boolean;
}

/**
 * Leidt één status-zin af uit de cascade-fase.
 * - Aan zet → "Actie nodig: <fase>."
 * - Niet aan zet → "Je hoeft nu niets te doen — <fase>."
 * Terminale fasen (afgerond/geannuleerd/dispuut) geven een rustige, feitelijke zin.
 */
export function collaborationStatusLine(input: CascadeStageInput): CollaborationStatusLine {
  const stage = cascadeStage(input);

  if (input.collaborationStatus === "COMPLETED")
    return { text: "Deze samenwerking is afgerond.", youAreUp: false };
  if (input.collaborationStatus === "CANCELLED")
    return { text: "Deze samenwerking is geannuleerd.", youAreUp: false };
  if (input.disputed)
    return {
      text: "Er loopt een dispuut — het werkproces is bevroren tot dat is opgelost.",
      youAreUp: false,
    };

  if (stage.youAreUp) return { text: `Actie nodig: ${lower(stage.label)}.`, youAreUp: true };
  return { text: `Je hoeft nu niets te doen — ${lower(stage.label)}.`, youAreUp: false };
}

/** Maak de eerste letter klein zodat de fase-omschrijving in de zin past. */
function lower(s: string): string {
  return s.length > 0 ? s[0]!.toLowerCase() + s.slice(1) : s;
}
