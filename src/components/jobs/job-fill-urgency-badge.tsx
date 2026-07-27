import { CalendarClock } from "lucide-react";
import { type JobFillUrgencyChip } from "@/lib/jobs/fill-urgency";

// Toon-klassen: acuut = warning (start deze week/verstreken, nog niemand geplaatst), soon = gedempt
// (start binnenkort, nog even tijd). Presentationeel — de classificatie komt server-side uit
// `jobFillUrgency`; deze badge berekent niets.
const TONE_CLASS: Record<JobFillUrgencyChip["tone"], string> = {
  acute: "border-warning/40 bg-warning/10 text-warning",
  soon: "border-border bg-muted text-muted-foreground",
};

/**
 * Compacte acuut-onbezet-badge voor de opdracht-kaart in "Mijn opdrachten" (opdrachtgever): een
 * gepubliceerde opdracht waarvan de startdatum nadert/verstreken is en die nog niet vervuld is.
 */
export function JobFillUrgencyBadge({ chip }: { chip: JobFillUrgencyChip }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        TONE_CLASS[chip.tone],
      ].join(" ")}
    >
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      {chip.label}
    </span>
  );
}
