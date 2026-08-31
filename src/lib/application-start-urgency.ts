// Tijd-signaal voor een nog-openstaande reactie: de opdracht waarop de ZZP'er reageerde begint
// binnenkort (of had al moeten beginnen) terwijl de opdrachtgever nog geen beslissing nam. Dat is
// een eigen "aan zet"-signaal — los van het wacht-signaal (gebaseerd op de reactiedatum) en het
// dood-signaal (opdracht gesloten/vervuld): de beslis-window sluit, dus doorwachten of verder kijken
// wordt urgenter. Puur en testbaar; hergebruikt de bestaande proximity-primitieven zodat "over N
// dagen" identiek is aan de marktplaats/het opdracht-detail (geen drift).

import { type ApplicationStatus } from "@/lib/enums";
import { jobStartProximity } from "@/lib/job-start-proximity";
import { jobStartedSignal } from "@/lib/job-started-signal";

export interface ApplicationStartUrgency {
  /** "urgent" bij een aanstaande urgente/verstreken start (klemtoon), "soon" bij een start binnen
   *  de soon-horizon maar niet dringend (gedempt). */
  tone: "urgent" | "soon";
  /** Korte NL-zin voor onder de reactiekaart, bv. "Begint over 2 dagen — nog geen beslissing". */
  label: string;
}

// Alleen een nog-openstaande reactie (nog geen beslissing, geen eigen samenwerking) heeft baat bij
// dit signaal — een afgewezen/ingetrokken/geaccepteerde reactie is al beslist.
const OPEN_STATUSES: readonly ApplicationStatus[] = ["NEW", "VIEWED", "SHORTLIST"];

export interface ApplicationStartUrgencyInput {
  applicationStatus: ApplicationStatus;
  /** Heeft deze reactie al een eigen samenwerking opgeleverd? Dan is er niets meer af te wachten. */
  hasCollaboration: boolean;
  /** De opdracht is effectief dood (gesloten of vermoedelijk vervuld) — dan geen start-urgentie meer;
   *  het dood-signaal spreekt dan al. Spiegelt `applicationJobAvailability(...) != null`. */
  jobDead: boolean;
  startDate: Date | null | undefined;
  now: Date;
}

/**
 * Leidt af of een nog-openstaande reactie een start-urgentie verdient. Geeft `null` wanneer er niets
 * te melden valt: de reactie is niet (meer) openstaand, heeft al een eigen samenwerking, de opdracht
 * is dood, er is geen startdatum, of de start ligt buiten de zichtbare horizon (verder dan 14 dagen
 * weg of meer dan 30 dagen geleden). Een aanstaande start volgt `jobStartProximity`; een reeds
 * verstreken start `jobStartedSignal` — beide in de context "nog geen beslissing".
 */
export function applicationStartUrgency(
  input: ApplicationStartUrgencyInput,
): ApplicationStartUrgency | null {
  if (input.hasCollaboration) return null;
  if (!OPEN_STATUSES.includes(input.applicationStatus)) return null;
  if (input.jobDead) return null;

  const proximity = jobStartProximity(input.startDate, input.now);
  if (proximity) {
    // "begint over N dagen" → "Begint over N dagen"; behoudt de exacte proximity-tekst (geen drift).
    const opener = proximity.label.replace(/^begint/, "Begint");
    return { tone: proximity.urgency, label: `${opener} — nog geen beslissing` };
  }

  const started = jobStartedSignal(input.startDate, input.now);
  if (started) {
    return { tone: "urgent", label: "Startdatum verstreken — nog geen beslissing" };
  }

  return null;
}
