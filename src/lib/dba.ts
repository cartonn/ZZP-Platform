// Wet DBA — deterministische risico-inschatting op schijnzelfstandigheid.
// Regels beslissen en leggen uit; geen AI, geen "black box". Dit is geen juridisch advies,
// maar een hulpmiddel: het maakt risicosignalen zichtbaar en reviewbaar (CLAUDE.md regel 1 & 5).
//
// Gewogen indicatoren uit de holistische toets (gezag, inbedding, ondernemerschap):
//  - directe aansturing (gezagsverhouding) en structurele inbedding zijn kernindicatoren;
//  - geen vrije vervanging en vaste uren wijzen op een dienstverband;
//  - exclusiviteit en lange duur verminderen het ondernemerschap.

export const DBA_RISK_LEVELS = ["LAAG", "MIDDEN", "HOOG"] as const;
export type DbaRisk = (typeof DBA_RISK_LEVELS)[number];

export interface DbaInput {
  directSupervision: boolean; // directe aansturing / gezag
  embedded: boolean; //          structureel ingebed in de organisatie
  fixedSchedule: boolean; //     vaste uren/rooster zoals een werknemer
  noSubstitution: boolean; //    geen vrije vervanging toegestaan
  exclusive: boolean; //         werkt exclusief voor deze opdrachtgever
  durationMonths?: number | null;
}

export interface DbaReason {
  factor: string;
  message: string;
}

export interface DbaResult {
  level: DbaRisk;
  score: number;
  reasons: DbaReason[];
}

const WEIGHTS = {
  directSupervision: 3,
  embedded: 3,
  noSubstitution: 2,
  fixedSchedule: 2,
  exclusive: 1,
} as const;

const MESSAGES: Record<keyof typeof WEIGHTS, string> = {
  directSupervision: "Directe aansturing wijst op een gezagsverhouding — een werknemerskenmerk.",
  embedded: "Structurele inbedding in de organisatie wijst richting een dienstverband.",
  noSubstitution: "Geen vrije vervanging beperkt het zelfstandig ondernemerschap.",
  fixedSchedule: "Vaste uren/rooster lijkt op een dienstverband.",
  exclusive: "Exclusief voor één opdrachtgever vermindert het ondernemersrisico.",
};

/** Deterministische DBA-risico-inschatting met uitleg per getriggerde indicator. */
export function assessDbaRisk(input: DbaInput): DbaResult {
  const reasons: DbaReason[] = [];
  let score = 0;

  for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
    if (input[key]) {
      score += WEIGHTS[key];
      reasons.push({ factor: key, message: MESSAGES[key] });
    }
  }

  const months = input.durationMonths ?? 0;
  if (months > 12) {
    score += 2;
    reasons.push({ factor: "duration", message: "Langer dan 12 maanden: langdurige inzet verhoogt het risico op schijnzelfstandigheid." });
  } else if (months > 6) {
    score += 1;
    reasons.push({ factor: "duration", message: "Duur van 6-12 maanden: houd de continuïteit in de gaten." });
  }

  const level: DbaRisk = score >= 5 ? "HOOG" : score >= 2 ? "MIDDEN" : "LAAG";
  return { level, score, reasons };
}

/** Korte handelingsadvies-tekst per risiconiveau (geen juridisch advies). */
export function dbaAdvice(level: DbaRisk): string {
  switch (level) {
    case "HOOG":
      return "Hoog risico op schijnzelfstandigheid. Herzie de opdracht (vrije vervanging, geen directe aansturing, afgebakend resultaat) of gebruik een goedgekeurde modelovereenkomst en leg de werkwijze vast.";
    case "MIDDEN":
      return "Aandachtspunten aanwezig. Borg vrije vervanging, resultaatgerichtheid en zelfstandige werkwijze; overweeg een modelovereenkomst.";
    default:
      return "Lage indicatie van schijnzelfstandigheid op basis van de opgegeven kenmerken.";
  }
}
