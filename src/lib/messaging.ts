// Messaging-helpers: deelnemerscheck en ongelezen-telling. Server-side is de waarheid:
// conversatietoegang wordt op deelnemerschap afgedwongen, niet client-side. Pure functies.

export function isParticipant(participantUserIds: readonly string[], userId: string): boolean {
  return participantUserIds.includes(userId);
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
