// Vooringevulde waarden voor het samenwerkingsvoorstel (opdrachtgever → geaccepteerde kandidaat).
// Wanneer de opdrachtgever een samenwerking voorstelt, zijn het tariefvoorstel van de kandidaat en
// de startdatum van de opdracht al bekend. Dit vult die twee velden voor zodat de opdrachtgever ze
// niet hoeft over te typen op het hoogste-inzet-moment (geaccepteerd → getekende samenwerking).
//
// Puur en deterministisch: geen DB, geen tijd, muteert niets. De server (`collaborationProposalSchema`
// + `proposeCollaboration`) blijft de waarheid en valideert opnieuw — dit is louter een client-side
// vooringave die de opdrachtgever vrij kan aanpassen of leegmaken.

/** Ondergrens voor een geldig tariefvoorstel — spiegelt `collaborationProposalSchema.rate`. */
export const PROPOSAL_RATE_MIN = 1;
/** Bovengrens voor een geldig tariefvoorstel — spiegelt `collaborationProposalSchema.rate`. */
export const PROPOSAL_RATE_MAX = 2000;

export interface CollaborationProposalPrefill {
  /**
   * Vooringevuld uurtarief (hele euro) of `null`. Komt uit het tariefvoorstel van de kandidaat en
   * wordt alleen voorgevuld als het binnen de schema-grenzen [1, 2000] valt en een geheel getal is —
   * zo kan de vooringave het formulier nooit met een ongeldige (schema-afgekeurde) waarde vullen.
   */
  rate: number | null;
  /**
   * Vooringevulde startdatum als ISO (yyyy-mm-dd) of `null` (opdracht zonder startdatum). `DateInput`
   * accepteert ISO als `defaultValue` en toont het NL-weergaveformaat.
   */
  startIso: string | null;
}

/** Of `n` een geheel tariefvoorstel binnen de schema-grenzen is. */
function isValidRate(n: number | null | undefined): n is number {
  return (
    typeof n === "number" && Number.isInteger(n) && n >= PROPOSAL_RATE_MIN && n <= PROPOSAL_RATE_MAX
  );
}

/**
 * Bouwt de vooringave voor het samenwerkingsvoorstel uit de kandidaat-/opdrachtcontext.
 *
 * - `rate` → het tariefvoorstel van de kandidaat (`proposedRate`), maar alleen als het geldig is
 *   volgens de schema-grenzen; anders `null` (leeg veld). We raden bewust géén tarief uit het
 *   opdrachtbudget: een bindend voorstel vullen met een bedrag dat de kandidaat niet vroeg, hoort
 *   een expliciete keuze van de opdrachtgever te zijn.
 * - `startIso` → de startdatum van de opdracht (ISO), of `null` als de opdracht er geen heeft.
 */
export function buildCollaborationProposalPrefill(input: {
  proposedRate: number | null | undefined;
  jobStartDate: Date | null | undefined;
}): CollaborationProposalPrefill {
  const rate = isValidRate(input.proposedRate) ? input.proposedRate : null;
  const startIso =
    input.jobStartDate != null && !Number.isNaN(input.jobStartDate.getTime())
      ? input.jobStartDate.toISOString().slice(0, 10)
      : null;
  return { rate, startIso };
}
