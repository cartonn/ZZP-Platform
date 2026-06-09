"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormStatus } from "@/components/ui/form-status";
import { saveApplicationNote, type ApplicationNoteState } from "./actions";

/**
 * Interne notitie bij een reactie. Geeft expliciete opgeslagen-/foutfeedback (FormStatus) i.p.v.
 * een stille submit — de opdrachtgever ziet bevestiging dat de notitie bewaard is.
 */
export function ApplicationNoteForm({
  appId,
  defaultNote,
}: {
  appId: string;
  defaultNote: string;
}) {
  const [state, formAction, isPending] = useActionState<ApplicationNoteState, FormData>(
    saveApplicationNote.bind(null, appId),
    undefined,
  );
  return (
    <form action={formAction} className="space-y-2">
      <Textarea
        name="note"
        rows={2}
        defaultValue={defaultNote}
        placeholder="Interne notitie (alleen voor jou)…"
        maxLength={2000}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
          {isPending ? "Opslaan…" : "Notitie opslaan"}
        </Button>
        <FormStatus success={state?.success} error={state?.error} />
      </div>
    </form>
  );
}
