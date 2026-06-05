"use client";

import { useActionState, useState } from "react";
import { createDienst, type DienstState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { CheckChip } from "@/components/ui/check-chip";
import { CREDENTIAL_TYPES } from "@/lib/enums";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";

export interface OpdrachtgeverOption {
  id: string;
  name: string;
  departments: { id: string; name: string }[];
}

export function DienstForm({
  companies,
  skills,
}: {
  companies: OpdrachtgeverOption[];
  skills: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<DienstState, FormData>(createDienst, undefined);
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;

  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const departments = companies.find((c) => c.id === companyId)?.departments ?? [];

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Opdrachtgever" htmlFor="companyId" required>
          <Select id="companyId" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Afdeling" htmlFor="departmentId" required error={fieldErrors.departmentId}>
          <Select id="departmentId" name="departmentId" required>
            {departments.length === 0 ? (
              <option value="">Geen afdelingen — voeg er eerst een toe</option>
            ) : (
              departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            )}
          </Select>
        </Field>
      </div>
      <Field label="Titel" htmlFor="title" required error={fieldErrors.title}>
        <Input id="title" name="title" placeholder="Bijv. Nachtdienst verpleegkundige" required />
      </Field>
      <Field label="Omschrijving" htmlFor="description" required error={fieldErrors.description}>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Wat houdt de dienst in, welke eisen gelden er?"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Werkvorm" htmlFor="workMode">
          <Select id="workMode" name="workMode" defaultValue="ONSITE">
            <option value="ONSITE">Op locatie</option>
            <option value="HYBRID">Hybride</option>
            <option value="REMOTE">Op afstand</option>
          </Select>
        </Field>
        <Field label="Locatie" htmlFor="location">
          <Input id="location" name="location" placeholder="Plaats" />
        </Field>
        <Field label="Startdatum" htmlFor="startDate">
          <Input id="startDate" name="startDate" type="date" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarief vanaf (€/uur)" htmlFor="rateMin" error={fieldErrors.rateMin}>
          <Input
            id="rateMin"
            name="rateMin"
            type="number"
            inputMode="numeric"
            placeholder="bijv. 40"
          />
        </Field>
        <Field label="Tarief tot (€/uur)" htmlFor="rateMax" error={fieldErrors.rateMax}>
          <Input
            id="rateMax"
            name="rateMax"
            type="number"
            inputMode="numeric"
            placeholder="bijv. 55"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium">Gevraagde skills</legend>
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

      <fieldset>
        <legend className="mb-2 block text-sm font-medium">Vereiste certificaten</legend>
        <div className="flex flex-wrap gap-2">
          {CREDENTIAL_TYPES.map((t) => (
            <CheckChip key={t} name="credentialTypes" value={t} label={CREDENTIAL_TYPE_LABEL[t]} />
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || departments.length === 0}>
          {pending ? "Uitzetten…" : "Dienst uitzetten"}
        </Button>
        <FormStatus
          success={state && "ok" in state && state.ok ? `"${state.title}" uitgezet.` : undefined}
          error={error}
        />
      </div>
    </form>
  );
}
