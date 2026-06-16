"use client";

import { useActionState } from "react";
import {
  cancelShiftHandoff,
  type ShiftHandoffCancelState,
} from "@/app/(protected)/samenwerkingen/shift-handoff-actions";
import { Button } from "@/components/ui/button";

// De aanvragende ZZP'er trekt een nog-OPEN overname-aanvraag in (OPEN → CANCELLED). Klein
// client-formulier met useActionState zodat fouten inline verschijnen. Server is de waarheid.
export function ShiftHandoffCancelForm({ handoffId }: { handoffId: string }) {
  const [state, formAction, pending] = useActionState<ShiftHandoffCancelState, FormData>(
    cancelShiftHandoff.bind(null, handoffId),
    undefined,
  );

  if (state?.ok) {
    return <p className="text-xs font-medium text-muted-foreground">Aanvraag ingetrokken.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button type="submit" size="sm" variant="ghost" disabled={pending}>
        {pending ? "Bezig…" : "Intrekken"}
      </Button>
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
    </form>
  );
}
