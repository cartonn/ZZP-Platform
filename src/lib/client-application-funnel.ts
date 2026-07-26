// Kandidaat-/reactie-trechter voor de opdrachtgever (BI op /inzicht). Pure afgeleide van een
// status→aantal-telling (ApplicationStatus), zoals `getClientStats` die al aggregeert over de
// opdrachten van de eigen company. Read-only inzicht; spiegelt de ZZP'er-reactiedonut.

import { ratePercent } from "@/lib/freelancer-stats";

/**
 * Onder deze drempel aan besliste reacties (geaccepteerd + afgewezen) tonen we geen aannamekans:
 * één beslissing zou een misleidend 0%/100% opleveren.
 */
export const CLIENT_FUNNEL_MIN_DECIDED = 3;

export interface ClientApplicationFunnel {
  /** Alle reacties op de opdrachten van de opdrachtgever. */
  total: number;
  /** NEW — wachten op een eerste blik van de opdrachtgever (actiepunt). */
  awaitingFirstLook: number;
  /** SHORTLIST — kandidaten die op de shortlist staan. */
  shortlisted: number;
  /** ACCEPTED — geaccepteerde reacties. */
  accepted: number;
  /**
   * % geaccepteerd van de besliste reacties (ACCEPTED + REJECTED). `null` onder de steekproefdrempel
   * of zonder besliste reacties — geen schijnprecisie uit één beslissing.
   */
  acceptanceRate: number | null;
}

/** Niet-negatief geheel getal uit een (mogelijk ontbrekende) telling. */
function count(byStatus: Record<string, number>, status: string): number {
  return Math.max(0, Math.floor(byStatus[status] ?? 0));
}

/**
 * Vat een ApplicationStatus→aantal-telling samen tot de opdrachtgever-trechter. WITHDRAWN (de ZZP'er
 * trok zich terug) telt mee in het totaal maar niet in de aannamekans — dat is geen beslissing van de
 * opdrachtgever. NEW valt buiten de "besliste" noemer (nog geen oordeel geveld).
 */
export function summarizeClientApplications(
  byStatus: Record<string, number>,
): ClientApplicationFunnel {
  const accepted = count(byStatus, "ACCEPTED");
  const rejected = count(byStatus, "REJECTED");
  const decided = accepted + rejected;
  const total = Object.values(byStatus).reduce((sum, v) => sum + Math.max(0, Math.floor(v)), 0);

  return {
    total,
    awaitingFirstLook: count(byStatus, "NEW"),
    shortlisted: count(byStatus, "SHORTLIST"),
    accepted,
    acceptanceRate: decided >= CLIENT_FUNNEL_MIN_DECIDED ? ratePercent(accepted, decided) : null,
  };
}
