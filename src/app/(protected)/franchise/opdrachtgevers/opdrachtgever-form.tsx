"use client";

import { useActionState } from "react";
import { createOpdrachtgever, type OpdrachtgeverState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function OpdrachtgeverForm() {
  const [state, action, pending] = useActionState<OpdrachtgeverState, FormData>(
    createOpdrachtgever,
    undefined,
  );
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Naam opdrachtgever"
          htmlFor="companyName"
          required
          error={fieldErrors.companyName}
        >
          <Input
            id="companyName"
            name="companyName"
            placeholder="Bijv. Verpleeghuis De Brug"
            required
          />
        </Field>
        <Field label="Locatie" htmlFor="location" error={fieldErrors.location}>
          <Input id="location" name="location" placeholder="Plaats" />
        </Field>
        <Field
          label="Contactpersoon"
          htmlFor="contactName"
          required
          error={fieldErrors.contactName}
        >
          <Input id="contactName" name="contactName" placeholder="Voor- en achternaam" required />
        </Field>
        <Field label="E-mail" htmlFor="email" required error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="naam@opdrachtgever.nl"
            required
          />
        </Field>
      </div>
      <Field
        label="Afdelingen"
        htmlFor="departments"
        hint="Optioneel — één afdeling per regel. Later toe te voegen op de detailpagina."
      >
        <Textarea
          id="departments"
          name="departments"
          rows={3}
          placeholder={"Geriatrie\nThuiszorg"}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Toevoegen…" : "Opdrachtgever toevoegen"}
        </Button>
        <FormStatus error={error} />
      </div>

      {state && "ok" in state && state.ok && (
        <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          <p className="font-medium text-success">{state.companyName} toegevoegd.</p>
          <p className="mt-1 text-muted-foreground">
            Deel deze inloggegevens veilig met de opdrachtgever. Hij wijzigt het wachtwoord bij de
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
