"use client";

import { useActionState, useEffect, useRef } from "react";
import { createIdea, type IdeaFormState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function IdeaForm() {
  const [state, action, pending] = useActionState<IdeaFormState, FormData>(createIdea, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Na een geslaagde indiening het formulier leegmaken.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <Field label="Titel" htmlFor="title" required error={state?.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          placeholder="Kort en duidelijk — wat stel je voor?"
          required
        />
      </Field>
      <Field
        label="Toelichting"
        htmlFor="description"
        required
        error={state?.fieldErrors?.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Wat is het idee, en waarom zou het helpen?"
          required
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Indienen…" : "Idee indienen"}
        </Button>
        <FormStatus
          success={state?.ok ? "Idee ingediend — bedankt." : undefined}
          error={state?.error}
        />
      </div>
    </form>
  );
}
