"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { verifyIdentity, type IdentityState } from "./actions";

export function IdentityForm() {
  const [state, formAction, isPending] = useActionState<IdentityState, FormData>(
    verifyIdentity,
    undefined,
  );

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
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        {isPending ? "Verifiëren…" : "Verifieer identiteit (iDIN)"}
      </Button>
    </form>
  );
}
