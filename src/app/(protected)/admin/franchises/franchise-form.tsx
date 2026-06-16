"use client";

import { useActionState } from "react";
import { createFranchise, type FranchiseState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function FranchiseForm() {
  const [state, action, pending] = useActionState<FranchiseState, FormData>(
    createFranchise,
    undefined,
  );
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;

  return (
    <form action={action} className="space-y-4">
      <Field label="Bemiddeling-naam" htmlFor="tenantName" required error={fieldErrors.tenantName}>
        <Input
          id="tenantName"
          name="tenantName"
          placeholder="Bijv. Zorgbemiddeling Noord"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Naam bemiddelaar"
          htmlFor="franchiserName"
          required
          error={fieldErrors.franchiserName}
        >
          <Input
            id="franchiserName"
            name="franchiserName"
            placeholder="Voor- en achternaam"
            required
          />
        </Field>
        <Field
          label="E-mail bemiddelaar"
          htmlFor="franchiserEmail"
          required
          error={fieldErrors.franchiserEmail}
        >
          <Input
            id="franchiserEmail"
            name="franchiserEmail"
            type="email"
            placeholder="naam@franchise.nl"
            required
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Aanmaken…" : "Bemiddeling aanmaken"}
        </Button>
        <FormStatus error={error} />
      </div>

      {state && "ok" in state && state.ok && (
        <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          <p className="font-medium text-success">
            Bemiddeling &quot;{state.tenantName}&quot; aangemaakt.
          </p>
          <p className="mt-1 text-muted-foreground">
            Deel deze inloggegevens veilig met de bemiddelaar. Hij wijzigt het wachtwoord bij de
            eerste login.
          </p>
          <p className="mt-2 font-mono text-xs">
            {state.email} · {state.tempPassword}
          </p>
        </div>
      )}
    </form>
  );
}
