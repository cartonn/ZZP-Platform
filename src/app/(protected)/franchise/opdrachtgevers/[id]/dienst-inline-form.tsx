"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { publishDienst, type DienstInlineState } from "../actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

/**
 * Dienst uitzetten vanuit de opdrachtgever-cockpit, gebonden aan één afdeling. Standaard ingeklapt
 * (een `<details>`-blok), zodat een opdrachtgever met meerdere afdelingen overzichtelijk blijft.
 */
export function DienstInlineForm({ departmentId }: { departmentId: string }) {
  const [state, action, pending] = useActionState<DienstInlineState, FormData>(
    publishDienst.bind(null, departmentId),
    undefined,
  );
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;
  const success = state && "ok" in state && state.ok ? `"${state.title}" uitgezet.` : undefined;

  return (
    <details className="group mt-2">
      <summary className="focus-ring inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-foreground hover:underline">
        <Plus className="size-3.5" aria-hidden /> Dienst uitzetten
      </summary>
      <form
        action={action}
        className="mt-3 space-y-3 rounded-md border border-border bg-muted/30 p-3"
      >
        <Field label="Titel" htmlFor={`title-${departmentId}`} required error={fieldErrors.title}>
          <Input
            id={`title-${departmentId}`}
            name="title"
            placeholder="Bijv. Nachtdienst verpleegkundige"
            required
          />
        </Field>
        <Field
          label="Omschrijving"
          htmlFor={`description-${departmentId}`}
          required
          error={fieldErrors.description}
        >
          <Textarea
            id={`description-${departmentId}`}
            name="description"
            rows={2}
            placeholder="Wat houdt de dienst in, welke eisen gelden er?"
            required
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Werkvorm" htmlFor={`workMode-${departmentId}`}>
            <Select id={`workMode-${departmentId}`} name="workMode" defaultValue="ONSITE">
              <option value="ONSITE">Op locatie</option>
              <option value="HYBRID">Hybride</option>
              <option value="REMOTE">Op afstand</option>
            </Select>
          </Field>
          <Field label="Locatie" htmlFor={`location-${departmentId}`}>
            <Input id={`location-${departmentId}`} name="location" placeholder="Plaats" />
          </Field>
          <Field label="Startdatum" htmlFor={`startDate-${departmentId}`}>
            <Input id={`startDate-${departmentId}`} name="startDate" type="date" />
          </Field>
        </div>
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
