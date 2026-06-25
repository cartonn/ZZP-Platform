import { type ApplicationStatus } from "@/lib/enums";

/**
 * Reactie-pijplijn per opdracht voor de opdrachtgever: een puur, deterministisch overzicht van waar
 * de reacties op één opdracht staan (nieuw / in behandeling / op de shortlist / geaccepteerd /
 * afgewezen). Geen I/O, muteert de invoer niet — bedoeld om de "Mijn opdrachten"-kaarten te voeden
 * met het antwoord op "welke opdracht vraagt nu mijn aandacht?".
 *
 * Ingetrokken reacties (WITHDRAWN) tellen niet mee: ze vragen geen actie en mogen het totaal niet
 * opblazen. `needsAttention` is waar zodra er nog niet-bekeken (NEW) reacties klaarstaan.
 */
export interface JobPipeline {
  /** Actieve reacties (alle statussen behalve WITHDRAWN). */
  total: number;
  /** Nog niet bekeken — vraagt actie van de opdrachtgever. */
  newCount: number;
  /** Bekeken maar nog niet beoordeeld. */
  viewed: number;
  /** Op de shortlist gezet. */
  shortlist: number;
  accepted: number;
  rejected: number;
  /** Er staan nieuwe, nog niet bekeken reacties klaar. */
  needsAttention: boolean;
}

/**
 * Vat een lijst reactie-statussen van één opdracht samen. Werkt op de reeds-opgehaalde statussen
 * (of op een `groupBy`-resultaat dat per status is uitgeteld), zodat de pagina geen extra query per
 * opdracht nodig heeft.
 */
export function summarizeJobPipeline(statuses: readonly ApplicationStatus[]): JobPipeline {
  let newCount = 0;
  let viewed = 0;
  let shortlist = 0;
  let accepted = 0;
  let rejected = 0;

  for (const status of statuses) {
    switch (status) {
      case "NEW":
        newCount += 1;
        break;
      case "VIEWED":
        viewed += 1;
        break;
      case "SHORTLIST":
        shortlist += 1;
        break;
      case "ACCEPTED":
        accepted += 1;
        break;
      case "REJECTED":
        rejected += 1;
        break;
      case "WITHDRAWN":
        // Ingetrokken: telt niet mee.
        break;
    }
  }

  const total = newCount + viewed + shortlist + accepted + rejected;
  return {
    total,
    newCount,
    viewed,
    shortlist,
    accepted,
    rejected,
    needsAttention: newCount > 0,
  };
}
