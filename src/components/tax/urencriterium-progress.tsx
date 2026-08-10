import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  hoursProgressPercent,
  type HoursCriterionSummary,
} from "@/lib/tax/hours-criterion-summary";
import { hoursFeasibilityPill, hoursProgressTone } from "@/lib/tax/urencriterium-progress";

/**
 * Urencriterium-voortgang (1.225 uur → zelfstandigenaftrek): geboekt-vs-doel-regel + voortgangsbalk +
 * één uitlegzin. Wrapper-agnostisch (geen kaart/titel) zodat elk oppervlak zijn eigen omhulsel kiest:
 * /inzicht wikkelt dit in een `BiWidget`, /ontzorgd/uren in een `Card`. De stand komt server-side uit
 * `getHoursCriterionSummary`; deze component beslist niets over toegang of berekening.
 */
export function UrencriteriumProgress({ summary }: { summary: HoursCriterionSummary }) {
  const pct = hoursProgressPercent(summary);
  const tone = hoursProgressTone(summary);
  const pill = hoursFeasibilityPill(summary);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Timer className="size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {summary.totalHours.toLocaleString("nl-NL")}
            </span>{" "}
            van {summary.targetHours.toLocaleString("nl-NL")} uur geboekt in {summary.year}
          </span>
        </p>
        <span className="flex shrink-0 items-center gap-2">
          {pill && (
            <Badge variant={pill.variant} className="whitespace-nowrap">
              {pill.label}
            </Badge>
          )}
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{pct}%</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Urencriterium ${summary.year}`}
      >
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${Math.max(pct > 0 ? 2 : 0, pct)}%` }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {summary.noActivity
          ? "Je hebt dit jaar nog geen uren geboekt. Directe uren tellen mee zodra ze goedgekeurd zijn; registreer daarnaast je indirecte uren voor de aftrek."
          : summary.hint}
      </p>
    </div>
  );
}
