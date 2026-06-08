"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { COURSE_AUDIENCES } from "@/lib/enums";
import { COURSE_AUDIENCE_LABEL } from "@/lib/academy";
import { type AuthorState } from "./actions";

export interface CourseFormInitial {
  title: string;
  summary: string;
  audience: string;
  level: string;
  order: string;
}

export function CourseForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: AuthorState, formData: FormData) => Promise<AuthorState>;
  initial?: CourseFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AuthorState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Titel" htmlFor="title" required error={fe.title}>
        <Input id="title" name="title" defaultValue={initial?.title} required maxLength={140} />
      </Field>
      <Field label="Korte omschrijving" htmlFor="summary" required error={fe.summary}>
        <Textarea
          id="summary"
          name="summary"
          defaultValue={initial?.summary}
          rows={2}
          required
          maxLength={400}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Doelgroep" htmlFor="audience">
          <Select id="audience" name="audience" defaultValue={initial?.audience ?? "FREELANCER"}>
            {COURSE_AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {COURSE_AUDIENCE_LABEL[a]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Niveau" htmlFor="level">
          <Select id="level" name="level" defaultValue={initial?.level ?? ""}>
            <option value="">Geen</option>
            <option value="BEGINNER">Beginner</option>
            <option value="GEVORDERD">Gevorderd</option>
          </Select>
        </Field>
        <Field label="Volgorde" htmlFor="order" hint="Lager = hoger in de lijst">
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
