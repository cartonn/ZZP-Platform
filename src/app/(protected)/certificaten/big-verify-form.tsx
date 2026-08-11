"use client";

import { useActionState } from "react";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Input } from "@/components/ui/input";
import { verifyCredentialViaBig, type ExternalVerifyState } from "./actions";

/** BIG-registerverificatie van een beroepsregistratie via het BIG-nummer. */
export function BigVerifyForm({ credentialId }: { credentialId: string }) {
  const action = verifyCredentialViaBig.bind(null, credentialId);
  const [state, formAction] = useActionState<ExternalVerifyState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="bigNumber"
        aria-label="BIG-nummer"
        inputMode="numeric"
        placeholder="BIG-nummer (11 cijfers)"
        className="h-8 max-w-48 text-sm"
      />
      <PendingSubmitButton variant="secondary" size="sm" watchdogMs={3000}>
        Verifieer via BIG-register
      </PendingSubmitButton>
      {state?.error && (
        <span role="alert" className="text-xs text-danger">
          {state.error}
        </span>
      )}
      {state?.ok && (
        <span role="status" className="text-xs text-success">
          BIG-registratie geverifieerd.
        </span>
      )}
    </form>
  );
}
