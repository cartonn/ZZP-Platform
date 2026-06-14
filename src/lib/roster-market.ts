// Rooster-marktplaats: pure bucketing van gepubliceerde opdrachten met startdatum per kalenderdag.
// Geen I/O, geen Prisma, geen Next.js — alleen deterministisch transformeren van input naar output.
// Server-side waarheid (CLAUDE.md regel 1); mutaties lopen via bestaande opdracht-detail/reageer-flow.

import { type Weekday, WEEKDAYS } from "@/lib/enums";

export interface RosterShiftInput {
  jobId: string;
  title: string;
  companyName: string;
  startDate: Date;
  rateMin: number | null;
  rateMax: number | null;
  location: string | null;
  workMode: string;
  matchScore: number | null; // null als geen ZZP-profiel (bv. ADMIN)
  alreadyApplied: boolean;
  topReason?: string | null; // zwaarst wegende troef uit de matchmotor (null als geen)
  topGap?: string | null; // zwaarst wegende minpunt uit de matchmotor (null als geen)
}

export interface RosterDay {
  date: Date; // UTC-middernacht van de kalenderdag
  weekday: Weekday; // "MON".."SUN" uit @/lib/enums
  isToday: boolean;
  shifts: RosterShiftInput[];
}

export interface RosterCalendar {
  days: RosterDay[]; // alleen dagen mét diensten, oplopend gesorteerd
  total: number; // aantal diensten geplaatst binnen de horizon
  beyondHorizon: number; // aantal diensten ná de horizon (telt voor een "later"-noot)
}

/** Leidt de UTC-middernacht van een datum af (ms). */
function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Mapt getUTCDay() (0=zo..6=za) naar WEEKDAYS-index (0=ma..6=zo). */
function utcDayToWeekday(utcDay: number): Weekday {
  // ISO: maandag = 0, ..., zondag = 6 → (utcDay + 6) % 7
  // Alle 7 waarden (0-6) zijn gegarandeerd aanwezig; de niet-null-assertie is veilig.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return WEEKDAYS[(utcDay + 6) % 7]!;
}

/**
 * Groepeert diensten met startdatum in een rooster-kalender voor de komende horizonDays dagen.
 * - Diensten vóór vandaag worden genegeerd.
 * - Diensten ná de horizon worden geteld in `beyondHorizon` maar niet in `days` geplaatst.
 * - Binnen een dag: matchScore desc (null achteraan), dan startDate asc, dan title asc.
 * - Muteert de input-array niet.
 */
export function buildRosterCalendar(
  shifts: readonly RosterShiftInput[],
  now: Date = new Date(),
  horizonDays = 21,
): RosterCalendar {
  const todayMs = utcMidnightMs(now);
  const horizonMs = todayMs + horizonDays * 86_400_000;

  // Bucket: dayMs -> index in days-array
  const dayIndex = new Map<number, number>();
  const days: RosterDay[] = [];
  let beyondHorizon = 0;

  for (const shift of shifts) {
    const dayMs = utcMidnightMs(shift.startDate);

    if (dayMs < todayMs) continue; // verleden → negeren
    if (dayMs > horizonMs) {
      beyondHorizon++;
      continue;
    }

    const existing = dayIndex.get(dayMs);
    if (existing === undefined) {
      const idx = days.length;
      dayIndex.set(dayMs, idx);
      const date = new Date(dayMs);
      days.push({
        date,
        weekday: utcDayToWeekday(date.getUTCDay()),
        isToday: dayMs === todayMs,
        shifts: [shift],
      });
    } else {
      days[existing]!.shifts.push(shift);
    }
  }

  // Sorteer dagen oplopend
  days.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Sorteer shifts binnen elke dag: matchScore desc (null achteraan), startDate asc, title asc
  for (const day of days) {
    day.shifts.sort((a, b) => {
      // null-score gaat achteraan
      if (a.matchScore !== null && b.matchScore !== null) {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      } else if (a.matchScore !== null) {
        return -1; // a heeft score, b niet → a vóór b
      } else if (b.matchScore !== null) {
        return 1; // b heeft score, a niet → b vóór a
      }
      // tie-break: startDate asc
      const dateDiff = a.startDate.getTime() - b.startDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      // tie-break: title asc
      return a.title.localeCompare(b.title);
    });
  }

  const total = days.reduce((sum, d) => sum + d.shifts.length, 0);

  return { days, total, beyondHorizon };
}

/** Drempel waarboven een dienst als "sterke match" voor de ZZP'er telt. */
export const ROSTER_STRONG_MATCH_MIN = 70;

/**
 * Filtert een rooster-kalender tot diensten met een matchScore ≥ min.
 * - Diensten zonder score (null, bv. ADMIN) vallen altijd weg — een drempelfilter
 *   is alleen betekenisvol voor een ZZP'er met een profiel.
 * - Lege dagen worden weggelaten; `total` wordt herberekend.
 * - `beyondHorizon` blijft ongemoeid (telt diensten buiten de horizon, ongefilterd).
 * - Muteert de invoer niet.
 */
export function filterRosterByMinMatch(calendar: RosterCalendar, min: number): RosterCalendar {
  const days: RosterDay[] = [];

  for (const day of calendar.days) {
    const shifts = day.shifts.filter((s) => s.matchScore !== null && s.matchScore >= min);
    if (shifts.length > 0) {
      days.push({ ...day, shifts });
    }
  }

  const total = days.reduce((sum, d) => sum + d.shifts.length, 0);

  return { days, total, beyondHorizon: calendar.beyondHorizon };
}
