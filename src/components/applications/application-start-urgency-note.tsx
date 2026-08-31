import { CalendarClock } from "lucide-react";
import { type ApplicationStartUrgency } from "@/lib/application-start-urgency";

/**
 * Klemtoon onder een nog-openstaande reactiekaart: de opdracht begint binnenkort (of had al moeten
 * beginnen) terwijl de opdrachtgever nog geen beslissing nam. Helpt de ZZP'er beslissen om na te
 * jagen of verder te kijken nu de beslis-window sluit. Presentationeel; de urgentie is server-side
 * afgeleid (`applicationStartUrgency`). Rendert niets zonder signaal.
 */
export function ApplicationStartUrgencyNote({ urgency }: { urgency: ApplicationStartUrgency }) {
  const tone = urgency.tone === "urgent" ? "font-medium text-warning" : "text-muted-foreground";
  return (
    <p className={`mt-2 flex items-center gap-x-1.5 text-xs ${tone}`}>
      <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{urgency.label}</span>
    </p>
  );
}
