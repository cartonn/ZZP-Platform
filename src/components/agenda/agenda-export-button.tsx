import { CalendarDays } from "lucide-react";

/**
 * Download-link voor de agenda-export (.ics) van het eigen werkrooster (`/api/agenda`, RFC 5545).
 * Puur presentationeel; toon 'm alleen als er iets te exporteren valt (zie `hasExportableSchedule`).
 */
export function AgendaExportButton() {
  return (
    <a
      href="/api/agenda"
      download="rooster.ics"
      className="focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <CalendarDays className="size-4" aria-hidden />
      Rooster exporteren (.ics)
    </a>
  );
}
