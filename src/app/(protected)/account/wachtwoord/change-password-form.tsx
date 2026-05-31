"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changePassword, type ChangePasswordState } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ChangePasswordState | undefined, FormData>(
    changePassword,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Huidig wachtwoord"
        htmlFor="currentPassword"
        error={fe.currentPassword}
        required
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field
        label="Nieuw wachtwoord"
        htmlFor="newPassword"
        error={fe.newPassword}
        hint="Minstens 8 tekens."
        required
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field
        label="Herhaal nieuw wachtwoord"
        htmlFor="confirmPassword"
        error={fe.confirmPassword}
        required
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan…" : "Wachtwoord wijzigen"}
      </Button>
    </form>
  );
}
