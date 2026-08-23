// Onbenutte-beschikbaarheid ("idle capacity"): puur read-model dat de geboekte samenwerkingen
// aftrekt van de door de ZZP'er gedeelde inzetbare (AVAILABLE/LIMITED) vensters en de resterende
// open dagen/periodes in de komende horizon teruggeeft. Zet gedeclareerde beschikbaarheid om in
// een concreet "vul deze dagen"-signaal → minder leegloop.
//
// Server-side waarheid; geen I/O, geen React. Pure functies, getest. Dit beslist niets over toegang
// of status — het is een advies-signaal (de ZZP'er kan altijd reageren op opdrachten).

import { type AvailabilityWindowType, type CollaborationStatus } from "@/lib/enums";

const DAY_MS = 24 * 60 * 60 * 1000;

// Standaard vooruitblik: 6 weken. Ver genoeg om open dagen op tijd te vullen, kort genoeg om
// alleen de eerstkomende, planbare leegte te tonen (niet maanden vooruit).
export const IDLE_HORIZON_DAYS = 42;

export interface CapacityWindowInput {
  readonly startDate: Date;
  readonly endDate: Date; // INCLUSIEF (dekt de hele einddag), gelijk aan de conventie in availability.ts
  readonly type: AvailabilityWindowType; // "AVAILABLE" | "LIMITED" | "UNAVAILABLE"
}

export interface BookedCollabInput {
  readonly status: CollaborationStatus;
  readonly startDate: Date | null;
  readonly endDate: Date | null; // null = open einde (loopt door tot de horizon)
}

export interface OpenRange {
  /** Middernacht UTC van de eerste open dag. */
  readonly start: Date;
  /** Middernacht UTC van de laatste open dag (inclusief). */
  readonly end: Date;
  /** Aantal open kalenderdagen in het bereik (inclusief begin- én einddag). */
  readonly days: number;
}

export interface IdleCapacity {
  /** Open periodes binnen de horizon, oplopend op startdatum. */
  readonly openRanges: readonly OpenRange[];
  /** Som van de open dagen over alle periodes. */
  readonly totalOpenDays: number;
  /** True zodra er minstens één open periode is. */
  readonly hasAny: boolean;
}

// Interne, inclusieve dag-index-representatie [start, end] (integers, UTC-dagen sinds epoch).
interface DaySpan {
  start: number;
  end: number;
}

/** UTC-dagindex van een middernacht-UTC-datum (deterministisch, geen lokale tijdzone). */
function dayIndex(d: Date): number {
  return Math.floor(d.getTime() / DAY_MS);
}

/** Voeg overlappende én aangrenzende ([..,e] gevolgd door [e+1,..]) spans samen. */
function mergeSpans(spans: DaySpan[]): DaySpan[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: DaySpan[] = [];
  for (const cur of sorted) {
    const last = merged[merged.length - 1];
    if (last && cur.start <= last.end + 1) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/**
 * Trek de (gemergde) geboekte spans af van één beschikbare span en geef de open resten terug.
 * Beide zijden zijn inclusief; werkt op dag-indices.
 */
function subtractSpan(available: DaySpan, booked: readonly DaySpan[]): DaySpan[] {
  const out: DaySpan[] = [];
  let cursor = available.start;
  for (const b of booked) {
    if (b.end < cursor) continue; // ligt vóór het resterende deel
    if (b.start > available.end) break; // en verder ligt alles buiten de span
    if (b.start > cursor) out.push({ start: cursor, end: Math.min(b.start - 1, available.end) });
    cursor = Math.max(cursor, b.end + 1);
    if (cursor > available.end) break;
  }
  if (cursor <= available.end) out.push({ start: cursor, end: available.end });
  return out;
}

/**
 * Bepaal de onbenutte beschikbaarheid binnen [now, now + horizon].
 *
 * - Inzetbaar = AVAILABLE + LIMITED-vensters (UNAVAILABLE telt niet mee als capaciteit).
 * - Geboekt = PROPOSED- én ACTIVE-samenwerkingen; een voorstel legt de dagen al voorlopig vast.
 *   Een samenwerking zónder startdatum kan niet in de tijd worden geplaatst en telt niet mee;
 *   een open einde (endDate === null) loopt door tot het einde van de horizon.
 * - Alles wordt geklemd op [vandaag, vandaag + horizonDays] (inclusief) en op dag-granulariteit
 *   berekend (kalenderdagen, weekend meegerekend — in de zorg zijn dat gewoon dienstdagen).
 *
 * Geeft de open resten terug (beschikbaar minus geboekt), oplopend op startdatum, met dagtelling.
 */
export function findIdleCapacity(
  windows: readonly CapacityWindowInput[],
  collaborations: readonly BookedCollabInput[],
  now: Date = new Date(),
  horizonDays: number = IDLE_HORIZON_DAYS,
): IdleCapacity {
  const today = dayIndex(now);
  const lastDay = today + Math.max(0, Math.floor(horizonDays));

  const availableSpans: DaySpan[] = [];
  for (const w of windows) {
    if (w.type !== "AVAILABLE" && w.type !== "LIMITED") continue;
    const start = Math.max(dayIndex(w.startDate), today);
    const end = Math.min(dayIndex(w.endDate), lastDay);
    if (start <= end) availableSpans.push({ start, end });
  }

  const bookedSpans: DaySpan[] = [];
  for (const c of collaborations) {
    if (c.status !== "PROPOSED" && c.status !== "ACTIVE") continue;
    if (!c.startDate) continue;
    const start = Math.max(dayIndex(c.startDate), today);
    const end = c.endDate ? Math.min(dayIndex(c.endDate), lastDay) : lastDay;
    if (start <= end) bookedSpans.push({ start, end });
  }

  const mergedAvailable = mergeSpans(availableSpans);
  const mergedBooked = mergeSpans(bookedSpans);

  const openSpans: DaySpan[] = [];
  for (const span of mergedAvailable) {
    openSpans.push(...subtractSpan(span, mergedBooked));
  }

  const openRanges: OpenRange[] = openSpans
    .sort((a, b) => a.start - b.start)
    .map((s) => ({
      start: new Date(s.start * DAY_MS),
      end: new Date(s.end * DAY_MS),
      days: s.end - s.start + 1,
    }));

  const totalOpenDays = openRanges.reduce((sum, r) => sum + r.days, 0);
  return { openRanges, totalOpenDays, hasAny: openRanges.length > 0 };
}
