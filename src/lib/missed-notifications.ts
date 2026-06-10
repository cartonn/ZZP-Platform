// "Terwijl je weg was" (concurrentie-backlog punt 7, deel 2): het venster tussen de vorige en de
// huidige login. Ongelezen notificaties die in dat venster binnenkwamen, zijn aantoonbaar gemist —
// het notificatiecentrum vat ze samen in één rustige regel. Pure functie, server-side waarheid.

export interface MissedNotificationInput {
  createdAt: Date;
  readAt: Date | null;
}

export interface MissedSummary {
  /** Begin van het venster: de vorige login. */
  from: Date;
  /** Aantal ongelezen notificaties dat tijdens de afwezigheid binnenkwam. */
  count: number;
}

/**
 * Samenvatting van gemiste meldingen, of null wanneer er niets te tonen is (geen vorige login
 * bekend, of geen ongelezen meldingen in het venster). Het venster loopt van previousLoginAt
 * (exclusief) t/m lastLoginAt (inclusief); wat ná de huidige login binnenkomt is niet "gemist".
 */
export function missedWhileAway(opts: {
  previousLoginAt: Date | null;
  lastLoginAt: Date | null;
  notifications: readonly MissedNotificationInput[];
}): MissedSummary | null {
  const { previousLoginAt, lastLoginAt } = opts;
  if (!previousLoginAt) return null;

  const windowEnd = lastLoginAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const count = opts.notifications.filter(
    (n) =>
      n.readAt === null &&
      n.createdAt.getTime() > previousLoginAt.getTime() &&
      n.createdAt.getTime() <= windowEnd,
  ).length;

  return count > 0 ? { from: previousLoginAt, count } : null;
}
