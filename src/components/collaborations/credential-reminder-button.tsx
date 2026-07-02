"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import {
  sendCredentialReminder,
  type ReminderState,
} from "@/app/(protected)/samenwerkingen/actions";
import { type CredentialType } from "@/lib/enums";
import { Button } from "@/components/ui/button";

/**
 * "Stuur herinnering" bij een ontbrekend/verlopen vereist certificaat (opdrachtgever-zicht).
 * De server bepaalt of het type écht openstaat en dwingt de dag-idempotentie af; deze knop
 * toont alleen de uitkomst. Geeft de waarschuwing handelingsperspectief.
 */
export function CredentialReminderButton({
  collaborationId,
  type,
}: {
  collaborationId: string;
  type: CredentialType;
}) {
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(
    sendCredentialReminder.bind(null, collaborationId, type),
    undefined,
  );

  return (
    <form action={formAction} className="mt-1.5">
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        <BellRing className="mr-1.5 size-3.5" aria-hidden />
        {pending ? "Bezig…" : "Stuur herinnering"}
      </Button>
      {state?.message && (
        <span className="ml-2 text-xs text-muted-foreground">{state.message}</span>
      )}
      {state?.error && <span className="ml-2 text-xs font-medium text-danger">{state.error}</span>}
    </form>
  );
}
