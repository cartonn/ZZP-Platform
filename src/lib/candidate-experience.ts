// Platform-brede ervaringssignaal voor de opdrachtgever op /kandidaten. De kaart toont al de
// gedeelde historie mét déze opdrachtgever (`candidate-history.ts`, "3× samengewerkt") — een sterk
// rehire-signaal. Maar voor een kandidaat die nieuw is voor déze opdrachtgever is dat signaal leeg,
// terwijl die ZZP'er elders best veel klussen afgerond kan hebben. De platform-brede staat van dienst
// toonde al op /freelancers (browse) + het publieke vertrouwensdossier, maar niet op de plek waar de
// opdrachtgever over reagerende kandidaten beslist. Dit vult dat gat met een compacte, calm chip.
//
// Benchmark: Temper/Malt tonen "X opdrachten voltooid" bij een onbekende kandidaat om het risico van
// het inhuren van een vreemde te verlagen. Wij vertalen dat naar onze server-berekende staat van dienst.
//
// Puur en deterministisch; de fetcher zit apart (`data/candidate-track-records.ts`).

import { plural } from "@/lib/plural";

/** Drempel: minimaal één afgeronde klus is een concreet feit waard om te tonen (spiegelt
 *  `trackRecordHighlights`, dat óók pas vanaf 1 afgeronde samenwerking pronkt). */
export const CANDIDATE_EXPERIENCE_MIN_COMPLETED = 1;

export interface CandidateExperienceSignal {
  /** Aantal platform-brede afgeronde samenwerkingen (≥ drempel). */
  completed: number;
  /** NL-label, meervoud al toegepast ("1 afgeronde klus" / "12 afgeronde klussen"). */
  label: string;
}

/**
 * Bepaalt of — en met welk label — het platform-brede ervaringssignaal getoond wordt.
 *
 * Gate:
 *   - `hasSharedHistory` → **niet** tonen. De gedeelde-historie-chip is het sterkere, this-client
 *     signaal en omvat deze klussen al; twee overlappende chips stapelen zou de kaart vervuilen.
 *   - `completed < CANDIDATE_EXPERIENCE_MIN_COMPLETED` → niet tonen (geen magere "0"-pronkerij; het
 *     vertrouwensniveau + geverifieerde certificaten dragen dan het signaal).
 *
 * Negatieve/niet-eindige tellingen vallen veilig terug op geen signaal (defensief).
 */
export function candidateExperienceSignal(
  completedCollaborations: number,
  hasSharedHistory: boolean,
): CandidateExperienceSignal | null {
  if (hasSharedHistory) return null;
  if (!Number.isFinite(completedCollaborations)) return null;
  const completed = Math.floor(completedCollaborations);
  if (completed < CANDIDATE_EXPERIENCE_MIN_COMPLETED) return null;
  return {
    completed,
    label: plural(completed, "afgeronde klus", "afgeronde klussen"),
  };
}
