import { Users } from "lucide-react";
import { LevelChip } from "@/components/jobs/signal-chips";
import { type ReachSummary } from "@/lib/job-reach";

const LEVEL_STYLE: Record<ReachSummary["level"], { dot: string; hint: string }> = {
  good: { dot: "bg-success", hint: "text-success" },
  moderate: { dot: "bg-warning", hint: "text-warning" },
  low: { dot: "bg-muted-foreground", hint: "text-muted-foreground" },
};

const LEVEL_LABEL: Record<ReachSummary["level"], string> = {
  good: "Goed bereik",
  moderate: "Beperkt bereik",
  low: "Klein bereik",
};

/**
 * Toont de eigenaar van een gepubliceerde opdracht hoeveel passende, vindbare ZZP'ers de
 * opdracht bereikt (los van wie al reageerde) en hoeveel daarvan nu beschikbaar zijn.
 * Presentationeel — het bereik is server-side berekend (`getJobReach` → `summarizeJobReach`);
 * deze component beslist niets.
 */
export function JobReachCard({ reach }: { reach: ReachSummary }) {
  const style = LEVEL_STYLE[reach.level];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="size-4" aria-hidden /> Bereik van je opdracht
        </p>
        <LevelChip dotClass={style.dot} label={LEVEL_LABEL[reach.level]} />
      </div>

      {reach.total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nog geen passende ZZP&apos;ers gevonden voor deze opdracht.
        </p>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {reach.total}
            <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
              passende ZZP&apos;ers
            </span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{reach.strong}</span> sterke match
            </span>
            <span>
              <span className="font-medium text-foreground">{reach.strongAvailable}</span> sterk én
              nu beschikbaar
            </span>
          </div>
        </div>
      )}

      {reach.hint && <p className={`text-xs ${style.hint}`}>{reach.hint}</p>}

      <p className="text-xs text-muted-foreground">
        Passende, openbare profielen die nog niet reageerden — los van directe uitnodigingen.
      </p>
    </div>
  );
}
