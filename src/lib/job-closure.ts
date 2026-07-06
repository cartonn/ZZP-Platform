// Notificeer open reacties wanneer een opdrachtgever een gepubliceerde opdracht sluit. Sluit de lus
// voor de ZZP'er: zonder dit blijft een nog-openstaande reactie (NEW/VIEWED/SHORTLIST) stil hangen
// zodra de opdracht wordt gesloten — de ZZP'er weet niet dat de opdracht weg is en wacht voor niets.
// Marktplaatsen (Temper/Malt) informeren afgewezen/onbeantwoorde kandidaten actief; wij vertalen dat
// naar één rustige notificatie met een deeplink naar andere passende opdrachten.
//
// Pure planner — de server-action verzorgt DB-toegang en audit. Geen geldstroom, geen schemawijziging.

/**
 * Reactie-statussen die nog "open" zijn op het moment van sluiten: de ZZP'er wacht op een besluit.
 * ACCEPTED/REJECTED zijn al afgehandeld (en al genotificeerd); WITHDRAWN trok de ZZP'er zelf in.
 */
export const OPEN_APPLICATION_STATUSES = ["NEW", "VIEWED", "SHORTLIST"] as const;

const OPEN_STATUS_SET: ReadonlySet<string> = new Set(OPEN_APPLICATION_STATUSES);

/** Is deze reactie nog onbeslist (wacht op de opdrachtgever)? */
export function isOpenApplicationStatus(status: string): boolean {
  return OPEN_STATUS_SET.has(status);
}

export interface ClosureJob {
  id: string;
  title: string;
}

export interface ClosureApplicant {
  /** User-id van de ZZP'er (FreelancerProfile.userId) — ontvanger van de notificatie. */
  freelancerUserId: string;
  status: string;
}

export interface ClosureNotification {
  userId: string;
  notificationType: "JOB_CLOSED";
  title: string;
  body: string;
  link: string;
}

/**
 * Bepaalt welke ZZP'ers een "opdracht gesloten"-seintje verdienen: iedere reactie die nog open staat
 * (NEW/VIEWED/SHORTLIST). Dedupliceert op ontvanger (één notificatie per ZZP'er, ook al zou er door een
 * datafout meer dan één open reactie zijn). Sorteert deterministisch op userId zodat de output stabiel
 * is (belangrijk voor tests en herhaalbare runs). Geen open reacties → lege lijst.
 */
export function planClosureNotifications(
  job: ClosureJob,
  applicants: readonly ClosureApplicant[],
): ClosureNotification[] {
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const a of applicants) {
    if (!isOpenApplicationStatus(a.status)) continue;
    if (seen.has(a.freelancerUserId)) continue;
    seen.add(a.freelancerUserId);
    recipients.push(a.freelancerUserId);
  }
  recipients.sort();

  return recipients.map((userId) => ({
    userId,
    notificationType: "JOB_CLOSED",
    title: "Opdracht gesloten",
    body: `De opdracht "${job.title}" is gesloten en niet meer beschikbaar. Bekijk andere opdrachten die bij je passen.`,
    link: "/opdrachten",
  }));
}
