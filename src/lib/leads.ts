// Leads-logica (franchise-acquisitie): labels, status-taal en de overgangsregels. Pure functies
// (geen I/O), los getest. De server bepaalt de waarheid; deze helpers leveren deterministisch de
// presentatie en de toegestane overgangen (CLAUDE.md regel 1 + 3).

import { LEAD_TRANSITIONS, type LeadStatus } from "@/lib/enums";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  KOUD: "Koud",
  WARM: "Warm",
  KLANT: "Klant",
  NO_DEAL: "Afgevallen",
};

// Status-taal conform DESIGN.md §7: nog niet opgepakt = muted, in gesprek = warning, binnen =
// success, afgevallen = danger. `accent` blijft gereserveerd voor de match-score-signatuur.
export const LEAD_STATUS_VARIANT: Record<LeadStatus, "muted" | "warning" | "success" | "danger"> = {
  KOUD: "muted",
  WARM: "warning",
  KLANT: "success",
  NO_DEAL: "danger",
};

/** Mag een lead van `from` naar `to`? Volgt de expliciete overgangsmap (CLAUDE.md regel 3). */
export function canLeadTransition(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}

/**
 * Een lead als afgevallen markeren vereist een reden — net als een verificatie-afwijzing
 * (CLAUDE.md verificatieflow §4). Server-side afgedwongen, zodat de reden in de tijdlijn belandt.
 */
export function leadStatusRequiresReason(to: LeadStatus): boolean {
  return to === "NO_DEAL";
}
