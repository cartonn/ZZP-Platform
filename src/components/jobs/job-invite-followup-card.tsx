import { Send } from "lucide-react";
import { LevelChip } from "@/components/jobs/signal-chips";
import { type InviteFollowup } from "@/lib/job-invite-followup";

type RenderTone = Exclude<InviteFollowup["tone"], "none">;

const TONE_STYLE: Record<RenderTone, { dot: string; hint: string }> = {
  good: { dot: "bg-success", hint: "text-success" },
  neutral: { dot: "bg-muted-foreground", hint: "text-muted-foreground" },
  warning: { dot: "bg-warning", hint: "text-warning" },
};

const TONE_LABEL: Record<RenderTone, string> = {
  good: "Goede respons",
  neutral: "In afwachting",
  warning: "Geen respons",
};

/**
 * Toont de eigenaar van een opdracht de opvolging van zijn directe uitnodigingen: hoeveel
 * uitgenodigde ZZP'ers reageerden en hoeveel nog wachten. Presentationeel — de opvolging is
 * server-side berekend (`summarizeInviteFollowup`); deze component beslist niets. Rendert alleen
 * wanneer er minstens één uitnodiging is verstuurd (tone ≠ "none").
 */
export function JobInviteFollowupCard({ followup }: { followup: InviteFollowup }) {
  if (followup.tone === "none") return null;
  const style = TONE_STYLE[followup.tone];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Send className="size-4" aria-hidden /> Opvolging uitnodigingen
        </p>
        <LevelChip dotClass={style.dot} label={TONE_LABEL[followup.tone]} />
      </div>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
          {followup.responded}
          <span className="text-muted-foreground">/{followup.invited}</span>
          <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
            gereageerd
          </span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{followup.pending}</span> nog in
            afwachting
          </span>
          {followup.oldestPendingDays !== null && followup.oldestPendingDays >= 1 && (
            <span>
              oudste{" "}
              <span className="font-medium text-foreground">{followup.oldestPendingDays}</span>{" "}
              {followup.oldestPendingDays === 1 ? "dag" : "dagen"} open
            </span>
          )}
        </div>
      </div>

      {followup.headline && <p className={`text-xs ${style.hint}`}>{followup.headline}</p>}

      <p className="text-xs text-muted-foreground">
        Reacties van ZZP&apos;ers die je direct hebt uitgenodigd — los van het algemene bereik.
      </p>
    </div>
  );
}
