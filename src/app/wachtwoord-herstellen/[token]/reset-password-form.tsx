"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPassword, type ResetPasswordState } from "./actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<ResetPasswordState | undefined, FormData>(
    resetPassword,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle className="size-8 text-success" aria-hidden />
        <p className="text-sm font-medium">Je wachtwoord is hersteld.</p>
        <p className="text-sm text-muted-foreground">
          Je kunt nu inloggen met je nieuwe wachtwoord.
        </p>
        <Link
          href="/login"
          className="mt-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Naar inloggen →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
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
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Opslaan…" : "Wachtwoord instellen"}
      </Button>
    </form>
  );
}
