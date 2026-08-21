// Grootste knelpunt in het bereik van een opdracht (opdrachtgever-signaal). De bereikkaart toont al
// hoeveel passende ZZP'ers de opdracht bereikt en geeft een generieke sturingstip; deze module maakt
// die tip concreet en data-gedreven: welke enkele eis is de meest voorkomende drempel bij de passende-
// maar-nog-niet-sterk-beschikbare ZZP'ers, zodat de opdrachtgever gericht kan bijsturen (tarief, een
// verplichte skill loslaten, werkvorm verruimen) in plaats van gokken. Hergebruikt de bestaande,
// verklaarbare match-gap-redenen (`topGapReasonComplianceFirst`) — geen wijziging aan de matchmotor.
// Pure functies, getest. Server-side is de waarheid (CLAUDE.md regel 1): de client toont, beslist niets.

import { REACH_MIN_SCORE, REACH_STRONG_SCORE } from "@/lib/job-reach";

/** Categorie waarin een match-gap valt; bepaalt de gerichte sturingsactie. */
export type ReachGapCategory =
  | "credential"
  | "skills"
  | "rate"
  | "workMode"
  | "travel"
  | "branche"
  | "availability";

/**
 * Vaste prioriteitsvolgorde voor een gelijkspel tussen twee even vaak voorkomende categorieën:
 * de zwaarst weegende / hardst blokkerende drempel wint, zodat de uitkomst deterministisch is
 * (geen afhankelijkheid van iteratievolgorde). Een ontbrekend verplicht certificaat is de hardste
 * blokkade en staat daarom bovenaan.
 */
const CATEGORY_PRIORITY: readonly ReachGapCategory[] = [
  "credential",
  "skills",
  "rate",
  "workMode",
  "travel",
  "branche",
  "availability",
];

/**
 * Vertaalt een match-gap-label (uit `computeMatchScore`) naar een bereik-knelpuntcategorie.
 * Werkt op de stabiele labelpatronen die de matchmotor produceert; een onbekend label → `null`
 * (telt niet mee, verzint nooit een categorie). Volgorde van de checks is bewust: de
 * certificaat-check vóór de generieke "Mist ..."-skills-check.
 */
export function categorizeReachGap(label: string): ReachGapCategory | null {
  if (label.includes("ertificaat")) return "credential"; // "Mist vereist certificaat" / "... verlopen" / "Certificaat in beoordeling"
  if (label.includes("vereiste skills")) return "skills"; // "Mist N van M vereiste skills"
  if (label.includes("budget")) return "rate"; // "Tarief ligt boven het budget"
  if (label.includes("Werkmodus")) return "workMode"; // "Werkmodus sluit niet aan"
  if (label.includes("reistijd")) return "travel"; // "Verder dan je max. reistijd (ca. N min)"
  if (label.includes("branche")) return "branche"; // "Andere branche dan jouw profiel"
  if (label.includes("beschikbaar")) return "availability"; // "Momenteel niet beschikbaar"
  return null;
}

/** Kandidaat in de bereik-scan, met het zwaarst wegende minpunt (compliance-eerst) als label. */
export interface ReachBottleneckCandidate {
  /** Matchscore 0-100 uit de verklaarbare matchmotor. */
  score: number;
  /** Of de ZZP'er nu beschikbaar is (availability AVAILABLE). */
  available: boolean;
  /** Het zwaarst wegende minpunt-label (bv. via `topGapReasonComplianceFirst`); `null` = geen minpunt. */
  topGapLabel: string | null;
}

export interface ReachBottleneck {
  category: ReachGapCategory;
  /** Aantal passende, nog-niet-sterk-beschikbare ZZP'ers waar deze categorie het minpunt is. */
  count: number;
  /** Omvang van de conversie-pool (passend maar nog niet sterk én beschikbaar) waartegen `count` telt. */
  poolSize: number;
  /** Korte chip-tekst (categorie). */
  label: string;
  /** Gerichte sturingstip met de telling. */
  hint: string;
}

const CATEGORY_LABEL: Record<ReachGapCategory, string> = {
  credential: "Vereist certificaat",
  skills: "Vereiste skills",
  rate: "Tarief boven budget",
  workMode: "Werkmodus",
  travel: "Reistijd",
  branche: "Branche",
  availability: "Beschikbaarheid",
};

function categoryHint(category: ReachGapCategory, count: number): string {
  const n = `${count} passende ZZP'er${count === 1 ? "" : "s"}`;
  switch (category) {
    case "credential":
      return `${n} mist een vereist certificaat of het is verlopen. Overweeg of elke certificaateis strikt nodig is, of nodig gerichte ZZP'ers uit.`;
    case "skills":
      return `${n} mist een of meer vereiste skills. Markeer minder skills als 'vereist' (optioneel telt lichter mee) om je bereik te vergroten.`;
    case "rate":
      return `Het tarief van ${n} ligt boven je budget. Een hoger maximumtarief vergroot je keuze.`;
    case "workMode":
      return `De werkmodus sluit niet aan bij ${n}. Sta bijvoorbeeld hybride of remote toe voor meer bereik.`;
    case "travel":
      return `De reisafstand valt buiten wat ${n} accepteert. Een locatie dichter bij hun regio of remote-werk vergroot je bereik.`;
    case "branche":
      return `${n} werkt in een andere branche. Verruim eventueel de branche van de opdracht.`;
    case "availability":
      return `${n} is nu niet beschikbaar. Plan de startdatum ruimer of nodig ZZP'ers met een passend beschikbaarheidsvenster uit.`;
  }
}

/**
 * Bepaalt het grootste knelpunt in de bereik-pool: de meest voorkomende gap-categorie onder de
 * passende (score ≥ {@link REACH_MIN_SCORE}) ZZP'ers die nog niet "sterk én nu beschikbaar" zijn —
 * precies de groep die de opdrachtgever met één ingreep kan ontsluiten. Geeft `null` wanneer er geen
 * dominante drempel is (minder dan 2 ZZP'ers delen dezelfde categorie), zodat we nooit over-claimen
 * op een enkeling. Puur en deterministisch: gelijkspel wordt gebroken op {@link CATEGORY_PRIORITY}.
 */
export function summarizeReachBottleneck(
  candidates: readonly ReachBottleneckCandidate[],
): ReachBottleneck | null {
  // Conversie-pool: passend, maar nog niet de zuiverste "sterk én nu beschikbaar" — die groep telt al
  // als bereik en hoeft niet ontsloten te worden.
  const pool = candidates.filter(
    (c) => c.score >= REACH_MIN_SCORE && !(c.score >= REACH_STRONG_SCORE && c.available),
  );
  if (pool.length === 0) return null;

  const counts = new Map<ReachGapCategory, number>();
  for (const c of pool) {
    if (!c.topGapLabel) continue;
    const category = categorizeReachGap(c.topGapLabel);
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  let best: ReachGapCategory | null = null;
  let bestCount = 0;
  for (const category of CATEGORY_PRIORITY) {
    const count = counts.get(category) ?? 0;
    // Strikt groter: bij gelijkspel wint de eerder in CATEGORY_PRIORITY genoemde (al gekozen) categorie.
    if (count > bestCount) {
      best = category;
      bestCount = count;
    }
  }

  // Nooit over-claimen: een "meest voorkomende drempel" vraagt minstens twee ZZP'ers.
  if (best === null || bestCount < 2) return null;

  return {
    category: best,
    count: bestCount,
    poolSize: pool.length,
    label: CATEGORY_LABEL[best],
    hint: categoryHint(best, bestCount),
  };
}
