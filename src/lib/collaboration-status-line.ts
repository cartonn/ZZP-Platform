// Eén status-regel bovenaan het samenwerkingsdetail: "wat wordt er nú van wie verwacht?".
// Pure functie (geen I/O) die de bestaande cascade-fase (cascadeStage) samenvat tot één zin,
// vanuit het perspectief van de kijker. Zo opent het detail met handelingsperspectief in plaats
// van met een no-show-blok. Hergebruikt de fase-afleiding (id + youAreUp); de zin krijgt eigen
// bewoording zodat ze de status-badge ("Voorgesteld"/"Actief"/…) niet letterlijk herhaalt.

import { cascadeStage, type CascadeStageInput } from "@/lib/cascade/stage";

export interface CollaborationStatusLine {
  /** De samen te vatten zin. */
  text: string;
  /** Is de kijker nu aan zet? (bepaalt de nadruk in de UI). */
  youAreUp: boolean;
}

/** Korte, viewer-neutrale actie-omschrijving per cascade-fase (id). Geen badge-woorden. */
function phraseForStage(id: string, viewer: "FREELANCER" | "CLIENT", youAreUp: boolean): string {
  const isFreelancer = viewer === "FREELANCER";
  switch (id) {
    case "contract-draft":
      return "het contract wordt nog voorbereid";
    case "contract-sign":
      return "onderteken het contract om te starten";
    case "performance-submit":
      return isFreelancer ? "dien je uren of oplevering in" : "wacht op de uren van de ZZP'er";
    case "performance-rejected":
      return isFreelancer
        ? "corrigeer de afgekeurde uren en dien opnieuw in"
        : "de ZZP'er corrigeert de afgekeurde uren";
    case "performance-approve":
      return isFreelancer
        ? "wacht op goedkeuring van je uren"
        : "keur de ingediende uren of oplevering";
    case "invoice-submit":
      return isFreelancer ? "dien je factuur in" : "wacht op de factuur van de ZZP'er";
    case "invoice-rejected":
      return isFreelancer
        ? "corrigeer de afgekeurde factuur en dien opnieuw in"
        : "de ZZP'er corrigeert de afgekeurde factuur";
    case "invoice-approve":
      return isFreelancer ? "wacht op goedkeuring van je factuur" : "keur de ingediende factuur";
    case "payment":
      return isFreelancer
        ? "markeer de betaling zodra je bent betaald"
        : "wacht op de betalingsbevestiging";
    default:
      return youAreUp ? "er is een actie van je nodig" : "er is nu geen actie van je nodig";
  }
}

/**
 * Leidt één status-zin af uit de cascade-fase.
 * - Aan zet → "Actie nodig: <fase>."
 * - Niet aan zet → "Je hoeft nu niets te doen — <fase>."
 * Terminale fasen (afgerond/geannuleerd/dispuut) geven een rustige, feitelijke zin.
 */
export function collaborationStatusLine(input: CascadeStageInput): CollaborationStatusLine {
  if (input.collaborationStatus === "COMPLETED")
    return { text: "Deze samenwerking is afgerond.", youAreUp: false };
  if (input.collaborationStatus === "CANCELLED")
    return { text: "Deze samenwerking is geannuleerd.", youAreUp: false };
  if (input.disputed)
    return {
      text: "Er loopt een dispuut — het werkproces is bevroren tot dat is opgelost.",
      youAreUp: false,
    };

  const stage = cascadeStage(input);
  const phrase = phraseForStage(stage.id, input.viewer, stage.youAreUp);
  if (stage.youAreUp) return { text: `Actie nodig: ${phrase}.`, youAreUp: true };
  return { text: `Je hoeft nu niets te doen — ${phrase}.`, youAreUp: false };
}
