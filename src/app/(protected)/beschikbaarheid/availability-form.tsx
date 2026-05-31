"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addAvailabilityWindow, type AvailabilityState } from "./actions";

export function AvailabilityForm() {
  const [state, formAction, isPending] = useActionState<AvailabilityState, FormData>(
    addAvailabilityWindow,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <h2 className="text-sm font-medium">Beschikbaarheid toevoegen</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Van" htmlFor="startDate" required error={fe.startDate}>
          <Input id="startDate" name="startDate" type="date" required />
        </Field>
        <Field label="Tot en met" htmlFor="endDate" required error={fe.endDate}>
          <Input id="endDate" name="endDate" type="date" required />
        </Field>
        <Field label="Type" htmlFor="type" error={fe.type}>
          <Select id="type" name="type" defaultValue="AVAILABLE">
            <option value="AVAILABLE">Beschikbaar</option>
            <option value="LIMITED">Beperkt beschikbaar</option>
            <option value="UNAVAILABLE">Niet beschikbaar</option>
          </Select>
        </Field>
        <Field label="Uren per week" htmlFor="hoursPerWeek" error={fe.hoursPerWeek}>
          <Input
            id="hoursPerWeek"
            name="hoursPerWeek"
            type="number"
            min={0}
            max={168}
            placeholder="bijv. 32"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notitie" htmlFor="note" error={fe.note}>
            <Input id="note" name="note" maxLength={200} placeholder="optioneel" />
          </Field>
        </div>
      </div>
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Toevoegen…" : "Toevoegen"}
        </Button>
        {state?.ok && <span className="text-sm text-success">Toegevoegd.</span>}
      </div>
    </form>
  );
}
