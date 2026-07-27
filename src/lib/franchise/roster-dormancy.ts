// Re-engagement-signaal voor de bemiddelaar (franchiser) op het ZZP'er-roster (`/franchise/zzpers`).
// Spiegelbeeld van `client-reengagement.ts` (dat de KLANT-relatie warm houdt) voor de ZZP-kant: een
// vakmens die op de bench zit (geen lopende opdracht) én lang niet meer inlogde koelt af en drijft
// stil weg naar een concurrent — precies de vakmens die de bemiddelaar proactief moet benaderen vóór
// hij afhaakt (benchmark: staffing-platformen bewaken werker-engagement). Pure, deterministische
// afleiding over de reeds tenant-gescopet opgehaalde roster-rijen (`user.lastLoginAt`) — geen I/O,
// `now` geïnjecteerd, los getest. De server bepaalt de waarheid; deze helper levert enkel de
// presentatie (CLAUDE.md regel 1).
//
// Onderscheiden van de `recencyStale`-vlag in `computeEngageability`: die telt >60 dagen niet-inloggen
// mee als één van vele aandachtspunten voor de inzetbaarheidsstatus (óók voor een nu-ingezette
// vakmens). Dit signaal kijkt door een andere bril — uitsluitend de **vrije bench** die afkoelt — en
// levert een aggregate + filter + concrete "benader"-stap, wat de engageability-status niet doet.

import { plural } from "@/lib/plural";
import { wholeDaysBetween } from "./client-health";

/** Dagen bench-inactiviteit vanaf wanneer een vakmens "stilgevallen" heet (spiegelt RECENCY_STALE_DAYS). */
export const DORMANT_IDLE_DAYS = 60;
/** Dagen bench-inactiviteit vanaf wanneer een vakmens begint af te koelen (vroeg-signaal). */
export const COOLING_IDLE_DAYS = 30;

export type DormancyTier = "active" | "cooling" | "dormant";

/** Minimale invoer per ZZP'er — volledig afleidbaar uit de al opgehaalde roster-rijen. */
export interface RosterDormancyInput {
  /** Laatste login; `null` = onbekend/nog nooit ingelogd (telt niet als stilgevallen — geen vals alarm). */
  lastActiveAt: Date | null;
  /** Aantal lopende (ACTIVE) samenwerkingen; > 0 = nu ingezet → engaged via het werk, geen re-engagement-doel. */
  activeCollaborations: number;
}

export interface RosterDormancy {
  tier: DormancyTier;
  /** Hele dagen sinds de laatste login; `null` wanneer niet van toepassing (ingezet of nooit ingelogd). */
  daysIdle: number | null;
  tone: "warning" | "muted" | null;
  /** Compacte chip-tekst op de roster-kaart; `null` voor een actieve/ingezette vakmens (rustige kaart). */
  label: string | null;
  /** Concrete volgende stap; `null` wanneer er niets te doen valt. */
  suggestion: string | null;
}

/**
 * Classificeert de bench-inactiviteit van één ZZP'er. Een nu-ingezette vakmens (activeCollaborations > 0)
 * is engaged via het werk en nooit een re-engagement-doel; een onbekende laatste-login (`null`) levert
 * bewust géén signaal (een net-toegevoegde vakmens zonder login mag niet als "stilgevallen" oplichten).
 */
export function classifyRosterDormancy(input: RosterDormancyInput, now: Date): RosterDormancy {
  if (input.activeCollaborations > 0 || input.lastActiveAt == null) {
    return { tier: "active", daysIdle: null, tone: null, label: null, suggestion: null };
  }

  const daysIdle = wholeDaysBetween(input.lastActiveAt, now);

  if (daysIdle >= DORMANT_IDLE_DAYS) {
    return {
      tier: "dormant",
      daysIdle,
      tone: "warning",
      label: `${plural(daysIdle, "dag", "dagen")} niet ingelogd`,
      suggestion: "Benader deze ZZP'er of stel een dienst voor voor hij afhaakt.",
    };
  }

  if (daysIdle >= COOLING_IDLE_DAYS) {
    return {
      tier: "cooling",
      daysIdle,
      tone: "muted",
      label: `${plural(daysIdle, "dag", "dagen")} niet ingelogd`,
      suggestion: "Houd contact zodat de vakmens betrokken blijft.",
    };
  }

  return { tier: "active", daysIdle, tone: null, label: null, suggestion: null };
}

export interface RosterDormancySummary {
  total: number;
  /** ≥ DORMANT_IDLE_DAYS bench-inactief — benader met prioriteit. */
  dormant: number;
  /** ≥ COOLING_IDLE_DAYS en < DORMANT_IDLE_DAYS bench-inactief — vroeg-signaal. */
  cooling: number;
}

/**
 * Telt de re-engagement-kandidaten per tier over het hele (ongefilterde) roster. Werkt op de reeds
 * per kaart geclassificeerde tiers (via {@link classifyRosterDormancy}) — één bron van waarheid met
 * de kaart-chips, geen herberekening die kan driften.
 */
export function summarizeRosterDormancy(
  items: readonly { dormancyTier: DormancyTier }[],
): RosterDormancySummary {
  const summary: RosterDormancySummary = { total: items.length, dormant: 0, cooling: 0 };
  for (const item of items) {
    if (item.dormancyTier === "dormant") summary.dormant += 1;
    else if (item.dormancyTier === "cooling") summary.cooling += 1;
  }
  return summary;
}

/**
 * Eén verklarende regel boven de tegels. `null` wanneer geen enkele bench-vakmens afkoelt — dan hoeft
 * de bemiddelaar niets te zien (rust boven ruis, DESIGN.md).
 */
export function rosterDormancyHeadline(summary: RosterDormancySummary): string | null {
  if (summary.dormant === 0 && summary.cooling === 0) return null;
  if (summary.dormant > 0) {
    return `${plural(summary.dormant, "vakmens is", "vakmensen zijn")} stilgevallen — lang niet ingelogd en niet ingezet. Benader ze voor ze afhaken.`;
  }
  return `${plural(summary.cooling, "vakmens", "vakmensen")} ${summary.cooling === 1 ? "koelt" : "koelen"} af — houd contact zodat de bench betrokken blijft.`;
}
