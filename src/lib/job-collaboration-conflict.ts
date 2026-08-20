import { type CollaborationStatus } from "@/lib/enums";

/**
 * Dubbelboek-signaal op de opdracht-detail: valt de startdatum van een opdracht binnen de looptijd
 * van een al **lopende samenwerking** van de ZZP'er? Zo ja, dan waarschuwen we vóór het reageren —
 * de ZZP'er voorkomt dat hij zich vastlegt op een klus die botst met een engagement waar hij al aan
 * verbonden is. Vult het gat dat het zelf-gezette agenda-signaal (`assessJobStartAvailability`) laat:
 * een ZZP'er hoeft zich niet expliciet op onbeschikbaar te zetten om al dubbel geboekt te raken.
 *
 * Server-side waarheid: de samenwerkingen komen uit `Collaboration` (eigen profiel); deze helper is
 * puur en beslist niets over toegang — het is een advies-signaal (de ZZP'er kan gewoon reageren).
 */

// Verre toekomst als schildwacht voor een open-einde samenwerking (endDate === null), gelijk aan de
// conventie in `availability-conflicts.ts`. Een lopende samenwerking zonder einddatum loopt door.
const FAR_FUTURE = new Date(8640000000000000);

export interface ConflictingCollaborationInput {
  readonly id: string;
  readonly status: CollaborationStatus;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly jobTitle: string;
  readonly clientName: string;
}

export interface JobCollaborationConflict {
  readonly collaborationId: string;
  readonly jobTitle: string;
  readonly clientName: string;
  readonly startDate: Date;
  /** null wanneer de samenwerking open-einde is (geen vastgelegde einddatum). */
  readonly endDate: Date | null;
}

/**
 * Bepaalt of `jobStartDate` binnen de looptijd van een lopende samenwerking valt. Alleen ACTIVE
 * samenwerkingen tellen: PROPOSED is nog geen verbintenis, COMPLETED/CANCELLED zijn voorbij. Een
 * samenwerking zonder `startDate` kan niet in de tijd worden geplaatst en telt niet mee; een open
 * einde (`endDate === null`) loopt door tot `FAR_FUTURE`. Het bereik is inclusief:
 * [startDate, endDate] bevat de startdatum.
 *
 * Geeft `null` als er niets te melden valt (geen startdatum op de opdracht, geen lopende
 * samenwerking, of geen overlap). Bij meerdere overlappende samenwerkingen wint de vroegste start
 * (dan het laagste id) voor determinisme.
 */
export function assessJobCollaborationConflict(
  jobStartDate: Date | null | undefined,
  collaborations: readonly ConflictingCollaborationInput[],
): JobCollaborationConflict | null {
  if (!jobStartDate) return null;
  const start = jobStartDate.getTime();

  const matches = collaborations.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    if (!c.startDate) return false;
    const from = c.startDate.getTime();
    const to = (c.endDate ?? FAR_FUTURE).getTime();
    return from <= start && start <= to;
  });

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    // startDate is hierboven non-null gefilterd.
    const byStart = a.startDate!.getTime() - b.startDate!.getTime();
    if (byStart !== 0) return byStart;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const best = matches[0]!;
  return {
    collaborationId: best.id,
    jobTitle: best.jobTitle,
    clientName: best.clientName,
    startDate: best.startDate!,
    endDate: best.endDate,
  };
}
