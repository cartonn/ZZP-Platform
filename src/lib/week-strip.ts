// Weekrooster als kalenderstrip (PLAN-WERELDKLASSE Fase 2): zet het pure `WeekOverview`
// (zie week-overview.ts) om naar zeven dagkolommen (ma→zo) met per dag de samenwerkingen die
// er lopen. Een samenwerking met een vastgelegd per-dag-rooster (`weekdays`, ADR-0004) verschijnt
// op precies die dagen; een samenwerking zónder rooster valt terug op de kalenderdagen waarop ze
// deze week actief is (start/eind geklemd op de week). Pure functie, geen I/O — testbaar en
// deterministisch.

import { WEEKDAYS, type Weekday } from "@/lib/enums";
import { type WeekCollaborationEntry, type WeekOverview } from "@/lib/week-overview";

const DAY_MS = 86_400_000;

export interface WeekStripEntry {
  collaborationId: string;
  clientName: string;
  jobTitle: string;
  /** Uurtarief in centen, of null. Doorgegeven voor eventuele weergave; niet gebruikt voor plaatsing. */
  rate: number | null;
  /** true = uit een expliciet weekrooster (ADR-0004); false = timing-fallback (actief die dag). */
  scheduled: boolean;
}

export interface WeekStripDay {
  weekday: Weekday; // "MON".."SUN"
  /** UTC-middernacht van deze kalenderdag binnen de ISO-week. */
  date: Date;
  isToday: boolean;
  entries: WeekStripEntry[];
}

export interface WeekStrip {
  days: WeekStripDay[]; // exact 7, maandag → zondag
  /** true zodra minstens één dag een samenwerking toont. */
  hasAny: boolean;
}

/** UTC-middernacht van een datum (dag-niveau vergelijking, tijdzone-onafhankelijk). */
function utcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Is een entry zónder vastgelegd rooster actief op kalenderdag `dayMs` (UTC-middernacht)?
 * De startdag telt volledig mee (vergelijk op dag-niveau); de einddag telt mee t/m zijn tijdstip.
 * Open uiteinden (null) klemmen op de week.
 */
function activeOnDay(
  entry: WeekCollaborationEntry,
  dayMs: number,
  weekStart: Date,
  weekEnd: Date,
): boolean {
  const start = entry.startDate ? utcMidnight(entry.startDate) : weekStart.getTime();
  const end = entry.endDate ? entry.endDate.getTime() : weekEnd.getTime();
  return dayMs >= start && dayMs <= end;
}

/**
 * Bouwt de zeven-daagse kalenderstrip uit het weekoverzicht. `now` bepaalt welke dag "vandaag" is.
 */
export function buildWeekStrip(week: WeekOverview, now: Date = new Date()): WeekStrip {
  const todayMs = utcMidnight(now);

  const days: WeekStripDay[] = WEEKDAYS.map((weekday, i) => {
    const dayMs = week.weekStart.getTime() + i * DAY_MS;
    const entries: WeekStripEntry[] = [];
    for (const e of week.entries) {
      const roster = e.weekdays ?? [];
      const onDay =
        roster.length > 0
          ? roster.includes(weekday)
          : activeOnDay(e, dayMs, week.weekStart, week.weekEnd);
      if (onDay) {
        entries.push({
          collaborationId: e.collaborationId,
          clientName: e.clientName,
          jobTitle: e.jobTitle,
          rate: e.rate,
          scheduled: roster.length > 0,
        });
      }
    }
    return {
      weekday,
      date: new Date(dayMs),
      isToday: dayMs === todayMs,
      entries,
    };
  });

  return { days, hasAny: days.some((d) => d.entries.length > 0) };
}
