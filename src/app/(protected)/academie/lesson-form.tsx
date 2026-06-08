"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { type AuthorState } from "./actions";

export interface LessonFormInitial {
  title: string;
  body: string;
  estimatedMinutes: string;
  order: string;
}

export function LessonForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: AuthorState, formData: FormData) => Promise<AuthorState>;
  initial?: LessonFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AuthorState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Titel" htmlFor="title" required error={fe.title}>
        <Input id="title" name="title" defaultValue={initial?.title} required maxLength={140} />
      </Field>
      <Field
        label="Inhoud"
        htmlFor="body"
        required
        error={fe.body}
        hint="Gewone tekst; lege regels worden behouden voor alinea's."
      >
        <Textarea id="body" name="body" defaultValue={initial?.body} rows={12} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Leesduur (min.)" htmlFor="estimatedMinutes" error={fe.estimatedMinutes}>
          <Input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min={1}
            max={600}
            defaultValue={initial?.estimatedMinutes}
            placeholder="bijv. 5"
          />
        </Field>
        <Field label="Volgorde" htmlFor="order" hint="Lager = eerder in de cursus">
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={initial?.order ?? "0"}
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : submitLabel}
        </Button>
        <FormStatus error={state?.error} />
      </div>
    </form>
  );
}
