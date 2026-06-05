"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { uploadDocument, type DocumentState } from "./actions";
import { FormStatus } from "@/components/ui/form-status";

const KINDS = [
  ["OTHER", "Overig"],
  ["CREDENTIAL", "Credential"],
  ["VOG", "VOG"],
  ["INSURANCE", "Verzekering"],
  ["CONTRACT", "Contract"],
] as const;

export function DocumentForm() {
  const [state, formAction, isPending] = useActionState<DocumentState, FormData>(
    uploadDocument,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Reset het bestandsveld na een succesvolle upload.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <h2 className="text-sm font-semibold">Document uploaden</h2>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Type" htmlFor="kind" error={fe.kind}>
          <Select id="kind" name="kind" defaultValue="OTHER">
            {KINDS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Bestand"
          htmlFor="document"
          error={fe.document}
          hint="PDF, PNG, JPEG of WEBP, max 10 MB. Privé."
        >
          <Input
            id="document"
            name="document"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="h-auto py-1.5"
          />
        </Field>
      </div>
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Uploaden…" : "Uploaden"}
        </Button>
        <FormStatus success={state?.ok && "Geüpload."} />
      </div>
    </form>
  );
}
