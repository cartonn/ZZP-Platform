"use client";

import { useActionState, useState } from "react";
import {
  requestShiftHandoff,
  type ShiftHandoffRequestState,
} from "@/app/(protected)/samenwerkingen/shift-handoff-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Shift-overname aanvragen (huidige ZZP'er; productbesluit 16-6-2026). De ZZP'er kan een actieve inzet
// niet voortzetten en biedt deze ter overname aan. De franchiser/admin beoordeelt; goedkeuring legt
// alleen de beslissing vast — de herplaatsing (met eigen contract voor de overnemer) blijft een aparte
// stap. Server-side de waarheid.
export function ShiftHandoffForm({ collaborationId }: { collaborationId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ShiftHandoffRequestState, FormData>(
    requestShiftHandoff.bind(null, collaborationId),
    undefined,
  );

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Kan deze inzet niet voortzetten — bied aan ter overname
      </Button>
    );
  }

  const reasonId = `handoff-reason-${collaborationId}`;
  return (
    <form
      action={formAction}
      className="w-full space-y-2 rounded-md border border-border bg-muted/30 p-3"
    >
      <div className="space-y-1">
        <label htmlFor={reasonId} className="block text-xs font-medium">
          Waarom kun je deze inzet niet voortzetten? (verplicht)
        </label>
        <Textarea
          id={reasonId}
          name="reason"
          rows={2}
          required
          minLength={5}
          maxLength={500}
          placeholder="Bijvoorbeeld: langdurige ziekte, of een conflict in de planning."
          className="bg-background"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Een beheerder of franchiser beoordeelt je aanvraag. Een goedkeuring betekent niet dat de
        inzet automatisch wordt overgedragen: de herplaatsing verloopt via de gebruikelijke stap,
        waarbij de overnemer een eigen contract krijgt.
      </p>
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
      {state?.ok ? (
        <p className="text-xs font-medium text-success">
          Aanvraag ingediend — je hoort het zodra een beheerder heeft beoordeeld.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant="primary" disabled={pending}>
            {pending ? "Bezig…" : "Aanvraag indienen"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Terug
          </Button>
        </div>
      )}
    </form>
  );
}
