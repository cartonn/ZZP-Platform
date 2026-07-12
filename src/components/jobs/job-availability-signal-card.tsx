import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { type JobAvailabilitySignal } from "@/lib/job-availability-signal";
import { formatDateShortNl } from "@/lib/format-date";
import { cn } from "@/lib/utils";

/**
 * Waarschuwt de ZZP'er op de opdracht-detail dat de startdatum in een periode valt die hij zelf op
 * onbeschikbaar of beperkt heeft gezet. Presentationeel: het signaal is server-berekend
 * (`assessJobStartAvailability`) en beslist niets — de ZZP'er kan gewoon reageren, dit is een
 * geheugensteuntje tegen zelf-dubbelboeking.
 */
export function JobAvailabilitySignalCard({ signal }: { signal: JobAvailabilitySignal }) {
  const unavailable = signal.windowType === "UNAVAILABLE";
  const period = `${formatDateShortNl(signal.windowStart)} – ${formatDateShortNl(signal.windowEnd)}`;

  return (
    <div
      className={cn(
        "space-y-1.5 rounded-lg border p-4",
        unavailable ? "border-danger/40 bg-danger/5" : "border-warning/40 bg-warning/5",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider",
          unavailable ? "text-danger" : "text-warning",
        )}
      >
        <CalendarClock className="size-4" aria-hidden />
        {unavailable ? "Botst met je agenda" : "Let op je agenda"}
      </p>
      <p className="text-sm text-foreground">
        De startdatum valt in een periode die je zelf op{" "}
        <span className="font-medium">{unavailable ? "onbeschikbaar" : "beperkt beschikbaar"}</span>{" "}
        hebt gezet ({period}).
        {signal.note ? <span className="text-muted-foreground"> — {signal.note}</span> : null}
      </p>
      <p className="text-xs text-muted-foreground">
        Je kunt nog steeds reageren.{" "}
        <Link href="/beschikbaarheid" className="font-medium underline underline-offset-2">
          Pas je beschikbaarheid aan
        </Link>{" "}
        als dit niet meer klopt.
      </p>
    </div>
  );
}
