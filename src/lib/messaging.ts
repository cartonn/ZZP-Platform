// Messaging-helpers: deelnemerscheck en ongelezen-telling. Server-side is de waarheid:
// conversatietoegang wordt op deelnemerschap afgedwongen, niet client-side. Pure functies.

export function isParticipant(participantUserIds: readonly string[], userId: string): boolean {
  return participantUserIds.includes(userId);
}

/**
 * Maximale lengte (tekens) van de vrije berichttekst die verbatim in de body van de
 * MESSAGE-notificatie op de feed van de ontvanger wordt gekopieerd. Eén bron van waarheid: de
 * verzendactie (`sendMessage`) én de AVG-erasure (`anonymizeUser`, die deze exacte kopie moet
 * terugvinden en redacten wanneer de afzender wordt verwijderd) delen hem, zodat er geen
 * magic-number-drift ontstaat waardoor de erasure de notificatiekopie zou missen.
 */
export const MESSAGE_NOTIFICATION_BODY_MAX = 120;

/**
 * De body-snippet van de MESSAGE-notificatie: de eerste `MESSAGE_NOTIFICATION_BODY_MAX` tekens van
 * het bericht. Puur en deterministisch, zodat de erasure de kopie op andermans feed exact kan
 * reconstrueren (type + gespreks-deep-link + deze body) en redacten (AVG art. 17).
 */
export function messageNotificationBody(body: string): string {
  return body.slice(0, MESSAGE_NOTIFICATION_BODY_MAX);
}

export interface MessageLike {
  senderId: string;
  createdAt: Date;
}

/** Aantal berichten van de andere partij ná `lastReadAt` (ongelezen voor de kijker). */
export function unreadCount(
  messages: readonly MessageLike[],
  lastReadAt: Date | null | undefined,
  viewerId: string,
): number {
  return messages.filter(
    (m) => m.senderId !== viewerId && (!lastReadAt || m.createdAt.getTime() > lastReadAt.getTime()),
  ).length;
}

/**
 * Id van het laatste eigen (uitgaande) bericht dat de andere partij aantoonbaar heeft gelezen,
 * afgeleid uit haar `lastReadAt` (server-onderhouden bij het openen van het gesprek). Rendert de
 * "Gezien"-markering exact onder dat bericht. `null` wanneer de ander nog niets heeft gelezen of er
 * geen uitgaand bericht binnen het gelezen venster valt. Volgordonafhankelijk (neemt het nieuwste
 * gelezen uitgaande bericht), zodat een nog niet gelezen nieuwer bericht de markering niet verspringt.
 */
export function lastReadOutgoingMessageId(
  messages: readonly (MessageLike & { id: string })[],
  otherLastReadAt: Date | null | undefined,
  viewerId: string,
): string | null {
  if (!otherLastReadAt) return null;
  const readMs = otherLastReadAt.getTime();
  let bestId: string | null = null;
  let bestMs = -Infinity;
  for (const m of messages) {
    const ms = m.createdAt.getTime();
    if (m.senderId === viewerId && ms <= readMs && ms > bestMs) {
      bestMs = ms;
      bestId = m.id;
    }
  }
  return bestId;
}
