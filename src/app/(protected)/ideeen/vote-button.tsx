"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleVote } from "./actions";

/**
 * Stem-knop met optimistic UI: de telling en de gestemde-staat schakelen direct bij klik, de
 * server-actie bevestigt op de achtergrond (server-side waarheid — bij een fout draait React het
 * optimistische beeld terug naar de echte props). Eén stem per persoon; klikken togglet.
 */
export function VoteButton({
  ideaId,
  count,
  hasVoted,
}: {
  ideaId: string;
  count: number;
  hasVoted: boolean;
}) {
  const [optimistic, applyOptimistic] = useOptimistic({ count, hasVoted }, (state) =>
    state.hasVoted
      ? { count: state.count - 1, hasVoted: false }
      : { count: state.count + 1, hasVoted: true },
  );
  const [, startTransition] = useTransition();

  return (
    <form
      className="shrink-0"
      action={() =>
        startTransition(async () => {
          applyOptimistic(undefined);
          await toggleVote(ideaId);
        })
      }
    >
      <button
        type="submit"
        aria-pressed={optimistic.hasVoted}
        aria-label={optimistic.hasVoted ? "Stem intrekken" : "Stem op dit idee"}
        className={cn(
          "focus-ring flex w-12 flex-col items-center gap-0.5 rounded-md border py-1.5 transition-colors",
          optimistic.hasVoted
            ? "border-primary bg-accent text-primary"
            : "border-border text-muted-foreground hover:border-foreground/40",
        )}
      >
        <ChevronUp className="size-4" aria-hidden />
        <span className="text-sm font-semibold tabular-nums">{optimistic.count}</span>
      </button>
    </form>
  );
}
