"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createTicket, type TicketState } from "../actions";

export function NewTicketForm() {
  const [state, formAction, isPending] = useActionState<TicketState, FormData>(
    createTicket,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Onderwerp" htmlFor="subject" error={fe.subject} required>
        <Input id="subject" name="subject" placeholder="Bijv. Vraag over mijn factuur" required />
      </Field>
      <Field label="Je vraag" htmlFor="body" error={fe.body} required>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          placeholder="Beschrijf je vraag of probleem…"
        />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Versturen…" : "Vraag versturen"}
      </Button>
    </form>
  );
}
