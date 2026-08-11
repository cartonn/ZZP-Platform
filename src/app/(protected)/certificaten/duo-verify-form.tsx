"use client";

import { useActionState } from "react";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Input } from "@/components/ui/input";
import { verifyCredentialViaDuo, type DuoVerifyState } from "./actions";

/** DUO-verificatie van een diploma via de verificatiecode uit het DUO-diplomaregister. */
export function DuoVerifyForm({ credentialId }: { credentialId: string }) {
  const action = verifyCredentialViaDuo.bind(null, credentialId);
  const [state, formAction] = useActionState<DuoVerifyState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Input
        name="verificationCode"
        aria-label="DUO-verificatiecode"
        placeholder="DUO-XXXX-XXXX"
        className="h-8 max-w-48 text-sm"
      />
      <PendingSubmitButton variant="secondary" size="sm" watchdogMs={3000}>
        Verifieer via DUO
      </PendingSubmitButton>
      {state?.error && (
        <span role="alert" className="text-xs text-danger">
          {state.error}
        </span>
      )}
      {state?.ok && (
        <span role="status" className="text-xs text-success">
          Diploma geverifieerd via DUO.
        </span>
      )}
    </form>
  );
}
