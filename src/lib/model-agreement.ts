// Deterministische aanbeveling van de best passende Belastingdienst-modelovereenkomst
// op basis van DBA-indicatoren. Enkele bron van waarheid voor server én client.
// Geen juridisch advies — uitsluitend een hulpmiddel om de juiste overeenkomst te kiezen.

import { assessDbaRisk, type DbaInput } from "./dba";

export const MODEL_AGREEMENT_TYPES = [
  "GEEN_WERKGEVERSGEZAG",
  "VRIJE_VERVANGING",
  "TUSSENKOMST",
] as const;
export type ModelAgreementType = (typeof MODEL_AGREEMENT_TYPES)[number];

export const MODEL_AGREEMENT_LABELS: Record<ModelAgreementType, string> = {
  GEEN_WERKGEVERSGEZAG: "Geen werkgeversgezag",
  VRIJE_VERVANGING: "Vrije vervanging",
  TUSSENKOMST: "Tussenkomst",
};

export interface ModelAgreementRecommendation {
  /** true zodra het DBA-risico MIDDEN of HOOG is */
  recommended: boolean;
  /** best passende modelovereenkomst (null bij LAAG) */
  type: ModelAgreementType | null;
  /** MODEL_AGREEMENT_LABELS[type] of null */
  label: string | null;
  /** waarom dit type past, afgeleid uit de getriggerde indicatoren */
  reasons: string[];
  /** vaste kanttekening */
  note: string;
}

const NOTE =
  "Een modelovereenkomst beschermt alleen als er in de praktijk ook conform wordt gewerkt — stem de werkwijze af op de gekozen overeenkomst.";

/** Deterministische aanbeveling van de best passende modelovereenkomst. */
export function recommendModelAgreement(input: DbaInput): ModelAgreementRecommendation {
  const risk = assessDbaRisk(input);
  const recommended = risk.level !== "LAAG";

  if (!recommended) {
    return {
      recommended: false,
      type: null,
      label: null,
      reasons: [],
      note: NOTE,
    };
  }

  // Type-selectie op volgorde van prioriteit
  let type: ModelAgreementType;

  if (input.directSupervision || input.embedded || input.fixedSchedule) {
    // Gezag/inbedding-cluster: zwaarste indicatoren
    type = "GEEN_WERKGEVERSGEZAG";
  } else if (input.noSubstitution) {
    // Geen vrije vervanging is het dominante resterende kenmerk
    type = "VRIJE_VERVANGING";
  } else {
    // Algemeen vangnet: MIDDEN via exclusiviteit / zwak ondernemerschap / duur
    type = "GEEN_WERKGEVERSGEZAG";
  }

  // Redenen opbouwen, deterministisch, op basis van de gekozen overeenkomst
  const reasons: string[] = [];

  if (type === "GEEN_WERKGEVERSGEZAG") {
    if (input.directSupervision) {
      reasons.push(
        "Directe aansturing duidt op een gezagsverhouding; de overeenkomst legt vast dat de opdrachtgever geen instructies over de uitvoering geeft.",
      );
    }
    if (input.embedded) {
      reasons.push(
        "Structurele inbedding in de organisatie vraagt om een expliciete vastlegging van de zelfstandige positie.",
      );
    }
    if (input.fixedSchedule) {
      reasons.push(
        "Vaste uren of een rooster lijken op een dienstverband; de overeenkomst borgt de vrijheid in tijdsindeling.",
      );
    }
    // Algemeen vangnet: geen van bovenstaande was van toepassing
    if (reasons.length === 0) {
      reasons.push(
        "De combinatie van indicatoren vraagt om een vastgelegde, zelfstandige werkwijze.",
      );
    }
  } else if (type === "VRIJE_VERVANGING") {
    reasons.push(
      "Geen vrije vervanging is het dominante kenmerk; de overeenkomst legt het vervangingsrecht van de opdrachtnemer expliciet vast.",
    );
  }

  return {
    recommended: true,
    type,
    label: MODEL_AGREEMENT_LABELS[type],
    reasons,
    note: NOTE,
  };
}
