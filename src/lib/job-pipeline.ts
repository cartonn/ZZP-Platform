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
  const counts: Partial<Record<ApplicationStatus, number>> = {};
  for (const status of statuses) {
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return summarizeJobPipelineFromCounts(counts);
}

/**
 * Zelfde pijplijn-samenvatting, maar gevoed door reeds-uitgetelde statustellingen (bv. een Prisma
 * `groupBy({ by: ["status"], _count })`). Zo hoeft de opdracht-detailpagina niet elke losse reactie
 * op te halen om de funnel te tonen — één aggregate-query volstaat. Ontbrekende statussen tellen als 0;
 * ingetrokken reacties (WITHDRAWN) blijven buiten het totaal.
 */
export function summarizeJobPipelineFromCounts(
  counts: Partial<Record<ApplicationStatus, number>>,
): JobPipeline {
  const newCount = counts.NEW ?? 0;
  const viewed = counts.VIEWED ?? 0;
  const shortlist = counts.SHORTLIST ?? 0;
  const accepted = counts.ACCEPTED ?? 0;
  const rejected = counts.REJECTED ?? 0;

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
