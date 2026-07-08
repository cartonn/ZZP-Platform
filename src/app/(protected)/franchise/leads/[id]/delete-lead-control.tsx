"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLead } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="xs" disabled={pending}>
      <Trash2 className="size-3.5" aria-hidden />
      {pending ? "Bezig…" : "Lead verwijderen"}
    </Button>
  );
}

/**
 * Verwijderknop voor een lead (recht op wissen — AVG art. 17). Eigen mini-formulier gekoppeld aan de
 * `deleteLead`-server-action (die opnieuw auth → rol → tenant-ownership afdwingt). Vraagt om
 * bevestiging: de lead én het volledige contactlogboek (prospect-PII) worden definitief verwijderd.
 */
export function DeleteLeadControl({
  leadId,
  organizationName,
}: {
  leadId: string;
  organizationName: string;
}) {
  return (
    <form
      action={deleteLead.bind(null, leadId)}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Lead "${organizationName}" en het volledige contactlogboek definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Verwijdert de lead en alle vastgelegde contactgegevens definitief (AVG — recht op wissen).
      </p>
    </form>
  );
}
