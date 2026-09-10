// Globale snelzoeker (⌘K) — pure kern.
// Deterministische, DB-onafhankelijke ranking. De server-actie
// (src/app/(protected)/search/actions.ts) haalt rol-gescopte, begrensde kandidaten op,
// scoort ze met deze helpers en rankt het geheel. De client beslist nooit over
// zichtbaarheid of volgorde — dat is server-side waarheid.

export type SearchType =
  | "opdracht"
  | "samenwerking"
  | "factuur"
  | "certificaat"
  | "bericht"
  | "gebruiker";

export interface SearchResult {
  type: SearchType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Relevantiescore (server-berekend); hoger = relevanter. Zie {@link scoreField}. */
  score: number;
}

/** Nederlandse groepslabels (meervoud) per type. */
export const SEARCH_TYPE_LABEL: Record<SearchType, string> = {
  opdracht: "Opdrachten",
  samenwerking: "Samenwerkingen",
  factuur: "Facturen",
  certificaat: "Certificaten",
  bericht: "Berichten",
  gebruiker: "Gebruikers",
};

/** Vaste groepsvolgorde — bepaalt de stabiele tiebreak bij gelijke score. */
export const SEARCH_TYPE_ORDER: readonly SearchType[] = [
  "opdracht",
  "samenwerking",
  "factuur",
  "certificaat",
  "bericht",
  "gebruiker",
];

/** Minimale lengte van een betekenisvolle zoekterm. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Maximale lengte van een zoekterm die we verwerken. De snelzoeker is een direct aanroepbare
 * server-actie (`searchPlatform`), dus een scripted aanroeper kan een ongebonden string insturen;
 * zonder cap zou elke aanroep die volledige string trimmen/lowercasen én per kandidaatveld scoren.
 * Een betekenisvolle zoekterm is kort en langer dan dit voegt niets toe aan de score (`scoreField`
 * matcht een term die langer is dan het veld toch nooit). We begrenzen daarom de ruwe invoer vóór
 * elke stringbewerking — defense-in-depth tegen een flood, server-side (CLAUDE.md regel 1).
 */
export const MAX_QUERY_LENGTH = 100;

/** Standaard maximum aantal resultaten dat de snelzoeker toont. */
export const DEFAULT_SEARCH_LIMIT = 8;

/**
 * Normaliseert een zoekterm: begrens de ruwe lengte, trim, witruimte inklappen, lowercase.
 * De lengtebegrenzing gebeurt vóór de regex-/case-bewerkingen zodat die nooit over een ongebonden
 * string lopen (zie {@link MAX_QUERY_LENGTH}).
 */
export function normalizeSearchQuery(raw: string): string {
  return raw.slice(0, MAX_QUERY_LENGTH).trim().replace(/\s+/g, " ").toLowerCase();
}

/** True als de (ruwe) zoekterm betekenisvol genoeg is om op te zoeken. */
export function isSearchableQuery(raw: string): boolean {
  return normalizeSearchQuery(raw).length >= MIN_QUERY_LENGTH;
}

/**
 * Scoort één veld tegen de genormaliseerde zoekterm. Hoofdletterongevoelig.
 *   4 = exacte match · 3 = begint met de term · 2 = een woord begint met de term ·
 *   1 = bevat de term · 0 = geen match.
 */
export function scoreField(value: string | null | undefined, normalizedQuery: string): number {
  if (!value || !normalizedQuery) return 0;
  const v = value.trim().toLowerCase();
  if (!v) return 0;
  if (v === normalizedQuery) return 4;
  if (v.startsWith(normalizedQuery)) return 3;
  if (v.split(/\s+/).some((word) => word.startsWith(normalizedQuery))) return 2;
  if (v.includes(normalizedQuery)) return 1;
  return 0;
}

/** Beste score over meerdere velden (bv. titel + ondertitel + nummer). */
export function bestFieldScore(
  values: Array<string | null | undefined>,
  normalizedQuery: string,
): number {
  return values.reduce<number>(
    (best, value) => Math.max(best, scoreField(value, normalizedQuery)),
    0,
  );
}

/**
 * Rankt en begrenst resultaten. Sorteert op score (hoog→laag), dan op de vaste
 * type-volgorde, dan alfabetisch op titel (NL). Volledig deterministisch:
 * dezelfde invoer levert altijd dezelfde volgorde.
 */
export function rankResults(
  results: SearchResult[],
  limit: number = DEFAULT_SEARCH_LIMIT,
): SearchResult[] {
  return [...results]
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = SEARCH_TYPE_ORDER.indexOf(a.type);
      const tb = SEARCH_TYPE_ORDER.indexOf(b.type);
      if (ta !== tb) return ta - tb;
      return a.title.localeCompare(b.title, "nl");
    })
    .slice(0, Math.max(0, limit));
}

export interface SearchResultGroup {
  type: SearchType;
  label: string;
  items: SearchResult[];
}

/** Groepeert (al geranks te) resultaten per type, in de vaste volgorde; lege groepen weg. */
export function groupResultsByType(results: SearchResult[]): SearchResultGroup[] {
  return SEARCH_TYPE_ORDER.map((type) => ({
    type,
    label: SEARCH_TYPE_LABEL[type],
    items: results.filter((r) => r.type === type),
  })).filter((group) => group.items.length > 0);
}
