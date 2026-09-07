// Wet DBA — deterministische risico-inschatting op schijnzelfstandigheid.
// Regels beslissen en leggen uit; geen "black box". Dit is geen juridisch advies,
// maar een hulpmiddel: het maakt risicosignalen zichtbaar en reviewbaar (CLAUDE.md regel 1 & 5).
//
// Gewogen indicatoren uit de holistische toets (gezag, inbedding, ondernemerschap):
//  - directe aansturing (gezagsverhouding) en structurele inbedding zijn kernindicatoren;
//  - geen vrije vervanging en vaste uren wijzen op een dienstverband;
//  - exclusiviteit en lange duur verminderen het ondernemerschap.

export const DBA_RISK_LEVELS = ["LAAG", "MIDDEN", "HOOG"] as const;
export type DbaRisk = (typeof DBA_RISK_LEVELS)[number];

export interface DbaInput {
  directSupervision: boolean; //    directe aansturing / gezag
  embedded: boolean; //             structureel ingebed in de organisatie
  fixedSchedule: boolean; //        vaste uren/rooster zoals een werknemer
  noSubstitution: boolean; //       geen vrije vervanging toegestaan
  exclusive: boolean; //            werkt exclusief voor deze opdrachtgever
  weakEntrepreneurship: boolean; // zwak ondernemerschap: tarief onder marktconform / nauwelijks andere opdrachtgevers
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
  weakEntrepreneurship: 2,
  exclusive: 1,
} as const;

const MESSAGES: Record<keyof typeof WEIGHTS, string> = {
  directSupervision: "Directe aansturing wijst op een gezagsverhouding — een werknemerskenmerk.",
  embedded: "Structurele inbedding in de organisatie wijst richting een dienstverband.",
  noSubstitution: "Geen vrije vervanging beperkt het zelfstandig ondernemerschap.",
  fixedSchedule: "Vaste uren/rooster lijkt op een dienstverband.",
  weakEntrepreneurship:
    "Zwak ondernemerschap (laag tarief / nauwelijks andere opdrachtgevers) duidt op afhankelijkheid.",
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
    reasons.push({
      factor: "duration",
      message:
        "Langer dan 12 maanden: langdurige inzet verhoogt het risico op schijnzelfstandigheid.",
    });
  } else if (months > 6) {
    score += 1;
    reasons.push({
      factor: "duration",
      message: "Duur van 6-12 maanden: houd de continuïteit in de gaten.",
    });
  }

  const level: DbaRisk = score >= 5 ? "HOOG" : score >= 2 ? "MIDDEN" : "LAAG";
  return { level, score, reasons };
}

const LEVER_KEYS = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[];

/** Concrete handeling per indicator om 'm uit te zetten (opdrachtgever spreekt de opdracht aan). */
const MITIGATION_ACTIONS: Record<keyof typeof WEIGHTS, string> = {
  directSupervision: "Laat de zzp'er zelfstandig werken, zonder directe aansturing.",
  embedded: "Baken de opdracht af tot een afgebakend resultaat, zonder structurele inbedding.",
  noSubstitution: "Sta vrije vervanging toe.",
  fixedSchedule: "Laat de zzp'er de eigen werktijden bepalen (geen vast rooster).",
  weakEntrepreneurship: "Bied een marktconform tarief en ruimte voor andere opdrachtgevers.",
  exclusive: "Sta werk voor andere opdrachtgevers toe (geen exclusiviteit).",
};

export interface DbaMitigation {
  factor: keyof typeof WEIGHTS;
  action: string;
}

export interface DbaMitigationPlan {
  /** Niveau dat wordt bereikt als alle voorgestelde wijzigingen worden doorgevoerd. */
  targetLevel: DbaRisk;
  changes: DbaMitigation[];
}

/**
 * Het kleinste, concrete setje indicator-wijzigingen dat het DBA-risico naar het eerstvolgende
 * lagere niveau brengt — de "next best action" van de DBA-monitor. Alleen de gezag-/inbeddings-
 * indicatoren zijn hefbomen; de verwachte duur is een eerlijke inschatting, geen af te vinken knop,
 * en telt daarom mee in de score maar niet als voorgestelde wijziging.
 *
 * Kiest de deelverzameling actieve indicatoren met (1) de minste wijzigingen, dan (2) de minste
 * overbodige verlaging, dan (3) een stabiele indicator-volgorde — deterministisch en uitlegbaar.
 * `null` als er niets te verlagen valt (al LAAG) of als de indicatoren de vereiste verlaging niet
 * dekken (duur-gedreven risico).
 */
export function dbaMitigations(input: DbaInput): DbaMitigationPlan | null {
  const { level, score } = assessDbaRisk(input);
  let targetLevel: DbaRisk;
  let targetMaxScore: number;
  if (level === "HOOG") {
    targetLevel = "MIDDEN";
    targetMaxScore = 4; // HOOG = score >= 5, dus MIDDEN vergt score <= 4
  } else if (level === "MIDDEN") {
    targetLevel = "LAAG";
    targetMaxScore = 1; // MIDDEN = score >= 2, dus LAAG vergt score <= 1
  } else {
    return null;
  }
  const needed = score - targetMaxScore;
  if (needed <= 0) return null;

  const active = LEVER_KEYS.filter((k) => input[k]);
  const idxKey = (subset: (keyof typeof WEIGHTS)[]) =>
    subset
      .map((k) => LEVER_KEYS.indexOf(k))
      .sort((a, b) => a - b)
      .join(",");

  let best: { subset: (keyof typeof WEIGHTS)[]; weight: number } | null = null;
  const n = active.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const subset: (keyof typeof WEIGHTS)[] = [];
    let weight = 0;
    for (let i = 0; i < n; i++) {
      const key = active[i];
      if (key && mask & (1 << i)) {
        subset.push(key);
        weight += WEIGHTS[key];
      }
    }
    if (weight < needed) continue;
    if (
      best === null ||
      subset.length < best.subset.length ||
      (subset.length === best.subset.length && weight < best.weight) ||
      (subset.length === best.subset.length &&
        weight === best.weight &&
        idxKey(subset) < idxKey(best.subset))
    ) {
      best = { subset, weight };
    }
  }
  if (best === null) return null;

  const ordered = [...best.subset].sort((a, b) => LEVER_KEYS.indexOf(a) - LEVER_KEYS.indexOf(b));
  return {
    targetLevel,
    changes: ordered.map((factor) => ({ factor, action: MITIGATION_ACTIONS[factor] })),
  };
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
