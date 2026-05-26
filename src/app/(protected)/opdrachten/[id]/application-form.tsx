"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ApplyState } from "../actions";

export function ApplicationForm({
  action,
}: {
  action: (prev: ApplyState, formData: FormData) => Promise<ApplyState>;
}) {
  const [state, formAction, isPending] = useActionState<ApplyState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">Reageren op deze opdracht</h2>

      <Field label="Motivatie" htmlFor="motivation" required error={fe.motivation}>
        <Textarea id="motivation" name="motivation" rows={4} maxLength={2000} placeholder="Waarom past deze opdracht bij jou?" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tariefvoorstel (€/uur)" htmlFor="proposedRate" error={fe.proposedRate}>
          <Input id="proposedRate" name="proposedRate" type="number" min={0} max={2000} placeholder="bijv. 85" />
        </Field>
        <Field label="Beschikbaarheid" htmlFor="availability" error={fe.availability}>
          <Input id="availability" name="availability" placeholder="bijv. per 1 september, 32 uur" />
        </Field>
      </div>

      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Versturen…" : "Reactie versturen"}
      </Button>
    </form>
  );
}
