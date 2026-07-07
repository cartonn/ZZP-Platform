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

/** Vanaf hoeveel dagen zonder contact een WARM-lead als "stil" (waarschuwing) telt. */
export const LEAD_STALE_WARN_DAYS = 14;

/**
 * Is de lead nog actief in de pijplijn (koud/warm)? Beslíste leads (KLANT/afgevallen) vragen geen
 * opvolging meer. Eén bron voor zowel de pijplijn-aggregatie als de lijstweergave, zodat de
 * "dagen geen contact"-teller en het "X stil"-signaal dezelfde definitie delen.
 */
export function isActiveLeadStatus(status: LeadStatus): boolean {
  return status === "KOUD" || status === "WARM";
}

/**
 * Tonen we de "X dagen geen contact"-regel voor deze lead? Alleen bij een actieve lead: bij een
 * afgevallen (NO_DEAL) of binnengehaalde (KLANT) lead is de stiltemeter betekenisloos en verwarrend
 * (een afgevallen lead die "30 dagen geen contact" toont leest als een openstaande actie).
 */
export function showsContactSilence(status: LeadStatus): boolean {
  return isActiveLeadStatus(status);
}

/**
 * Aantal hele dagen sinds het laatste contactmoment (of, bij ontbreken daarvan, sinds aanmaak).
 * Op dagniveau in UTC — consistent met de overige lead-datumlogica. Nooit negatief.
 */
export function daysSinceContact(
  now: Date,
  createdAt: Date,
  lastContactAt: Date | null | undefined,
): number {
  const ref = lastContactAt ?? createdAt;
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.floor((day(now) - day(ref)) / 86_400_000);
  return diff < 0 ? 0 : diff;
}

/** Een WARM-lead die ≥ {@link LEAD_STALE_WARN_DAYS} dagen geen contact had, ligt "stil". */
export function isLeadStale(status: LeadStatus, days: number): boolean {
  return status === "WARM" && days >= LEAD_STALE_WARN_DAYS;
}

export type LeadOrderInput = {
  status: LeadStatus;
  daysSinceContact: number;
  createdAt: Date;
};

/**
 * Sorteervolgorde voor de leadlijst: stille warme leads bovenaan (langst stil eerst), daarna de
 * rest op nieuwste aanmaak. Pure comparator — de server bepaalt de daadwerkelijke waarheid, deze
 * helper levert enkel de deterministische presentatievolgorde. Negatief = `a` vóór `b`.
 */
export function compareLeadsForList<T extends LeadOrderInput>(a: T, b: T): number {
  const aStale = isLeadStale(a.status, a.daysSinceContact);
  const bStale = isLeadStale(b.status, b.daysSinceContact);
  if (aStale !== bStale) return aStale ? -1 : 1;
  if (aStale && bStale) return b.daysSinceContact - a.daysSinceContact;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * Een lead als afgevallen markeren vereist een reden — net als een verificatie-afwijzing
 * (CLAUDE.md verificatieflow §4). Server-side afgedwongen, zodat de reden in de tijdlijn belandt.
 */
export function leadStatusRequiresReason(to: LeadStatus): boolean {
  return to === "NO_DEAL";
}
