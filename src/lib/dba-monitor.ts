// DBA-monitoring: doorlopende, tijd- en patroongedreven risicosignalering (PLATFORM_OVERHAUL.md §6).
// HARD (Besluit 2): het platform signaleert, waarschuwt en documenteert — het geeft GEEN juridisch
// advies en GARANDEERT niets. Elk signaal gaat vergezeld van de disclaimer. Drempels zijn
// configureerbaar (config.ts), niet hardcoded. Pure functies, getest; de scheduled runner past toe.

import { DBA_THRESHOLDS, DBA_DISCLAIMER } from "@/lib/config";
import { type DbaThresholds } from "@/lib/platform-config";

export const DBA_SIGNAL_LEVELS = ["LAAG", "VERHOOGD", "HOOG"] as const;
export type DbaSignalLevel = (typeof DBA_SIGNAL_LEVELS)[number];

/** Niet-alarmerende labels (§7): rustig tonen, nooit als juridisch oordeel. */
export const DBA_LEVEL_LABEL: Record<DbaSignalLevel, string> = {
  LAAG: "Laag risico",
  VERHOOGD: "Verhoogd risico",
  HOOG: "Hoog risico",
};

export interface DbaMonitorInput {
  collaborationId: string;
  startDate: Date | null;
  /** Aandeel van de omzet van de ZZP'er bij déze opdrachtgever (0–100), indien bekend. */
  revenueConcentrationPct?: number | null;
  /** Statische patroon-indicatoren (uit contract/opdracht), indien bekend. */
  sameFunctionAsEmployees?: boolean;
  fixedSchedule?: boolean;
  directionAndSupervision?: boolean;
}

export interface DbaSignal {
  /** Stabiele sleutel voor idempotente dedup (bv. "duration-12m"). */
  key: string;
  level: DbaSignalLevel;
  message: string;
}

export interface DbaAssessment {
  collaborationId: string;
  durationMonths: number | null;
  level: DbaSignalLevel;
  signals: DbaSignal[];
  /** Altijd meegegeven; nooit weglaten in de UI (Besluit 2). */
  disclaimer: string;
}

/** De DBA-indicatoren die al bij plaatsing op de opdracht zijn vastgelegd (Job.dba*). */
export interface JobDbaFlags {
  dbaDirectSupervision: boolean;
  dbaEmbedded: boolean;
  dbaFixedSchedule: boolean;
}

/** Vertaalt de opgeslagen Job-DBA-vlaggen naar doorlopende monitor-indicatoren. */
export function jobDbaIndicators(
  job: JobDbaFlags,
): Pick<DbaMonitorInput, "directionAndSupervision" | "fixedSchedule" | "sameFunctionAsEmployees"> {
  return {
    directionAndSupervision: job.dbaDirectSupervision,
    fixedSchedule: job.dbaFixedSchedule,
    sameFunctionAsEmployees: job.dbaEmbedded,
  };
}

/**
 * Aandeel (0–100, afgerond) van de omzet bij één opdrachtgever t.o.v. de totale omzet van de ZZP'er.
 * `null` als er (nog) geen omzet is — dan geen signaal.
 */
export function revenueConcentrationPct(
  totalByClient: Record<string, number>,
  clientId: string,
): number | null {
  const total = Object.values(totalByClient).reduce((sum, v) => sum + v, 0);
  if (total <= 0) return null;
  const here = totalByClient[clientId] ?? 0;
  return Math.round((here / total) * 100);
}

