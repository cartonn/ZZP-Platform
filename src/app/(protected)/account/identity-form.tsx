"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { verifyIdentity, type IdentityState } from "./actions";
import { FormStatus } from "@/components/ui/form-status";

export function IdentityForm({ onResolved }: { onResolved?: () => void }) {
  const [state, formAction, isPending] = useActionState<IdentityState, FormData>(
    verifyIdentity,
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onResolved?.();
  }, [state, onResolved]);

  return (
    <form action={formAction} className="space-y-3">
      <Field
        label="Juridische naam"
        htmlFor="legalName"
        hint="Zoals geregistreerd bij je bank/DigiD."
      >
        <Input id="legalName" name="legalName" placeholder="Voor- en achternaam" required />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
          {isPending ? "Verifiëren…" : "Verifieer identiteit (iDIN)"}
        </Button>
        <FormStatus success={state?.ok && "Identiteit geverifieerd."} />
      </div>
    </form>
  );
}
