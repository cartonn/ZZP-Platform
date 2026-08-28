import { CalendarClock, ExternalLink } from "lucide-react";
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
 *
 * Kent het bewijsstuk een canonieke officiële aanvraagbron (bv. VOG → Justis), dan verschijnt een
 * directe link naar die instantie — één klik van "nu aanvragen" naar de juiste plek, zodat de ZZP'er
 * niet zelf hoeft te zoeken. Zonder bron blijft alleen de tekstuele context staan.
 */
export function RenewalLeadtimeNote({ nudge }: { nudge: RenewalNudge | null }) {
  if (!nudge) return null;
  const source = nudge.leadTime.source;
  return (
    <div
      className={"flex gap-2 rounded-md border px-3 py-2 text-sm " + TONE_CLASS[nudge.tone]}
      data-testid="renewal-leadtime-note"
    >
      <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{nudge.message}</p>
        <p className="text-xs opacity-80">{nudge.leadTime.note}</p>
        {source && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1 rounded-sm text-xs font-medium underline underline-offset-2"
            data-testid="renewal-leadtime-source"
          >
            Aanvragen bij {source.label}
            <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}