/** Aantal volledige maanden tussen `start` en `now` (kalendermaanden, dag-gecorrigeerd). */
export function monthsBetween(start: Date, now: Date): number {
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Hoogste niveau uit een lijst signalen (HOOG > VERHOOGD > LAAG). */
function highestLevel(signals: readonly DbaSignal[]): DbaSignalLevel {
  if (signals.some((s) => s.level === "HOOG")) return "HOOG";
  if (signals.some((s) => s.level === "VERHOOGD")) return "VERHOOGD";
  return "LAAG";
}

/**
 * Beoordeelt één samenwerking op DBA-risicosignalen. Deterministisch en verklaarbaar:
 * elk signaal heeft een eigen reden. Geen oordeel — slechts signalering met disclaimer.
 * Optionele `thresholds` overschrijven de statische standaarden uit config.ts.
 */
export function assessCollaborationDba(
  input: DbaMonitorInput,
  now: Date = new Date(),
  thresholds?: DbaThresholds,
): DbaAssessment {
  const t = thresholds ?? DBA_THRESHOLDS;
  const signals: DbaSignal[] = [];
  let durationMonths: number | null = null;

  if (input.startDate) {
    durationMonths = monthsBetween(input.startDate, now);
    if (durationMonths >= t.durationStrongSignalMonths) {
      signals.push({
        key: "duration-12m",
        level: "HOOG",
        message: `Deze opdracht loopt inmiddels ${durationMonths} maanden. Langdurige onafgebroken inzet kan een verhoogd risico op schijnzelfstandigheid opleveren. Overweeg een interne beoordeling.`,
      });
    } else if (durationMonths >= t.durationSignalMonths) {
      signals.push({
        key: "duration-6m",
        level: "VERHOOGD",
        message: `Deze opdracht loopt inmiddels ${durationMonths} maanden. Houd de continuïteit van de inzet in de gaten.`,
      });
    }
  }

  if (
    input.revenueConcentrationPct != null &&
    input.revenueConcentrationPct >= t.revenueConcentrationPct
  ) {
    signals.push({
      key: "revenue-concentration",
      level: "VERHOOGD",
      message: `Meer dan ${t.revenueConcentrationPct}% van de omzet van de ZZP'er komt bij deze opdrachtgever vandaan. Beperkte spreiding kan op afhankelijkheid wijzen.`,
    });
  }
  if (input.sameFunctionAsEmployees) {
    signals.push({
      key: "same-function",
      level: "VERHOOGD",
      message: "Dezelfde functie als werknemers in dienst kan richting een dienstverband wijzen.",
    });
  }
  if (input.fixedSchedule) {
    signals.push({
      key: "fixed-schedule",
      level: "VERHOOGD",
      message: "Een vaste roosterstructuur lijkt op een dienstverband.",
    });
  }
  if (input.directionAndSupervision) {
    signals.push({
      key: "supervision",
      level: "HOOG",
      message:
        "Kenmerken van leiding en toezicht wijzen op een gezagsverhouding — een werknemerskenmerk.",
    });
  }

  return {
    collaborationId: input.collaborationId,
    durationMonths,
    level: highestLevel(signals),
    signals,
    disclaimer: DBA_DISCLAIMER,
  };
}

// --- Scheduled monitor (plan/apply, zoals runExpiryTask) -------------------

export interface DbaRaiseItem {
  collaborationId: string;
  freelancerUserId: string;
  clientUserId: string;
  signal: DbaSignal;
  /** Idempotentiesleutel voor het DomainEvent (één signaal per samenwerking maar één keer). */
  dedupeKey: string;
}

export interface DbaMonitorCandidate extends DbaMonitorInput {
  freelancerUserId: string;
  clientUserId: string;
}

export interface DbaMonitorPlan {
  toRaise: DbaRaiseItem[];
}

/**
 * Bepaalt welke DBA-signalen gevuurd moeten worden over de actieve samenwerkingen. Idempotentie
 * regelt de runner via `dedupeKey` (DomainEvent). Pure functie: geen I/O.
 * Optionele `thresholds` overschrijven de statische standaarden uit config.ts.
 */
export function planDbaMonitorRun(
  candidates: readonly DbaMonitorCandidate[],
  now: Date = new Date(),
  thresholds?: DbaThresholds,
): DbaMonitorPlan {
  const toRaise: DbaRaiseItem[] = [];
  for (const c of candidates) {
    const assessment = assessCollaborationDba(c, now, thresholds);
    for (const signal of assessment.signals) {
      toRaise.push({
        collaborationId: c.collaborationId,
        freelancerUserId: c.freelancerUserId,
        clientUserId: c.clientUserId,
        signal,
        dedupeKey: `dba-${c.collaborationId}-${signal.key}`,
      });
    }
  }
  return { toRaise };
}
