"use client";

import { useState } from "react";
import { IDEA_TRANSITIONS, type IdeaStatus } from "@/lib/enums";
import { IDEA_STATUS_LABEL, ideaStatusRequiresReason } from "@/lib/ideas";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { setIdeaStatus } from "./actions";

/**
 * Beheerder zet de status van een idee — alleen geldige overgangen (incl. de huidige status).
 * Kiest hij "Afwijzen", dan verschijnt een verplicht redenveld (de server dwingt het ook af).
 */
export function StatusControl({
  ideaId,
  status,
  title,
}: {
  ideaId: string;
  status: IdeaStatus;
  title: string;
}) {
  const [selected, setSelected] = useState<IdeaStatus>(status);
  const options: IdeaStatus[] = [status, ...IDEA_TRANSITIONS[status]];
  const needsReason = ideaStatusRequiresReason(selected) && selected !== status;

  return (
    <form
      action={setIdeaStatus.bind(null, ideaId)}
      className="mt-3 space-y-2 border-t border-border pt-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Status:</span>
        <Select
          name="status"
          defaultValue={status}
          onChange={(e) => setSelected(e.target.value as IdeaStatus)}
          aria-label={`Status van idee: ${title}`}
          className="h-8 max-w-40 text-sm"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {IDEA_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <PendingSubmitButton size="xs" variant="secondary" watchdogMs={3000}>
          Opslaan
        </PendingSubmitButton>
      </div>
      {needsReason && (
        <Textarea
          name="reason"
          rows={2}
          required
          aria-label="Reden voor afwijzing"
          placeholder="Reden voor afwijzing — dit zien de indiener en de stemmers."
          className="text-sm"
        />
      )}
    </form>
  );
}
