"use client";

import { useActionState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<ForgotPasswordState | undefined, FormData>(
    requestPasswordReset,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  if (state?.submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle className="size-8 text-success" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Als het e-mailadres bij ons bekend is, ontvang je een e-mail met een herstelkoppeling.
          Controleer ook je spam/ongewenste-mailmap.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="E-mailadres" htmlFor="email" error={fe.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jouw@email.nl"
          required
        />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Versturen…" : "Herstelkoppeling sturen"}
      </Button>
    </form>
  );
}
