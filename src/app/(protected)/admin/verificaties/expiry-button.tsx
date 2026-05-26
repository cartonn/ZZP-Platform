"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { runExpiryCheck, type ExpiryState } from "./actions";

export function ExpiryButton() {
  const [state, formAction, isPending] = useActionState<ExpiryState, FormData>(runExpiryCheck, undefined);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? "Bezig…" : "Verlopen certificaten verwerken"}
      </Button>
      {state?.ran && (
        <span className="text-sm text-muted-foreground">
          {state.expired === 0 ? "Geen verlopen certificaten." : `${state.expired} certificaat(en) op verlopen gezet.`}
        </span>
      )}
    </form>
  );
}
