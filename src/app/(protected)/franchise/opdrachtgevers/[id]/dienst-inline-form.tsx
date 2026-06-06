"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { publishDienst, type DienstInlineState } from "../actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { CheckChip } from "@/components/ui/check-chip";
import { CREDENTIAL_TYPES } from "@/lib/enums";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";

/**
 * Dienst uitzetten vanuit de opdrachtgever-cockpit, gebonden aan één afdeling. Standaard ingeklapt
 * (een `<details>`-blok), zodat een opdrachtgever met meerdere afdelingen overzichtelijk blijft.
 * Dezelfde rijkdom als de wizard/diensten-pagina: tarief, gevraagde skills en vereiste certificaten.
 */
export function DienstInlineForm({
  departmentId,
  skills,
}: {
  departmentId: string;
  skills: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<DienstInlineState, FormData>(
    publishDienst.bind(null, departmentId),
    undefined,
  );
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;
  const success = state && "ok" in state && state.ok ? `"${state.title}" uitgezet.` : undefined;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) formRef.current?.reset();
  }, [state]);

  const id = (field: string) => `${field}-${departmentId}`;

  return (
    <details className="group mt-2">
      <summary className="focus-ring inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-foreground hover:underline">
        <Plus className="size-3.5" aria-hidden /> Dienst uitzetten
      </summary>
      <form
        ref={formRef}
        action={action}
        className="mt-3 space-y-3 rounded-md border border-border bg-muted/30 p-3"
      >
        <Field label="Titel" htmlFor={id("title")} required error={fieldErrors.title}>
          <Input
            id={id("title")}
            name="title"
            placeholder="Bijv. Nachtdienst verpleegkundige"
            required
          />
        </Field>
        <Field
          label="Omschrijving"
          htmlFor={id("description")}
          required
          error={fieldErrors.description}
        >
          <Textarea
            id={id("description")}
            name="description"
            rows={2}
            placeholder="Wat houdt de dienst in, welke eisen gelden er?"
            required
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Werkvorm" htmlFor={id("workMode")}>
            <Select id={id("workMode")} name="workMode" defaultValue="ONSITE">
              <option value="ONSITE">Op locatie</option>
              <option value="HYBRID">Hybride</option>
              <option value="REMOTE">Op afstand</option>
            </Select>
          </Field>
          <Field label="Locatie" htmlFor={id("location")}>
            <Input id={id("location")} name="location" placeholder="Plaats" />
          </Field>
          <Field label="Startdatum" htmlFor={id("startDate")}>
            <Input id={id("startDate")} name="startDate" type="date" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tarief vanaf (€/uur)" htmlFor={id("rateMin")} error={fieldErrors.rateMin}>
            <Input
              id={id("rateMin")}
              name="rateMin"
              type="number"
              inputMode="numeric"
              placeholder="bijv. 40"
            />
          </Field>
          <Field label="Tarief tot (€/uur)" htmlFor={id("rateMax")} error={fieldErrors.rateMax}>
            <Input
              id={id("rateMax")}
              name="rateMax"
              type="number"
              inputMode="numeric"
              placeholder="bijv. 55"
            />
          </Field>
        </div>
        {skills.length > 0 && (
          <fieldset>
            <legend className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Gevraagde skills
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <CheckChip key={s.id} name="skillIds" value={s.id} label={s.name} />
              ))}
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Vereiste certificaten
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {CREDENTIAL_TYPES.map((t) => (
              <CheckChip
                key={t}
                name="credentialTypes"
                value={t}
                label={CREDENTIAL_TYPE_LABEL[t]}
              />
            ))}
          </div>
        </fieldset>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Uitzetten…" : "Uitzetten"}
          </Button>
          <FormStatus success={success} error={error} />
        </div>
      </form>
    </details>
  );
}
