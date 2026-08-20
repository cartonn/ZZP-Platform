// Voorstel-ouderdomssignaal — hoe lang staat een voorgestelde samenwerking al te wachten op
// ondertekening? De werkproces-fase toont "Contract ter ondertekening · Aan zet" (zie
// `cascade/stage.ts`), maar niet de dúúr: een voorstel van een uur oud ziet er identiek uit als
// een dat al acht dagen stil hangt. Dit signaal maakt het stilstaan zichtbaar zodat de
// opdrachtgever (die voorstelde en nu wacht) de ZZP'er gericht kan aansporen of de zoektocht
// heropent, en de bemiddelaar vastgelopen plaatsingen ziet. Puur en deterministisch; de server
// levert de inputs, de UI toont alleen. Geen schema-wijziging: leunt op `Collaboration.createdAt`.
import { startOfUtcDay } from "./signals";

export type ProposalAgePhase = "none" | "fresh" | "stalling";

export interface ProposalAgeInput {
  /** CollaborationStatus — alleen een PROPOSED-samenwerking wacht op ondertekening. */
  status: string;
  /** ContractStatus — "SIGNED" = getekend (cascade gedeblokkeerd) → geen signaal. */
  contractStatus: string;
  /** Moment van voorstellen (`Collaboration.createdAt`). */
  createdAt: Date;
  /** Bevroren door een dispuut → geen nudge tot dat is opgelost. */
  disputed?: boolean;
  now?: Date;
  /** Dagen dat een voorstel rustig mag rijpen voordat het als stilstaand telt (default 4). */
  thresholdDays?: number;
}

export interface ProposalAgeSummary {
  phase: ProposalAgePhase;
  /** Hele dagen sinds het voorstel (UTC-dag, TZ-robuust); 0 bij een vers voorstel. */
  daysWaiting: number;
  /** `stalling` → toon de nudge. */
  attention: boolean;
  /** Klaar-om-te-tonen label, of `null` als er niets te melden valt. */
  label: string | null;
}

/**
 * Standaarddrempel: onder vier dagen houden we de lijst rustig. Een voorstel op vrijdag dat pas
 * maandag wordt bekeken is drie dagen oud — vier dagen dempt die weekend-ruis zodat alleen een
 * echt stilstaand voorstel aandacht vraagt.
 */
export const PROPOSAL_STALE_DAYS = 4;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Hele kalenderdagen tussen twee momenten (UTC-dag, TZ-robuust). */
function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

/**
 * Leidt af hoe lang een voorgestelde samenwerking al op ondertekening wacht. Alleen een PROPOSED,
 * nog niet getekende, niet-bevroren samenwerking komt in aanmerking; al het andere geeft
 * `phase: "none"` (rustige lijst). Onder de drempel is het voorstel `"fresh"` (geen label);
 * daarboven `"stalling"` met een tonbaar label. Puur.
 */
export function summarizeProposalAge(input: ProposalAgeInput): ProposalAgeSummary {
  const { status, contractStatus, createdAt, disputed = false } = input;
  const now = input.now ?? new Date();
  const thresholdDays = input.thresholdDays ?? PROPOSAL_STALE_DAYS;

  const none: ProposalAgeSummary = {
    phase: "none",
    daysWaiting: 0,
    attention: false,
    label: null,
  };

  // Alleen een voorgestelde, nog niet getekende, niet-bevroren samenwerking wacht op ondertekening.
  if (status !== "PROPOSED") return none;
  if (contractStatus === "SIGNED") return none;
  if (disputed) return none;

  // Klok-skew of een voorstel "vandaag" → nooit negatief.
  const daysWaiting = Math.max(0, wholeDaysBetween(createdAt, now));

  if (daysWaiting < thresholdDays) {
    return { phase: "fresh", daysWaiting, attention: false, label: null };
  }

  return {
    phase: "stalling",
    daysWaiting,
    attention: true,
    label: `Wacht al ${daysWaiting} dagen op ondertekening`,
  };
}
