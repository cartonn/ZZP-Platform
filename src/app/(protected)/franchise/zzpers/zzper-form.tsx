"use client";

import { useActionState } from "react";
import { createZzper, type ZzperState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { CheckChip } from "@/components/ui/check-chip";

export function ZzperForm({ skills }: { skills: { id: string; name: string }[] }) {
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
        <Field label="Beschikbaarheid" htmlFor="availability" error={fieldErrors.availability}>
          <Select id="availability" name="availability" defaultValue="UNKNOWN">
            <option value="UNKNOWN">Onbekend</option>
            <option value="AVAILABLE">Beschikbaar</option>
            <option value="LIMITED">Beperkt</option>
            <option value="UNAVAILABLE">Niet beschikbaar</option>
          </Select>
        </Field>
      </div>

      <Field label="Korte omschrijving" htmlFor="bio" error={fieldErrors.bio}>
        <Textarea
          id="bio"
          name="bio"
          rows={2}
          placeholder="Ervaring, specialisatie of bijzonderheden — optioneel."
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium">Skills</legend>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen skills beschikbaar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <CheckChip key={s.id} name="skillIds" value={s.id} label={s.name} />
            ))}
          </div>
        )}
      </fieldset>

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
