import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type IdleCapacity, IDLE_HORIZON_DAYS } from "@/lib/availability-gaps";
import { formatDateShortNl, formatDateRangeNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

// Hoeveel open periodes we in de kaart opsommen; de rest vatten we samen als "+ N periodes".
const MAX_RANGES = 4;
const HORIZON_WEEKS = Math.round(IDLE_HORIZON_DAYS / 7);

/**
 * Toont de open (onbenutte) dagen die de ZZP'er als beschikbaar deelde maar waar nog geen
 * samenwerking op loopt — met een doorklik naar de opdrachten om ze te vullen. Rendert niets
 * wanneer er geen open capaciteit is (`hasAny === false`): geen kaart, geen ruis.
 */
export function IdleCapacityCard({ idle }: { idle: IdleCapacity }) {
  if (!idle.hasAny) return null;

  const shown = idle.openRanges.slice(0, MAX_RANGES);
  const overflow = idle.openRanges.length - shown.length;

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="text-sm font-medium text-foreground">Onbenutte beschikbaarheid</h2>
              <p className="text-xs text-muted-foreground">
                Je bent{" "}
                <span className="font-medium text-foreground">
                  {plural(idle.totalOpenDays, "dag", "dagen")}
                </span>{" "}
                beschikbaar zonder opdracht in de komende {HORIZON_WEEKS} weken. Vul ze met een
                nieuwe klus.
              </p>
            </div>
          </div>
        </div>

        <ul className="space-y-1.5">
          {shown.map((r) => {
            const label =
              r.days === 1 ? formatDateShortNl(r.start) : formatDateRangeNl(r.start, r.end);
            return (
              <li
                key={r.start.toISOString()}
                className="flex items-baseline justify-between gap-3 rounded-md border border-border bg-card px-3 py-1.5 text-sm"
              >
                <span className="truncate font-medium text-foreground">{label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {plural(r.days, "open dag", "open dagen")}
                </span>
              </li>
            );
          })}
        </ul>
        {overflow > 0 && (
          <p className="text-xs text-muted-foreground">
            + nog {plural(overflow, "open periode", "open periodes")}
          </p>
        )}

        <Link
          href="/opdrachten"
          className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Bekijk opdrachten <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
