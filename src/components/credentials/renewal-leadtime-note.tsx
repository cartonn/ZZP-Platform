import { CalendarClock } from "lucide-react";
import { type RenewalNudge } from "@/lib/credential-renewal-leadtime";

const TONE_CLASS: Record<RenewalNudge["tone"], string> = {
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-border bg-muted/40 text-muted-foreground",
};

/**
 * Rustige doorlooptijd-nudge op een certificaatkaart: wijst de ZZP'er erop dat het verkrijgen van een
 * nieuw bewijsstuk weken kan duren, zodat hij op tijd start en niet zijn inzetbaarheid verliest. Rendert
 * niets zonder nudge (de kaart blijft rustig). Presentatie-only; de beslissing leeft in `renewalNudge`.
 */
export function RenewalLeadtimeNote({ nudge }: { nudge: RenewalNudge | null }) {
  if (!nudge) return null;
  return (
    <div
      className={"flex gap-2 rounded-md border px-3 py-2 text-sm " + TONE_CLASS[nudge.tone]}
      data-testid="renewal-leadtime-note"
    >
      <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-0.5">
        <p className="font-medium">{nudge.message}</p>
        <p className="text-xs opacity-80">{nudge.leadTime.note}</p>
      </div>
    </div>
  );
}
