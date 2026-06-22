"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/locale-provider";
import { authenticate, type LoginState } from "./actions";

export function LoginForm() {
  const t = useT();
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label={t("E-mail")} htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="naam@bedrijf.nl"
        />
      </Field>

      <Field label={t("Wachtwoord")} htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("Bezig met inloggen…") : t("Inloggen")}
      </Button>
    </form>
  );
}
