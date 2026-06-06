"use client";

import { useActionState, useEffect, useRef } from "react";
import { createIdea, type IdeaFormState } from "./actions";
import { IDEA_AUDIENCES, IDEA_THEMES } from "@/lib/enums";
import { IDEA_AUDIENCE_LABEL, IDEA_THEME_LABEL } from "@/lib/ideas";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Doelgroep" htmlFor="audience">
          <Select id="audience" name="audience" defaultValue="PLATFORM">
            {IDEA_AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {IDEA_AUDIENCE_LABEL[a]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Thema" htmlFor="theme">
          <Select id="theme" name="theme" defaultValue="">
            <option value="">Geen specifiek thema</option>
            {IDEA_THEMES.map((t) => (
              <option key={t} value={t}>
                {IDEA_THEME_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
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
