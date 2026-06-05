"use client";

import { useActionState } from "react";
import { createZzper, type ZzperState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function ZzperForm() {
  const [state, action, pending] = useActionState<ZzperState, FormData>(createZzper, undefined);
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Naam" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" name="name" placeholder="Voor- en achternaam" required />
        </Field>
        <Field label="E-mail" htmlFor="email" required error={fieldErrors.email}>
          <Input id="email" name="email" type="email" placeholder="naam@zzper.nl" required />
        </Field>
        <Field label="Functie" htmlFor="headline" error={fieldErrors.headline}>
          <Input id="headline" name="headline" placeholder="Bijv. Verpleegkundige niveau 4" />
        </Field>
        <Field label="Locatie" htmlFor="location" error={fieldErrors.location}>
          <Input id="location" name="location" placeholder="Plaats" />
        </Field>
        <Field label="Uurtarief (€)" htmlFor="hourlyRate" error={fieldErrors.hourlyRate}>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            inputMode="numeric"
            placeholder="bijv. 45"
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Toevoegen…" : "ZZP'er toevoegen"}
        </Button>
        <FormStatus error={error} />
      </div>

      {state && "ok" in state && state.ok && (
        <div role="status" className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          <p className="font-medium text-success">{state.name} toegevoegd aan je roster.</p>
          <p className="mt-1 text-muted-foreground">
            Deel deze inloggegevens veilig met de ZZP&apos;er. Hij wijzigt het wachtwoord bij de
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
