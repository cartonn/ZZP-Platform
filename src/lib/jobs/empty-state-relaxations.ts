// Slimme lege staat voor de opdrachten-marktplaats (`/opdrachten`, ZZP'er).
//
// Wanneer de gefilterde marktplaats niets oplevert, is de nuttigste actie zelden "wis álles" maar
// "verbreed één ding": de ZZP'er filterde op zijn eigen vakgebied en ziet vandaag niks, terwijl er
// wél ander werk is. Deze pure helpers leiden uit de actieve filters af welke één-filter-
// versoepelingen zinvol zijn (`buildRelaxationCandidates`) en rangschikken de getelde varianten op
// de meeste kansen eerst (`rankRelaxations`). De telling zelf is I/O (een DB-count in de pagina) en
// gebeurt buiten deze module, zodat alles hier deterministisch en unit-testbaar blijft.
//
// Elke versoepeling relaxt precies één dimensie en houdt de overige actieve filters intact, zodat
// het getoonde aantal exact is wat de ZZP'er ná de klik ziet (dezelfde `buildJobMarketplaceWhere`).
// De `onlyEligible`-quickfilter is een uitzondering: die wordt niet in de DB-where toegepast maar in
// het geheugen (per-ZZP'er compliance). Zolang die aanstaat, zouden de tellingen van andere
// versoepelingen de niet-inzetbare opdrachten meetellen en dus overdrijven — daarom bieden we dan
// uitsluitend het versoepelen van `onlyEligible` zelf aan (die telling is wél exact: de where negeert
// de vlag al). Zo klopt elk getoond aantal altijd met de lijst die de klik oplevert.

import type { JobFilters } from "@/lib/jobs";

/** De filterdimensie die een versoepeling loslaat. Ook het React-key/test-anker. */
export type RelaxationKind =
  | "onlyEligible"
  | "vakgebied"
  | "requiredCredential"
  | "skills"
  | "workMode"
  | "rate"
  | "location"
  | "hideApplied"
  | "q";

/**
 * Vaste voorkeursvolgorde: bij een gelijk aantal treffers bepaalt deze index wie eerst getoond wordt.
 * Vakgebied bovenaan — de vaakst (stil, standaard-aan) versmallende filter en meestal de meest
 * bevrijdende verbreding.
 */
const PRIORITY: RelaxationKind[] = [
  "onlyEligible",
  "vakgebied",
  "requiredCredential",
  "skills",
  "workMode",
  "rate",
  "location",
  "hideApplied",
  "q",
];

const priorityIndex = (kind: RelaxationKind): number => {
  const i = PRIORITY.indexOf(kind);
  return i === -1 ? PRIORITY.length : i;
};

/** Eén voorgestelde versoepeling: welke dimensie, de knoptekst en de reeds-versoepelde filters. */
export interface RelaxationCandidate {
  kind: RelaxationKind;
  label: string;
  /** De filters met exact deze ene dimensie losgelaten; `page` altijd terug naar 1. */
  filters: JobFilters;
}

/** Een getelde versoepeling, klaar om te rangschikken en te tonen. */
export interface RelaxationSuggestion {
  kind: RelaxationKind;
  label: string;
  /** Aantal opdrachten dat de versoepelde filters oplevert (DB-count, exact). */
  count: number;
  /** Doel-URL van de versoepelde zoekopdracht. */
  href: string;
}

/**
 * Leid uit de genormaliseerde filters de zinvolle één-filter-versoepelingen af, in vaste volgorde.
 *
 * - Staat `onlyEligible` aan, dan is dat de enige aangeboden versoepeling (zie modulekop: anders
 *   zouden de overige tellingen de niet-inzetbare opdrachten meetellen en overdrijven).
 * - Anders: elke actieve DB-where-filter levert één kandidaat die precies die dimensie loslaat.
 *
 * `page` wordt altijd naar 1 gezet (een versoepeling toont de eerste pagina van de bredere set).
 * De functie is puur en doet geen I/O; het tellen gebeurt in de aanroeper.
 */
export function buildRelaxationCandidates(f: JobFilters): RelaxationCandidate[] {
  const relax = (next: Partial<JobFilters>): JobFilters => ({ ...f, ...next, page: 1 });

  // `onlyEligible` (in-memory) aan → alleen die verbreding aanbieden, met een exacte telling.
  if (f.onlyEligible) {
    return [
      {
        kind: "onlyEligible",
        label: "Ook opdrachten waarvoor je nog niet voldoet",
        filters: relax({ onlyEligible: false }),
      },
    ];
  }

  const candidates: RelaxationCandidate[] = [];

  // Vakgebied: een expliciete branche óf de "Mijn vakgebied"-quickfilter. Beide loslaten opent de
  // volledige markt (industryId overkoepelt mine in de where; we wissen daarom allebei).
  if (f.industryId || f.mine) {
    candidates.push({
      kind: "vakgebied",
      label: "Zoek in alle vakgebieden",
      filters: relax({ industryId: undefined, mine: false }),
    });
  }

  if (f.requiredCredential) {
    candidates.push({
      kind: "requiredCredential",
      label: "Alle certificaat-eisen tonen",
      filters: relax({ requiredCredential: undefined }),
    });
  }

  if (f.skillIds.length > 0) {
    candidates.push({
      kind: "skills",
      label: "Zonder vaardigheidsfilter",
      filters: relax({ skillIds: [] }),
    });
  }

  if (f.workMode) {
    candidates.push({
      kind: "workMode",
      label: "Alle werkvormen",
      filters: relax({ workMode: undefined }),
    });
  }

  if (f.rateMin != null || f.rateMax != null) {
    candidates.push({
      kind: "rate",
      label: "Zonder tariefgrens",
      filters: relax({ rateMin: undefined, rateMax: undefined }),
    });
  }

  if (f.location) {
    candidates.push({
      kind: "location",
      label: "Overal (elke locatie)",
      filters: relax({ location: undefined }),
    });
  }

  if (f.hideApplied) {
    candidates.push({
      kind: "hideApplied",
      label: "Ook opdrachten waarop je al reageerde",
      filters: relax({ hideApplied: false }),
    });
  }

  if (f.q.trim() !== "") {
    candidates.push({ kind: "q", label: "Zonder zoekterm", filters: relax({ q: "" }) });
  }

  return candidates;
}

/**
 * Rangschik de getelde versoepelingen: alleen die met treffers, de meeste kansen eerst, en gekapt op
 * `max` zodat de lege staat rustig blijft. Bij een gelijk aantal wint de vaste voorkeursvolgorde
 * (`PRIORITY`). Puur en stabiel.
 */
export function rankRelaxations(
  suggestions: readonly RelaxationSuggestion[],
  max = 2,
): RelaxationSuggestion[] {
  return suggestions
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || priorityIndex(a.kind) - priorityIndex(b.kind))
    .slice(0, Math.max(0, max));
}
