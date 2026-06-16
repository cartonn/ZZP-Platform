"use client";

import { useActionState, useState } from "react";
import {
  rejectShiftHandoff,
  type ShiftHandoffRejectState,
} from "@/app/(protected)/admin/shift-overnames/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Afwijzing van een shift-overname-aanvraag (franchiser/admin). Reden verplicht — server-side
// afgedwongen; de ZZP'er ontvangt de reden als notificatie.
export function ShiftHandoffRejectForm({ handoffId }: { handoffId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ShiftHandoffRejectState, FormData>(
    rejectShiftHandoff.bind(null, handoffId),
    undefined,
  );

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Afwijzen
      </Button>
    );
  }

  const noteId = `handoff-reject-note-${handoffId}`;
  return (
    <form
      action={formAction}
      className="w-full space-y-2 rounded-md border border-border bg-muted/30 p-3"
    >
      <label htmlFor={noteId} className="block text-xs font-medium">
        Reden voor de afwijzing (verplicht)
      </label>
      <Textarea
        id={noteId}
        name="note"
        rows={2}
        required
        minLength={5}
        maxLength={500}
        placeholder="Bijvoorbeeld: voorgestelde overnemer voldoet niet aan de certificaateisen."
        className="bg-background"
      />
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
      {state?.ok ? (
        <p className="text-xs font-medium text-success">Aanvraag afgewezen.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant="destructive" disabled={pending}>
            {pending ? "Bezig…" : "Afwijzing bevestigen"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Terug
          </Button>
        </div>
      )}
    </form>
  );
}
