"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormStatus } from "@/components/ui/form-status";
import { decideActivation, type ActivationState } from "./actions";

/**
 * Beslisknoppen bij één wachtende aanmelding. Afwijzen vraagt eerst om een reden — die is ook
 * server-side verplicht (statusForActivation), dit veld is enkel de nette voorkant.
 */
export function ActivationForm({ tenantId }: { tenantId: string }) {
  const [state, action, pending] = useActionState<ActivationState, FormData>(
    decideActivation,
    undefined,
  );
  const [rejecting, setRejecting] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="tenantId" value={tenantId} />

      {rejecting && (
        <Field label="Reden van afwijzing" htmlFor={`reason-${tenantId}`} required>
          <Input
            id={`reason-${tenantId}`}
            name="reason"
            required
            maxLength={500}
            placeholder="Bijv. KvK-nummer komt niet overeen met de bureaunaam."
          />
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {rejecting ? (
          <>
            <Button
              type="submit"
              name="decision"
              value="REJECT"
              variant="danger"
              disabled={pending}
            >
              {pending ? "Bezig…" : "Afwijzen bevestigen"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
              Annuleren
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" name="decision" value="ACTIVATE" disabled={pending}>
              {pending ? "Bezig…" : "Activeren"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRejecting(true)}>
              Afwijzen
            </Button>
          </>
        )}
        <FormStatus success={state?.ok ? state.message : undefined} error={state?.error} />
      </div>
    </form>
  );
}
