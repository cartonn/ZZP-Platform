// Ideeënbox-logica: rangschikking en presentatie van ingediende ideeën. Pure functies (geen I/O),
// los getest. De server levert de ideeën met hun stemtelling; deze helper bepaalt deterministisch
// de volgorde en de labels — server-side waarheid, geen client-logica (CLAUDE.md regel 1).

import {
  IDEA_AUDIENCES,
  IDEA_THEMES,
  IDEA_TRANSITIONS,
  type IdeaAudience,
  type IdeaStatus,
  type IdeaTheme,
} from "@/lib/enums";

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  OPEN: "Open",
  PLANNED: "Gepland",
  DONE: "Uitgevoerd",
  DECLINED: "Afgewezen",
};

// Doelgroep- en thema-labels (NL). Twee onafhankelijke assen om de box filterbaar te houden.
export const IDEA_AUDIENCE_LABEL: Record<IdeaAudience, string> = {
  PLATFORM: "Platformbreed",
  BROKER: "Bemiddelaar",
  FREELANCER: "ZZP'er",
  CLIENT: "Opdrachtgever",
};

export const IDEA_THEME_LABEL: Record<IdeaTheme, string> = {
  COMPLIANCE: "Compliance",
  BILLING: "Facturatie",
};

/** Type-guard voor een doelgroep uit ruwe invoer (bv. een querystring-filter). */
export function isIdeaAudience(value: string): value is IdeaAudience {
  return (IDEA_AUDIENCES as readonly string[]).includes(value);
}

/** Type-guard voor een thema uit ruwe invoer (bv. een querystring-filter). */
export function isIdeaTheme(value: string): value is IdeaTheme {
  return (IDEA_THEMES as readonly string[]).includes(value);
}

// Status-taal conform DESIGN.md §7: wacht/in behandeling = warning, afgerond = success, afgewezen =
// danger, nog niet opgepakt = muted. `accent` blijft gereserveerd voor de match-score-signatuur.
export const IDEA_STATUS_VARIANT: Record<IdeaStatus, "muted" | "warning" | "success" | "danger"> = {
  OPEN: "muted",
  PLANNED: "warning",
  DONE: "success",
  DECLINED: "danger",
};

/** Mag een idee van `from` naar `to`? Volgt de expliciete overgangsmap (CLAUDE.md regel 3). */
export function canIdeaTransition(from: IdeaStatus, to: IdeaStatus): boolean {
  return IDEA_TRANSITIONS[from].includes(to);
}

/**
 * Afwijzen vereist een reden — net als een verificatie-afwijzing (CLAUDE.md verificatieflow §4).
 * Server-side afgedwongen, zodat de ZZP'er/indiener altijd weet waaróm.
 */
export function ideaStatusRequiresReason(to: IdeaStatus): boolean {
  return to === "DECLINED";
}

export interface RankableIdea {
  id: string;
  voteCount: number;
  createdAt: Date;
  status: IdeaStatus;
}

// Afgehandelde ideeën (uitgevoerd/afgewezen) zakken onder de nog lopende.
const RESOLVED: Record<IdeaStatus, number> = { OPEN: 0, PLANNED: 0, DONE: 1, DECLINED: 1 };

// Sorteerkeuzes in de UI. "top" = meest gewenst (stemmen); "new" = nieuwste eerst. Afgehandelde
// ideeën zakken in beide gevallen onder de lopende, zodat de actieve lijst bovenaan blijft.
export const IDEA_SORTS = ["top", "new"] as const;
export type IdeaSort = (typeof IDEA_SORTS)[number];
export const IDEA_SORT_LABEL: Record<IdeaSort, string> = { top: "Meest gewenst", new: "Nieuwste" };

/** Normaliseert een ruwe querystring-waarde naar een geldige sorteerkeuze (default "top"). */
export function parseIdeaSort(value: string | undefined): IdeaSort {
  return (IDEA_SORTS as readonly string[]).includes(value ?? "") ? (value as IdeaSort) : "top";
}

const byRecency = (a: RankableIdea, b: RankableIdea) => {
  const dt = b.createdAt.getTime() - a.createdAt.getTime();
  return dt !== 0 ? dt : a.id.localeCompare(b.id);
};

/**
 * Sorteer ideeën deterministisch volgens de gekozen sleutel. In beide gevallen staan de lopende
 * ideeën (OPEN/PLANNED) boven de afgehandelde (DONE/DECLINED).
 * - "top": op stemmen (aflopend), dan nieuwste eerst, met id als stabiele tiebreaker.
 * - "new": puur op recency binnen elke groep.
 */
export function sortIdeas<T extends RankableIdea>(
  ideas: readonly T[],
  sort: IdeaSort = "top",
): T[] {
  return [...ideas].sort((a, b) => {
    if (RESOLVED[a.status] !== RESOLVED[b.status]) return RESOLVED[a.status] - RESOLVED[b.status];
    if (sort === "top" && a.voteCount !== b.voteCount) return b.voteCount - a.voteCount;
    return byRecency(a, b);
  });
}

/** Rangschik op meest gewenst — behouden voor bestaande aanroepers; alias van `sortIdeas(_, "top")`. */
export function rankIdeas<T extends RankableIdea>(ideas: readonly T[]): T[] {
  return sortIdeas(ideas, "top");
}
