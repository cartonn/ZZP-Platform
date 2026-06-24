import { Users, Zap } from "lucide-react";
import { type CompetitionSummary } from "@/lib/job-competition";

const LEVEL_STYLE: Record<CompetitionSummary["level"], { dot: string }> = {
  high: { dot: "bg-warning" },
  moderate: { dot: "bg-muted-foreground" },
  low: { dot: "bg-success" },
};

const LEVEL_LABEL: Record<CompetitionSummary["level"], string> = {
  high: "Veel reacties",
  moderate: "Enkele reacties",
  low: "Weinig reacties",
};

/**
 * Toont de ZZP'er die een gepubliceerde opdracht bekijkt hoeveel kandidaten al reageerden en — via de
 * server-berekende samenvatting (`summarizeJobCompetition`) — hoe sterk hij ervoor staat en of snel
 * handelen loont. Presentationeel: deze component beslist niets en toont nooit gegevens van andere
 * kandidaten, alleen hun aantal.
 */
export function JobCompetitionCard({ competition }: { competition: CompetitionSummary }) {
  const style = LEVEL_STYLE[competition.level];
  const countLabel = competition.applicantCount === 1 ? "kandidaat" : "kandidaten";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="size-4" aria-hidden /> Jouw kans
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={`size-2 rounded-full ${style.dot}`} aria-hidden />
          {LEVEL_LABEL[competition.level]}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {competition.applicantCount}
          <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
            {countLabel} gereageerd
          </span>
        </p>
      </div>

      <p className="flex items-center gap-2 text-sm font-medium">
        {competition.urgent && <Zap className="size-4 shrink-0 text-warning" aria-hidden />}
        {competition.headline}
      </p>
      <p className="text-xs text-muted-foreground">{competition.hint}</p>
    </div>
  );
}
