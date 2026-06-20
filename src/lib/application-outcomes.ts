import { type ApplicationStatus } from "@/lib/enums";

/**
 * Reactie-uitkomsten: een puur, deterministisch overzicht van hoe de reacties van een ZZP'er het
 * doen (bekeken / op de shortlist / geaccepteerd) en zijn slaagkans. Geen I/O, muteert de invoer
 * niet — afgeleid uit de al opgehaalde reacties, zodat `/reacties` geen extra query nodig heeft.
 *
 * Percentages worden pas getoond bij een betekenisvolle steekproef; onder de drempel is de uitkomst
 * `null` zodat de UI nooit met een misleidende "100%" uit één reactie pronkt.
 */
export const APPLICATION_OUTCOME_MIN_SAMPLE = 4;

export interface ApplicationOutcomeInput {
  status: ApplicationStatus;
  /** Of er een samenwerking uit de reactie is voortgekomen (de uiteindelijke succesuitkomst). */
  hasCollaboration: boolean;
}

export interface ApplicationOutcomes {
  total: number;
  /** Nog in behandeling: NEW + VIEWED + SHORTLIST. */
  open: number;
  /** Staat (nu) op de shortlist. */
  shortlisted: number;
  accepted: number;
  rejected: number;
  /** Door de opdrachtgever minstens bekeken (status ≠ NEW). */
  seen: number;
  /** Reacties die tot een samenwerking leidden. */
  collaborations: number;
  /** % van álle reacties dat de opdrachtgever minstens bekeek; `null` onder de steekproefdrempel. */
  responseRate: number | null;
  /** % geaccepteerd van de beoordeelde reacties (geaccepteerd + afgewezen); `null` onder de drempel. */
  acceptanceRate: number | null;
}

function pct(part: number, whole: number): number {
  return Math.round((part / whole) * 100);
}

export function summarizeApplicationOutcomes(
  applications: readonly ApplicationOutcomeInput[],
  minSample: number = APPLICATION_OUTCOME_MIN_SAMPLE,
): ApplicationOutcomes {
  let open = 0;
  let shortlisted = 0;
  let accepted = 0;
  let rejected = 0;
  let seen = 0;
  let collaborations = 0;

  // Door de ZZP'er ingetrokken reacties zeggen niets over zijn aantrekkelijkheid op de markt: ze
  // worden volledig buiten de samenvatting (en de percentage-noemers) gehouden, zodat een eigen
  // intrekking het responspercentage of de acceptatiegraad niet vertekent.
  const active = applications.filter((app) => app.status !== "WITHDRAWN");

  for (const app of active) {
    if (app.status !== "NEW") seen += 1;
    if (app.hasCollaboration) collaborations += 1;
    switch (app.status) {
      case "NEW":
      case "VIEWED":
        open += 1;
        break;
      case "SHORTLIST":
        open += 1;
        shortlisted += 1;
        break;
      case "ACCEPTED":
        accepted += 1;
        break;
      case "REJECTED":
        rejected += 1;
        break;
    }
  }

  const total = active.length;
  const decided = accepted + rejected;

  return {
    total,
    open,
    shortlisted,
    accepted,
    rejected,
    seen,
    collaborations,
    responseRate: total >= minSample ? pct(seen, total) : null,
    acceptanceRate: decided >= minSample ? pct(accepted, decided) : null,
  };
}
