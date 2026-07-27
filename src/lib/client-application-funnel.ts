// Kandidaat-/reactie-trechter voor de opdrachtgever (BI op /inzicht). Pure afgeleide van een
// status→aantal-telling (ApplicationStatus), zoals `getClientStats` die al aggregeert over de
// opdrachten van de eigen company. Read-only inzicht; spiegelt de ZZP'er-reactiedonut.

import { ratePercent } from "@/lib/freelancer-stats";

/**
 * Onder deze drempel aan besliste reacties (geaccepteerd + afgewezen) tonen we geen aannamekans:
 * één beslissing zou een misleidend 0%/100% opleveren.
 */
export const CLIENT_FUNNEL_MIN_DECIDED = 3;

/**
 * Vanaf zoveel hele dagen onbekeken telt de langst-wachtende reactie als ghosting-risico: de kandidaat
 * dreigt af te haken (of elders te tekenen) en de ZZP'er blijft zonder antwoord. Boven deze grens
 * escaleert de trechterregel van "let op" naar "urgent". 5 werkdagen is de gangbare responsverwachting
 * op de markt (Temper/Malt tonen kandidaten hoe snel een opdrachtgever reageert).
 */
export const CANDIDATE_GHOSTING_RISK_DAYS = 5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Leeftijd in hele (naar beneden afgeronde) dagen tussen `since` en `now`, nooit negatief. `null` als
 * er geen tijdstip is. Deterministisch: `now` wordt expliciet meegegeven (server-side waarheid).
 */
export function ageInDays(since: Date | null | undefined, now: Date): number | null {
  if (!since) return null;
  return Math.max(0, Math.floor((now.getTime() - since.getTime()) / MS_PER_DAY));
}

export interface ClientApplicationFunnel {
  /** Alle reacties op de opdrachten van de opdrachtgever. */
  total: number;
  /** NEW — wachten op een eerste blik van de opdrachtgever (actiepunt). */
  awaitingFirstLook: number;
  /**
   * Leeftijd in hele dagen van de langst wachtende NEW-reactie; `null` als er geen NEW-reactie is
   * (of geen tijdstip bekend). Maakt "wachten op een eerste blik" duidbaar: niet alleen hoeveel,
   * maar hoe lang al.
   */
  awaitingFirstLookOldestDays: number | null;
  /**
   * `true` zodra de langst wachtende NEW-reactie de ghosting-risicodrempel bereikt
   * (`CANDIDATE_GHOSTING_RISK_DAYS`) — signaal om die kandidaat met voorrang te beoordelen.
   */
  awaitingFirstLookAtRisk: boolean;
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
  options: { oldestNewAt?: Date | null; now?: Date } = {},
): ClientApplicationFunnel {
  const accepted = count(byStatus, "ACCEPTED");
  const rejected = count(byStatus, "REJECTED");
  const decided = accepted + rejected;
  const total = Object.values(byStatus).reduce((sum, v) => sum + Math.max(0, Math.floor(v)), 0);
  const awaitingFirstLook = count(byStatus, "NEW");

  // De leeftijd geldt alleen als er ook echt een wachtende NEW-reactie is; zonder wachtende reactie
  // is een (verdwaalde) tijdstempel betekenisloos → geen leeftijd, geen risicovlag.
  const oldestDays =
    awaitingFirstLook > 0 ? ageInDays(options.oldestNewAt, options.now ?? new Date()) : null;

  return {
    total,
    awaitingFirstLook,
    awaitingFirstLookOldestDays: oldestDays,
    awaitingFirstLookAtRisk: oldestDays != null && oldestDays >= CANDIDATE_GHOSTING_RISK_DAYS,
    shortlisted: count(byStatus, "SHORTLIST"),
    accepted,
    acceptanceRate: decided >= CLIENT_FUNNEL_MIN_DECIDED ? ratePercent(accepted, decided) : null,
  };
}
