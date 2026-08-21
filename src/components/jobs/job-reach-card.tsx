import { AlertTriangle, Users } from "lucide-react";
import { LevelChip } from "@/components/jobs/signal-chips";
import { type ReachSummary } from "@/lib/job-reach";
import { type ReachBottleneck } from "@/lib/job-reach-bottleneck";

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
export function JobReachCard({
  reach,
}: {
  reach: ReachSummary & { bottleneck?: ReachBottleneck | null };
}) {
  const style = LEVEL_STYLE[reach.level];
  // Toon het grootste knelpunt alleen wanneer het bereik niet goed is — bij goed bereik heeft de
  // opdrachtgever geen sturingsactie nodig en zou het signaal ruis zijn.
  const bottleneck = reach.level === "good" ? null : reach.bottleneck;

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

      {bottleneck && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              Grootste knelpunt: {bottleneck.label}
            </p>
            <p className="text-xs text-muted-foreground">{bottleneck.hint}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Passende, openbare profielen die nog niet reageerden — los van directe uitnodigingen.
      </p>
    </div>
  );
}
