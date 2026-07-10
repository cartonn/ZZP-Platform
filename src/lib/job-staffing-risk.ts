// Bezettingsrisico-signaal voor de OPDRACHTGEVER: een gepubliceerde opdracht met een naderende
// startdatum waarvoor nog niemand is vastgelegd, dreigt onbezet te beginnen. Waar
// `job-vacancy-performance.ts` het algemene tempo sinds publicatie samenvat, koppelt dit het concrete
// `startDate`-deadline aan de vraag "heb ik op tijd iemand?" — de individuele tegenhanger van de
// tenant-brede `franchise/dekkingsprognose.ts`. Benchmark: Temper/Zorgwerk waarschuwen wanneer een
// shift dreigt open te blijven. Puur en deterministisch; de server bepaalt de fase, de UI toont alleen.
import { startOfUtcDay } from "./signals";

export type StaffingRiskPhase = "none" | "on_track" | "approaching" | "urgent" | "overdue";
export type StaffingRiskTone = "neutral" | "warning" | "danger";
export type StaffingRiskAction = "review_shortlist" | "review_applicants" | "widen_reach";

export interface StaffingRiskInput {
  /** JobStatus — alleen een PUBLISHED opdracht kan onbezet dreigen te starten. */
  status: string;
  /** Startdatum van de opdracht; null = geen concrete datum, geen signaal. */
  startDate: Date | null;
  /** Er is al iemand vastgelegd (ACCEPTED reactie of een niet-geannuleerde samenwerking). */
  lockedIn: boolean;
  /** Aantal actieve (niet-ingetrokken) reacties op de opdracht. */
  applicantCount: number;
  /** Aantal reacties dat op de shortlist staat. */
  shortlistCount: number;
  now?: Date;
  /** Dagen tot start waarbinnen het risico "urgent" is (default 3). */
  urgentDays?: number;
  /** Dagen tot start waarbinnen het risico "naderend" is (default 10). */
  approachingDays?: number;
}

export interface StaffingRiskSummary {
  phase: StaffingRiskPhase;
  /** Hele dagen tot de startdatum (UTC-dag), negatief als de datum verstreken is; null bij geen datum. */
  daysUntilStart: number | null;
  /** approaching / urgent / overdue → toon de waarschuwing. */
  attention: boolean;
  tone: StaffingRiskTone;
  /** Meest relevante volgende stap, afgeleid uit de reactie-stand. */
  action: StaffingRiskAction;
}

/** Binnen 3 dagen vóór de start = urgent. */
export const STAFFING_URGENT_DAYS = 3;
/** Binnen 10 dagen vóór de start = naderend risico. */
export const STAFFING_APPROACHING_DAYS = 10;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Hele kalenderdagen tussen twee momenten (UTC-dag, TZ-robuust). */
function wholeDaysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

/** De meest gerichte volgende stap: eerst de shortlist, dan de reacties, anders het bereik vergroten. */
function resolveAction(shortlistCount: number, applicantCount: number): StaffingRiskAction {
  if (shortlistCount > 0) return "review_shortlist";
  if (applicantCount > 0) return "review_applicants";
  return "widen_reach";
}

export function summarizeStaffingRisk(input: StaffingRiskInput): StaffingRiskSummary {
  const { status, startDate, lockedIn, applicantCount, shortlistCount } = input;
  const now = input.now ?? new Date();
  const urgentDays = input.urgentDays ?? STAFFING_URGENT_DAYS;
  const approachingDays = input.approachingDays ?? STAFFING_APPROACHING_DAYS;
  const action = resolveAction(shortlistCount, applicantCount);

  const none: StaffingRiskSummary = {
    phase: "none",
    daysUntilStart: null,
    attention: false,
    tone: "neutral",
    action,
  };

  // Alleen een gepubliceerde, nog-onbezette opdracht met een concrete startdatum kan risico lopen.
  if (status !== "PUBLISHED" || lockedIn || !startDate) return none;

  const daysUntilStart = wholeDaysBetween(now, startDate);

  if (daysUntilStart < 0) {
    return { phase: "overdue", daysUntilStart, attention: true, tone: "danger", action };
  }
  if (daysUntilStart <= urgentDays) {
    return { phase: "urgent", daysUntilStart, attention: true, tone: "danger", action };
  }
  if (daysUntilStart <= approachingDays) {
    return { phase: "approaching", daysUntilStart, attention: true, tone: "warning", action };
  }
  return { phase: "on_track", daysUntilStart, attention: false, tone: "neutral", action };
}

/** Compacte kop per fase — de waarschuwing is advies, geen blokkade. */
export function staffingRiskHeadline(
  phase: StaffingRiskPhase,
  daysUntilStart: number | null,
): string {
  if (phase === "overdue") {
    if (daysUntilStart === -1) return "De startdatum was gisteren — nog niemand vastgelegd";
    return "De startdatum is verstreken — nog niemand vastgelegd";
  }
  if (phase === "urgent" || phase === "approaching") {
    if (daysUntilStart === 0) return "De opdracht start vandaag — nog niemand vastgelegd";
    if (daysUntilStart === 1) return "De opdracht start morgen — nog niemand vastgelegd";
    return `De opdracht start over ${daysUntilStart} dagen — nog niemand vastgelegd`;
  }
  return "De opdracht is op tijd te bezetten";
}

/** De begeleidende zin bij de volgende stap. */
export function staffingRiskActionLabel(action: StaffingRiskAction): string {
  switch (action) {
    case "review_shortlist":
      return "Bekijk je shortlist en leg een kandidaat vast";
    case "review_applicants":
      return "Beoordeel de reacties en leg een kandidaat vast";
    case "widen_reach":
      return "Nodig passende ZZP'ers uit of verruim de eisen";
  }
}
