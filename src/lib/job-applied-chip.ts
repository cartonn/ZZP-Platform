// Lijst-chip voor de opdrachtenlijst van de ZZP'er: heeft hij al op deze opdracht gereageerd, en
// waar staat die reactie? Zo ziet hij in één oogopslag welke open opdrachten hij al heeft opgepakt
// (en de stand van zaken) zonder elke opdracht te openen — spiegelt de "Applied"-status die
// Temper/Malt/LinkedIn op hun listings tonen. Puur en deterministisch; lekt niets van andere
// kandidaten (uitsluitend de eigen reactiestatus).

import type { ApplicationStatus } from "./enums";

export type AppliedChipTone = "info" | "positive" | "success" | "muted";

export interface AppliedJobChip {
  label: string;
  tone: AppliedChipTone;
}

// Rangorde van "meest relevante" reactiestatus wanneer een ZZP'er meerdere reacties op één opdracht
// heeft staan: de verst gevorderde/positieve status wint, zodat de chip nooit "Afgewezen" toont
// terwijl er óók nog een levende reactie loopt. WITHDRAWN telt nooit mee (ingetrokken = geen reactie).
const RELEVANCE_ORDER: readonly ApplicationStatus[] = [
  "ACCEPTED",
  "SHORTLIST",
  "VIEWED",
  "NEW",
  "REJECTED",
];

/**
 * Kies de beslis-relevante reactiestatus uit alle (niet-ingetrokken) reacties van de ZZP'er op één
 * opdracht. Geeft `null` als er geen enkele meetellende reactie is (leeg of alleen WITHDRAWN).
 */
export function pickApplicationStatus(
  statuses: readonly ApplicationStatus[],
): ApplicationStatus | null {
  for (const status of RELEVANCE_ORDER) {
    if (statuses.includes(status)) return status;
  }
  return null;
}

/**
 * Compacte lijst-chip voor één reactiestatus. Toont "Gereageerd" (evt. verrijkt met de voortgang) zodat
 * de ZZP'er op de lijst weet dat hij al in de race zit en waar die staat. WITHDRAWN → `null` (geen chip).
 */
export function appliedJobChip(status: ApplicationStatus): AppliedJobChip | null {
  switch (status) {
    case "NEW":
      return { label: "Gereageerd", tone: "info" };
    case "VIEWED":
      return { label: "Gereageerd · bekeken", tone: "info" };
    case "SHORTLIST":
      return { label: "Op shortlist", tone: "positive" };
    case "ACCEPTED":
      return { label: "Geaccepteerd", tone: "success" };
    case "REJECTED":
      return { label: "Afgewezen", tone: "muted" };
    case "WITHDRAWN":
      return null;
    default:
      return null;
  }
}

/**
 * Combineert `pickApplicationStatus` + `appliedJobChip`: van alle reacties op één opdracht naar de
 * enkele chip die de ZZP'er op de lijst ziet. `null` wanneer er geen meetellende reactie is.
 */
export function appliedJobChipFor(statuses: readonly ApplicationStatus[]): AppliedJobChip | null {
  const status = pickApplicationStatus(statuses);
  return status ? appliedJobChip(status) : null;
}
