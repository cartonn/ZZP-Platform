// Server-side filter + zoeken voor de berichtenlijst (/berichten). Puur en testbaar
// zonder DB: leunt op het al berekende aan-zet-signaal (`ConversationTurn`) en de al
// opgehaalde gesprek-metadata (tegenpartij + opdrachttitel). Spiegelt het filterpatroon
// van /admin/facturatie en /admin/dba: de keuze leeft in de URL-searchParams (deelbaar,
// herlaadbaar), niet in client-state. Geen schemawijziging, geen extra query — filtert de
// reeds geladen set; de tellingen blijven over de hele lijst (binnen de zoekscope).

import type { ConversationTurn } from "@/lib/conversation-turn";

/**
 * - `all`          — alle gesprekken.
 * - `awaiting-you` — de tegenpartij wacht op een antwoord van de kijker (turn === "yours").
 * - `awaiting-them`— de kijker wacht op antwoord (turn === "theirs").
 */
export type ConversationFilterStatus = "all" | "awaiting-you" | "awaiting-them";

export const CONVERSATION_FILTER_STATUSES: readonly ConversationFilterStatus[] = [
  "all",
  "awaiting-you",
  "awaiting-them",
];

export interface ConversationFilter {
  status: ConversationFilterStatus;
  /** Genormaliseerde zoekterm (getrimd + lowercase); "" betekent geen zoekterm. */
  query: string;
}

/** Minimale vorm die nodig is om te filteren — de pagina mapt zijn rijen hierop. */
export interface FilterableConversation {
  turn: ConversationTurn;
  otherName: string;
  jobTitle: string | null;
}

export interface ConversationFilterCounts {
  all: number;
  awaitingYou: number;
  awaitingThem: number;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isStatus(value: string | undefined): value is ConversationFilterStatus {
  return (
    value !== undefined && CONVERSATION_FILTER_STATUSES.includes(value as ConversationFilterStatus)
  );
}

/**
 * Leest de filterkeuze uit de searchParams. Een onbekende/ontbrekende status valt terug
 * op `all`; de zoekterm wordt getrimd en lowercase gemaakt (één bron voor de match).
 */
export function parseConversationFilter(params: {
  status?: string | string[] | undefined;
  q?: string | string[] | undefined;
}): ConversationFilter {
  const rawStatus = firstParam(params.status);
  const rawQuery = firstParam(params.q) ?? "";
  return {
    status: isStatus(rawStatus) ? rawStatus : "all",
    query: rawQuery.trim().toLowerCase(),
  };
}

function matchesStatus(turn: ConversationTurn, status: ConversationFilterStatus): boolean {
  if (status === "awaiting-you") return turn === "yours";
  if (status === "awaiting-them") return turn === "theirs";
  return true;
}

function matchesQuery(c: FilterableConversation, query: string): boolean {
  if (!query) return true;
  const haystack = `${c.otherName} ${c.jobTitle ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

/**
 * Filtert de gesprekken op zowel status als zoekterm. Behoudt de volgorde van de invoer
 * (de pagina sorteert al op `updatedAt desc`). Muteert de invoer niet.
 */
export function filterConversations<T extends FilterableConversation>(
  items: readonly T[],
  filter: ConversationFilter,
): T[] {
  return items.filter((c) => matchesStatus(c.turn, filter.status) && matchesQuery(c, filter.query));
}

/**
 * Telt per status binnen de huidige zoekscope, zodat de pills laten zien hoeveel elke keuze
 * oplevert bij de actieve zoekterm. Muteert de invoer niet.
 */
export function countConversations(
  items: readonly FilterableConversation[],
  query: string,
): ConversationFilterCounts {
  let all = 0;
  let awaitingYou = 0;
  let awaitingThem = 0;
  for (const c of items) {
    if (!matchesQuery(c, query)) continue;
    all += 1;
    if (c.turn === "yours") awaitingYou += 1;
    else if (c.turn === "theirs") awaitingThem += 1;
  }
  return { all, awaitingYou, awaitingThem };
}

/**
 * Bouwt het searchParams-suffix voor een filter-link (`?status=…&q=…`). Laat de default
 * (status `all`, lege zoekterm) weg zodat de canonieke URL schoon blijft.
 */
export function conversationFilterParams(filter: {
  status: ConversationFilterStatus;
  query: string;
}): string {
  const sp = new URLSearchParams();
  if (filter.status !== "all") sp.set("status", filter.status);
  if (filter.query) sp.set("q", filter.query);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
