"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { runExpiryCheck, type ExpiryState } from "./actions";

export function ExpiryButton() {
  const [state, formAction, isPending] = useActionState<ExpiryState, FormData>(
    runExpiryCheck,
    undefined,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? "Bezig…" : "Verlopen certificaten verwerken"}
      </Button>
      {state?.ran && (
        <span className="text-sm text-muted-foreground">
          {(state.expired ?? 0) === 0 && (state.reminded ?? 0) === 0
            ? "Niets te doen: geen verlopen of bijna-verlopen certificaten."
            : [
                (state.expired ?? 0) > 0 ? `${state.expired} op verlopen gezet` : null,
                (state.reminded ?? 0) > 0 ? `${state.reminded} herinnering(en) verstuurd` : null,
              ]
                .filter(Boolean)
                .join(" · ") + "."}
        </span>
      )}
    </form>
  );
}
