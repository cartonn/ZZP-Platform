/**
 * Statusfilter voor het bemiddelaar-overzicht "Diensten" (`/franchise/diensten`). Anders dan het
 * opdrachtgever-`/opdrachten`-filter (`job-status-filter.ts`, puur op `status`) leeft hier naast de
 * `status` (DRAFT/PUBLISHED/CLOSED) een afgeleide `filled`-boolean: een dienst geldt als "gevuld"
 * zodra er een actieve samenwerking op loopt — ongeacht zijn `status`. De bemiddelaar denkt in
 * vulgraad, niet in ruwe statussen, dus de filtergroepen zijn afgeleide triage-buckets, niet 1-op-1
 * de enum. Pure functies → unit-testbaar zonder database. Spiegelt het pill-patroon van /opdrachten,
 * /facturen en /kandidaten.
 *
 * De groepen zijn **wederzijds uitsluitend** (elke rij valt in precies één niet-`all`-groep, zodat
 * de som van de losse tellingen het totaal is) en volgen dezelfde precedentie als de badge in de
 * lijst (`filled ? "Gevuld" : JobStatusBadge(status)`), zodat pill en badge dezelfde taal spreken:
 * een gevulde dienst hoort onder "Gevuld", ongeacht zijn ruwe status.
 */

export const DIENST_STATUS_FILTER_GROUPS = ["all", "open", "filled", "concept", "closed"] as const;
export type DienstStatusFilterGroup = (typeof DIENST_STATUS_FILTER_GROUPS)[number];

/** Labels gelijk aan de badges in de lijst zodat pill en badge dezelfde taal spreken. */
export const DIENST_STATUS_FILTER_LABEL: Record<DienstStatusFilterGroup, string> = {
  all: "Alle",
  open: "Open",
  filled: "Gevuld",
  concept: "Concept",
  closed: "Gesloten",
};

/** Volgorde van de filter-pills: eerst wat aandacht vraagt (open), dan gevuld, dan de rand-statussen. */
export const DIENST_STATUS_FILTER_ORDER: DienstStatusFilterGroup[] = [
  "all",
  "open",
  "filled",
  "concept",
  "closed",
];

export type DienstStatusLike = { status: string; filled: boolean };

/**
 * Afgeleide primaire groep van één dienst. Precedentie spiegelt de lijst-badge:
 * gevuld > concept (DRAFT) > gesloten (CLOSED) > open (gepubliceerd, ongevuld).
 * Een gepubliceerde-maar-ongevulde dienst is "open"; een gevulde dienst altijd "filled".
 */
export function dienstStatusGroup(
  dienst: DienstStatusLike,
): Exclude<DienstStatusFilterGroup, "all"> {
  if (dienst.filled) return "filled";
  if (dienst.status === "DRAFT") return "concept";
  if (dienst.status === "CLOSED") return "closed";
  return "open";
}

/** Onbekende/lege waarde → "all". Eén bron voor het inlezen van de `status`-searchParam. */
export function parseDienstStatusFilter(value: string | undefined): DienstStatusFilterGroup {
  return (DIENST_STATUS_FILTER_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as DienstStatusFilterGroup)
    : "all";
}

/**
 * Filtert op groep met behoud van de invoervolgorde; "all" geeft de lijst ongewijzigd terug.
 * Muteert de invoer niet.
 */
export function filterDienstenByStatus<T extends DienstStatusLike>(
  diensten: T[],
  group: DienstStatusFilterGroup,
): T[] {
  if (group === "all") return diensten.slice();
  return diensten.filter((d) => dienstStatusGroup(d) === group);
}

/** Telling per groep over de volledige lijst (voor de pill-labels). `all` = totaal. */
export function summarizeDienstStatusGroups(
  diensten: DienstStatusLike[],
): Record<DienstStatusFilterGroup, number> {
  const counts: Record<DienstStatusFilterGroup, number> = {
    all: diensten.length,
    open: 0,
    filled: 0,
    concept: 0,
    closed: 0,
  };
  for (const d of diensten) {
    counts[dienstStatusGroup(d)] += 1;
  }
  return counts;
}
