// Aan-zet-signaal voor berichten: wiens beurt is het, en ligt het gesprek stil?
// Puur en testbaar zonder DB. Spiegelt de dashboard-/cascade-taal "wat moet ik nu
// doen" naar de berichtenlijst: een gesprek is óf "jouw beurt" (de tegenpartij wacht
// op een antwoord van de kijker), óf "wacht op antwoord" (de kijker stuurde het
// laatste bericht en wacht), óf neutraal (laatste bericht is van de tegenpartij maar
// al gelezen → bijgepraat). Leunt op het al opgehaalde laatste bericht + de bestaande
// ongelezen-telling; geen schemawijziging, geen extra query.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vanaf hoeveel hele dagen zonder antwoord een wachtend gesprek "stil" heet. */
export const CONVERSATION_STALE_DAYS = 3;

export type ConversationTurn = "yours" | "theirs" | "none";

export interface ConversationLastMessage {
  senderId: string;
  createdAt: Date;
}

export interface ConversationTurnInput {
  /** Het laatste bericht in het gesprek, of null bij een leeg gesprek. */
  lastMessage: ConversationLastMessage | null;
  /** Aantal ongelezen berichten van de tegenpartij voor de kijker. */
  unreadFromOther: number;
  /** Id van de kijker (de ingelogde gebruiker). */
  viewerId: string;
}

/**
 * Bepaalt wiens beurt het is.
 * - `yours`  — de tegenpartij stuurde berichten die de kijker nog niet las → de kijker is aan zet.
 * - `theirs` — de kijker stuurde het laatste bericht (alles gelezen) → de kijker wacht op antwoord.
 * - `none`   — leeg gesprek, of het laatste bericht is van de tegenpartij maar al gelezen.
 *
 * `unreadFromOther` is leidend voor "jouw beurt": ook als de kijker daarna technisch
 * niets terugstuurde blijft het zijn beurt zolang er ongelezen berichten staan.
 */
export function conversationTurn(input: ConversationTurnInput): ConversationTurn {
  const { lastMessage, unreadFromOther, viewerId } = input;
  if (!lastMessage) return "none";
  if (unreadFromOther > 0) return "yours";
  if (lastMessage.senderId === viewerId) return "theirs";
  return "none";
}

/** Aantal hele dagen sinds een datum (>= 0). */
export function daysSince(date: Date, now: Date | number = new Date()): number {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return Math.max(0, Math.floor((nowMs - date.getTime()) / DAY_MS));
}

/**
 * Een gesprek ligt "stil" wanneer de kijker wacht op antwoord (`theirs`) en het laatste
 * bericht al >= `staleDays` dagen oud is. Alleen relevant voor de wachtende kant — voor
 * "jouw beurt" is stilte geen signaal (dan moet de kijker zelf reageren).
 */
export function isStaleAwaitingReply(
  turn: ConversationTurn,
  lastMessage: ConversationLastMessage | null,
  now: Date | number = new Date(),
  staleDays: number = CONVERSATION_STALE_DAYS,
): boolean {
  if (turn !== "theirs" || !lastMessage) return false;
  return daysSince(lastMessage.createdAt, now) >= staleDays;
}

/** NL-label voor het aantal dagen zonder reactie. */
export function staleLabel(days: number): string {
  return `${days} dag${days === 1 ? "" : "en"} geen reactie`;
}

export interface ConversationTurnSummary {
  /** Gesprekken waar de kijker aan zet is (tegenpartij wacht). */
  awaitingYou: number;
  /** Gesprekken waar de kijker op antwoord wacht. */
  awaitingThem: number;
  /** Daarvan: hoeveel al >= staleDays dagen stilliggen. */
  stale: number;
}

/**
 * Telt de beurten over de hele lijst op voor een compacte kopstrip.
 * Muteert de invoer niet.
 */
export function summarizeConversationTurns(
  items: readonly { turn: ConversationTurn; stale: boolean }[],
): ConversationTurnSummary {
  let awaitingYou = 0;
  let awaitingThem = 0;
  let stale = 0;
  for (const item of items) {
    if (item.turn === "yours") awaitingYou += 1;
    else if (item.turn === "theirs") {
      awaitingThem += 1;
      if (item.stale) stale += 1;
    }
  }
  return { awaitingYou, awaitingThem, stale };
}
