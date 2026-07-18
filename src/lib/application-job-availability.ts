// Beschikbaarheid van de onderliggende opdracht bezien vanuit een openstaande reactie.
// Pure logica: bepaalt of een reactie effectief "dood" is doordat de opdracht is gesloten
// of vermoedelijk al vervuld — zodat /reacties de ZZP'er niet laat wachten op iets dat niet
// meer kan komen. Server-side is de waarheid; de UI toont alleen wat hier wordt afgeleid.

import { type ApplicationStatus, type JobStatus } from "@/lib/enums";

/**
 * - `CLOSED`        — de opdracht is gesloten; de reactie kan niet meer tot een plaatsing leiden.
 * - `LIKELY_FILLED` — de opdracht staat nog open maar heeft al een actieve samenwerking (met een
 *                     ander), dus is vermoedelijk vervuld.
 */
export type JobAvailabilitySignal = "CLOSED" | "LIKELY_FILLED";

export interface ApplicationJobAvailabilityInput {
  applicationStatus: ApplicationStatus;
  /** Heeft deze reactie al een eigen samenwerking opgeleverd? Dan is dit signaal niet relevant. */
  hasCollaboration: boolean;
  jobStatus: JobStatus;
  /** Aantal ACTIEVE samenwerkingen op deze opdracht (met wie dan ook). */
  activeCollaborations: number;
}

// Alleen een nog-openstaande reactie (nog geen beslissing, geen eigen samenwerking) kan
// "dood" raken door de opdracht-status. Afgewezen/ingetrokken/geaccepteerd worden al door de
// bestaande status-hint gedekt.
const OPEN_STATUSES: readonly ApplicationStatus[] = ["NEW", "VIEWED", "SHORTLIST"];

/**
 * Leidt af of een openstaande reactie effectief niet meer tot een plaatsing kan leiden.
 * Geeft `null` wanneer er niets te melden valt: de reactie is niet (meer) openstaand, heeft al
 * een eigen samenwerking, of de opdracht is nog gewoon open en onvervuld.
 */
export function applicationJobAvailability(
  input: ApplicationJobAvailabilityInput,
): JobAvailabilitySignal | null {
  if (input.hasCollaboration) return null;
  if (!OPEN_STATUSES.includes(input.applicationStatus)) return null;
  if (input.jobStatus === "CLOSED") return "CLOSED";
  if (input.jobStatus === "PUBLISHED" && input.activeCollaborations > 0) return "LIKELY_FILLED";
  return null;
}

/** Korte, feitelijke boodschap per signaal — vervangt de hoopvolle status-hint. */
export const JOB_AVAILABILITY_MESSAGE: Record<JobAvailabilitySignal, string> = {
  CLOSED: "Deze opdracht is gesloten — je reactie leidt niet meer tot een plaatsing.",
  LIKELY_FILLED: "Deze opdracht is vermoedelijk al vervuld.",
};
