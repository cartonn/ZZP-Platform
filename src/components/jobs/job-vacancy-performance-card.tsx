import { Gauge } from "lucide-react";
import { LevelChip } from "@/components/jobs/signal-chips";
import { type VacancyPerformanceSummary } from "@/lib/job-vacancy-performance";

const TONE_STYLE: Record<VacancyPerformanceSummary["tone"], { dot: string; hint: string }> = {
  positive: { dot: "bg-success", hint: "text-success" },
  neutral: { dot: "bg-muted-foreground", hint: "text-muted-foreground" },
  warning: { dot: "bg-warning", hint: "text-warning" },
};

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Toont de eigenaar van een gepubliceerde opdracht hoe die in de tijd presteert: dagen open,
 * reacties en het tempo per week. Presentationeel — het tempo is server-side berekend
 * (`summarizeVacancyPerformance`); deze component beslist niets en toont nooit kandidaatgegevens.
 */
export function JobVacancyPerformanceCard({ summary }: { summary: VacancyPerformanceSummary }) {
  const style = TONE_STYLE[summary.tone];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Gauge className="size-4" aria-hidden /> Vacaturetempo
        </p>
        <LevelChip dotClass={style.dot} label={summary.headline} />
      </div>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {summary.daysOpen}
          <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
            {plural(summary.daysOpen, "dag open", "dagen open")}
          </span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{summary.applicationCount}</span>{" "}
            {plural(summary.applicationCount, "reactie", "reacties")}
          </span>
          {summary.applicationCount > 0 && (
            <span>
              <span className="font-medium text-foreground">
                {summary.perWeek.toString().replace(".", ",")}
              </span>{" "}
              per week
            </span>
          )}
        </div>
      </div>

      <p className={`text-xs ${style.hint}`}>{summary.hint}</p>

      <p className="text-xs text-muted-foreground">
        Tempo sinds publicatie — alleen zichtbaar voor jou.
      </p>
    </div>
  );
}
