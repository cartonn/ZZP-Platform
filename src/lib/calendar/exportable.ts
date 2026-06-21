import { parseWeekdays } from "@/lib/weekdays";

/** Minimale velden om te bepalen of een samenwerking events oplevert in de .ics-export. */
export interface ExportableScheduleInput {
  status: string;
  startDate: Date | null;
  weekdays: string | null;
}

/**
 * Of er ten minste één ACTIEVE samenwerking met een gepland weekrooster (startdatum + weekdagen) is.
 * Alleen dan levert de agenda-export (/api/agenda) daadwerkelijk events op en is de exportknop zinvol —
 * gedeeld door /samenwerkingen en /rooster zodat beide dezelfde drempel hanteren. Puur, geen I/O.
 */
export function hasExportableSchedule(collabs: readonly ExportableScheduleInput[]): boolean {
  return collabs.some(
    (c) => c.status === "ACTIVE" && c.startDate != null && parseWeekdays(c.weekdays).length > 0,
  );
}
