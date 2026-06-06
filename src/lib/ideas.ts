// Ideeënbox-logica: rangschikking en presentatie van ingediende ideeën. Pure functies (geen I/O),
// los getest. De server levert de ideeën met hun stemtelling; deze helper bepaalt deterministisch
// de volgorde en de labels — server-side waarheid, geen client-logica (CLAUDE.md regel 1).

import { IDEA_TRANSITIONS, type IdeaStatus } from "@/lib/enums";

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  OPEN: "Open",
  PLANNED: "Gepland",
  DONE: "Uitgevoerd",
  DECLINED: "Afgewezen",
};

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

export interface RankableIdea {
  id: string;
  voteCount: number;
  createdAt: Date;
  status: IdeaStatus;
}

// Afgehandelde ideeën (uitgevoerd/afgewezen) zakken onder de nog lopende.
const RESOLVED: Record<IdeaStatus, number> = { OPEN: 0, PLANNED: 0, DONE: 1, DECLINED: 1 };

/**
 * Rangschik ideeën: eerst de lopende (OPEN/PLANNED), dan de afgehandelde; binnen elke groep op
 * stemmen (aflopend), daarna nieuwste eerst, met id als stabiele tiebreaker. Deterministisch.
 */
export function rankIdeas<T extends RankableIdea>(ideas: readonly T[]): T[] {
  return [...ideas].sort((a, b) => {
    if (RESOLVED[a.status] !== RESOLVED[b.status]) return RESOLVED[a.status] - RESOLVED[b.status];
    if (a.voteCount !== b.voteCount) return b.voteCount - a.voteCount;
    const dt = b.createdAt.getTime() - a.createdAt.getTime();
    return dt !== 0 ? dt : a.id.localeCompare(b.id);
  });
}
