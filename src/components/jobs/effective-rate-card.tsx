import { Car } from "lucide-react";
import { type EffectiveRateSummary } from "@/lib/effective-rate";

/**
 * Toont de ZZP'er die een opdracht op afstand overweegt wat het gepubliceerde uurtarief, gecorrigeerd
 * voor de onbetaalde retour-reistijd per werkdag, effectief oplevert. Presentationeel: de correctie is
 * server-berekend (`summarizeEffectiveRate`); deze component beslist niets en toont het als indicatie.
 */
export function EffectiveRateCard({ summary }: { summary: EffectiveRateSummary }) {
  const travelLabel = formatHours(summary.unpaidTravelHoursPerDay);
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Car className="size-4" aria-hidden /> Netto na reistijd
        </p>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          −{summary.dragPct}%
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          € {summary.effectiveHourlyEuros}
          <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
            effectief / uur
          </span>
        </p>
        <p className="font-mono text-sm tabular-nums text-muted-foreground line-through">
          € {summary.headlineRateEuros}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Reken je {travelLabel} onbetaalde reis heen en terug mee op een werkdag van{" "}
        {summary.workHoursPerDay} uur, dan houd je effectief ± € {summary.effectiveHourlyEuros} per
        uur over. Een opdracht dichterbij levert netto vaak meer op.
      </p>
    </div>
  );
}

/** "1,5 u" — Nederlandse notatie met komma; hele uren zonder decimaal. */
function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
  return `${text} u`;
}
