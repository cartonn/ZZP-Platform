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
export type ApplicationNoteLabels = {
  placeholder: string;
  saving: string;
  save: string;
};

export function ApplicationNoteForm({
  appId,
  defaultNote,
  labels,
}: {
  appId: string;
  defaultNote: string;
  labels: ApplicationNoteLabels;
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
        placeholder={labels.placeholder}
        maxLength={2000}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
          {isPending ? labels.saving : labels.save}
        </Button>
        <FormStatus success={state?.success} error={state?.error} />
      </div>
    </form>
  );
}
