// Beslissingslaag voor herplaatsing bij uitval van een actieve samenwerking.
// Bepaalt of de onderliggende dienst (Job) heropend moet worden en of een
// herplaatsings-signaal voor de opdrachtgever moet worden aangemaakt.
// Puur deterministisch — geen I/O, geen neveneffecten.

import type { CollaborationStatus, JobStatus } from "@/lib/enums";

export interface ReplacementInput {
  /** Huidige status van de samenwerking vóór de overgang. */
  from: CollaborationStatus;
  /** Doelstatus van de samenwerking. */
  to: CollaborationStatus;
  /** Huidige status van de onderliggende dienst (Job). */
  jobStatus: JobStatus;
}

export interface ReplacementPlan {
  /** De dienst heropenen zodat hij weer vindbaar is en herplaatsings-suggesties oplevert. */
  reopenJob: boolean;
  /** Doelstatus voor de dienst wanneer reopenJob true is; anders null. */
  targetJobStatus: JobStatus | null;
  /** Een herplaatsings-signaal (notificatie + UI-kaart) openen voor de opdrachtgever. */
  signal: boolean;
}

const NO_ACTION: ReplacementPlan = {
  reopenJob: false,
  targetJobStatus: null,
  signal: false,
};

/**
 * Bepaalt het herplaatsingsplan op basis van de samenwerkingsovergang en de
 * huidige dienststatus. Alleen een ACTIVE→CANCELLED-overgang triggert actie;
 * alle andere overgangen leveren een leeg plan op.
 */
export function planReplacement(input: ReplacementInput): ReplacementPlan {
  // Alleen handelen bij uitval: actieve samenwerking die geannuleerd wordt.
  if (input.from !== "ACTIVE" || input.to !== "CANCELLED") {
    return NO_ACTION;
  }

  switch (input.jobStatus) {
    case "CLOSED":
      // Dienst was gesloten na eerdere match; heropenen zodat herplaatsing mogelijk is.
      return { reopenJob: true, targetJobStatus: "PUBLISHED", signal: true };

    case "PUBLISHED":
      // Dienst staat al open; geen heropen nodig, wel signaleren.
      return { reopenJob: false, targetJobStatus: null, signal: true };

    case "DRAFT":
      // Opdrachtgever heeft de dienst bewust gedepubliceerd; niet ongevraagd
      // herpubliceren of nudgen — respecteer die keuze.
      return NO_ACTION;
  }
}
