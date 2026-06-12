// Pure mapper van samenwerkingen naar IcsEvent-objecten. Geen I/O, geen DB, geen netwerk.
// Verantwoordelijk voor het omzetten van een weekrooster (Collaboration) naar kalender-events
// die door buildIcsCalendar (ics.ts) worden geserialiseerd.

import { type IcsEvent } from "@/lib/calendar/ics";
import { formatWeekdays } from "@/lib/weekdays";
import { WEEKDAYS, type Weekday, type CollaborationStatus } from "@/lib/enums";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimale projectie van een Collaboration die nodig is voor het exportscherm. */
export interface ScheduleCollaboration {
  id: string;
  jobTitle: string;
  /** De weergavenaam van de andere partij. */
  counterpartyName: string;
  /** Alleen ACTIVE samenwerkingen worden geëxporteerd. */
  status: CollaborationStatus;
  startDate: Date | null;
  endDate: Date | null;
  /** Reeds geparseerd en gecanonicaliseerd (mag leeg zijn). */
  weekdays: Weekday[];
}

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

/**
 * Mapping van Weekday-code naar het UTC-dagnummer dat getUTCDay() teruggeeft.
 * JavaScript: 0 = zondag, 1 = maandag, …, 6 = zaterdag.
 */
const WEEKDAY_TO_UTC_DAY: Record<Weekday, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

/**
 * Geeft de eerste kalenderdatum op of na `from` waarvan de UTC-weekdag in `days` zit.
 * Zoekt maximaal 7 dagen vooruit. Geeft null terug als `days` leeg is.
 * Muteert `from` niet.
 */
export function firstWeeklyOccurrence(from: Date, days: Weekday[]): Date | null {
  if (days.length === 0) return null;

  const daySet = new Set(days.map((d) => WEEKDAY_TO_UTC_DAY[d]));

  for (let offset = 0; offset < 7; offset++) {
    // Nieuwe Date per iteratie zodat `from` ongewijzigd blijft
    const candidate = new Date(from.getTime() + offset * 24 * 60 * 60 * 1000);
    if (daySet.has(candidate.getUTCDay())) {
      return candidate;
    }
  }

  // Nooit bereikbaar wanneer days.length > 0 (binnen 7 dagen zit altijd een match),
  // maar TypeScript verlangt een returnpad.
  return null;
}

// ---------------------------------------------------------------------------
// Hoofdfunctie
// ---------------------------------------------------------------------------

/**
 * Zet een lijst samenwerkingen om naar IcsEvent-objecten voor de kalenderexport.
 * Filtert niet-ACTIVE samenwerkingen, samenwerkingen zonder weekdagen en samenwerkingen
 * zonder startdatum eruit. Bewaart de invoervolgorde.
 */
export function collaborationScheduleEvents(collabs: ScheduleCollaboration[]): IcsEvent[] {
  return collabs
    .filter(
      (c): c is ScheduleCollaboration & { startDate: Date } =>
        c.status === "ACTIVE" && c.weekdays.length > 0 && c.startDate !== null,
    )
    .map((c) => {
      // firstWeeklyOccurrence geeft hier altijd een Date terug (weekdays.length > 0)
      const start = firstWeeklyOccurrence(c.startDate, c.weekdays) as Date;

      // Gebruik canonieke weekdagvolgorde (WEEKDAYS uit enums.ts) voor de beschrijving
      const canonicalDays = WEEKDAYS.filter((d) => c.weekdays.includes(d));

      const summary =
        c.counterpartyName.trim().length > 0
          ? `${c.jobTitle} — ${c.counterpartyName}` // U+2014 = em dash
          : c.jobTitle;

      const event: IcsEvent = {
        uid: `collab-${c.id}@zzp-platform`,
        summary,
        start,
        allDay: true,
        recurrenceDays: canonicalDays,
        until: c.endDate ?? undefined,
        description: `Werkdagen: ${formatWeekdays(c.weekdays)}.`,
      };

      return event;
    });
}
