// Academie-logica: labels, status-taal, overgangsregels, voortgang en doelgroep-zichtbaarheid. Pure
// functies (geen I/O), los getest. De server bepaalt de waarheid; deze helpers leveren deterministisch
// de presentatie en de regels (CLAUDE.md regel 1 + 3).

import {
  COURSE_TRANSITIONS,
  type CourseStatus,
  type CourseAudience,
  type UserRole,
} from "@/lib/enums";

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: "Concept",
  PUBLISHED: "Gepubliceerd",
  ARCHIVED: "Gearchiveerd",
};

// Status-taal conform DESIGN.md §7: concept/gearchiveerd = muted, gepubliceerd = success.
export const COURSE_STATUS_VARIANT: Record<CourseStatus, "muted" | "success"> = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ARCHIVED: "muted",
};

export const COURSE_AUDIENCE_LABEL: Record<CourseAudience, string> = {
  ALL: "Iedereen",
  FREELANCER: "ZZP'ers",
  CLIENT: "Opdrachtgevers",
};

/** Mag een cursus van `from` naar `to`? Volgt de expliciete overgangsmap (CLAUDE.md regel 3). */
export function canCourseTransition(from: CourseStatus, to: CourseStatus): boolean {
  return COURSE_TRANSITIONS[from].includes(to);
}

/**
 * De doelgroepen die voor een rol zichtbaar zijn. Iedereen ziet ALL; daarnaast de eigen rol-as.
 * ADMIN ziet alles (beheer). Gebruikt om de cursuslijst server-side te filteren.
 */
export function visibleAudiencesForRole(role: UserRole): CourseAudience[] {
  if (role === "ADMIN") return ["ALL", "FREELANCER", "CLIENT"];
  if (role === "CLIENT") return ["ALL", "CLIENT"];
  if (role === "FREELANCER") return ["ALL", "FREELANCER"];
  return ["ALL"]; // FRANCHISER e.d.: alleen algemene cursussen
}

export interface CourseProgress {
  done: number;
  total: number;
  pct: number;
  completed: boolean;
}

/** Voortgang van een cursus: aantal voltooide lessen / totaal, als percentage (0 bij lege cursus). */
export function courseProgress(done: number, total: number): CourseProgress {
  const pct = total <= 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct, completed: total > 0 && done >= total };
}
