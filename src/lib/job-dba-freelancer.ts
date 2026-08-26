// Wet-DBA + rechtsvermoeden-signaal, ZZP'er-gericht (spiegelbeeld van het owner-only blok).
// De opdracht-detailpagina toont de opdrachtgever een DBA-risico-inschatting en een
// rechtsvermoeden-drempelwaarschuwing; dit hulpmiddel bouwt hetzelfde signaal, maar met
// tekst gericht op de ZZP'er ("bespreek vrije vervanging", niet "herzie de opdracht").
// Puur en deterministisch: geen React, geen DB. Server-side blijft de waarheid.
// Dit is een hulpmiddel, geen juridisch advies; het platform geeft geen oordeel.

import { DBA_RISK_LEVELS, type DbaRisk } from "@/lib/dba";
import { assessRateThreshold } from "@/lib/rechtsvermoeden";

export interface FreelancerComplianceInput {
  /** job.dbaRisk — "LAAG"|"MIDDEN"|"HOOG" of null als de opdrachtgever de DBA-check niet invulde. */
  dbaRisk: string | null | undefined;
  /** Minimum uurtarief in centen (job.rateMin * 100), of null. */
  rateMinCents: number | null;
}

export interface FreelancerComplianceSignal {
  /** Gevalideerd DBA-niveau of null als niet bepaald/ongeldig. */
  dbaLevel: DbaRisk | null;
  /** ZZP'er-gerichte uitleg bij het DBA-niveau; null als dbaLevel null is. */
  dbaMessage: string | null;
  /** Tarief onder de rechtsvermoeden-drempel (< €38/uur). */
  rateBelowThreshold: boolean;
  /** Drempel in centen (voor de UI-tekst). */
  thresholdCents: number;
}

/**
 * ZZP'er-gerichte handelingsuitleg per DBA-risiconiveau (geen juridisch advies).
 * Bewust anders geframed dan `dbaAdvice` uit dba.ts, dat de opdrachtgever aanspreekt
 * ("herzie de opdracht"); hier krijgt de ZZP'er handvatten voor het eigen gesprek.
 */
export const DBA_FREELANCER_ADVICE: Record<DbaRisk, string> = {
  HOOG: "Deze opdracht heeft kenmerken die je zelfstandigheid onder druk kunnen zetten. Bespreek vrije vervanging, een afgebakend resultaat en een zelfstandige werkwijze voordat je afspraken maakt.",
  MIDDEN:
    "Er zijn aandachtspunten voor je zelfstandigheid. Borg vrije vervanging en een resultaatgerichte, zelfstandige werkwijze; vraag zo nodig naar een modelovereenkomst.",
  LAAG: "Lage indicatie van schijnzelfstandigheid op basis van de opgegeven kenmerken.",
};

/** ZZP'er-gerichte uitlegtekst voor een DBA-risiconiveau. */
export function dbaFreelancerAdvice(level: DbaRisk): string {
  return DBA_FREELANCER_ADVICE[level];
}

function isDbaRisk(value: string | null | undefined): value is DbaRisk {
  return value != null && (DBA_RISK_LEVELS as readonly string[]).includes(value);
}

/**
 * Bouwt het ZZP'er-gerichte compliance-signaal voor een opdracht.
 * Geeft `null` terug wanneer er niets te tonen valt (geen geldig DBA-niveau én tarief niet
 * onder de drempel), zodat de aanroeper het blok volledig kan weglaten.
 */
export function buildFreelancerComplianceSignal(
  input: FreelancerComplianceInput,
): FreelancerComplianceSignal | null {
  const dbaLevel = isDbaRisk(input.dbaRisk) ? input.dbaRisk : null;
  const dbaMessage = dbaLevel ? dbaFreelancerAdvice(dbaLevel) : null;
  const { belowThreshold, thresholdCents } = assessRateThreshold(input.rateMinCents);

  if (dbaLevel === null && !belowThreshold) {
    return null;
  }

  return {
    dbaLevel,
    dbaMessage,
    rateBelowThreshold: belowThreshold,
    thresholdCents,
  };
}
