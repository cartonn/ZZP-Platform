"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { register, type RegisterState } from "./actions";

const ROLES = [
  { value: "FREELANCER", title: "ZZP'er", desc: "Ik zoek opdrachten en beheer mijn certificaten." },
  { value: "CLIENT", title: "Opdrachtgever", desc: "Ik plaats opdrachten en zoek ZZP'ers." },
] as const;

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    register,
    undefined,
  );
  const [role, setRole] = useState<"FREELANCER" | "CLIENT">("FREELANCER");
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1 block text-sm font-medium">Ik registreer als</legend>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={cn(
                "cursor-pointer rounded-md border p-3 text-sm transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                role === r.value ? "border-primary bg-accent" : "border-border hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block font-medium">{r.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{r.desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Naam" htmlFor="name" required error={fe.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          placeholder="Voor- en achternaam"
        />
      </Field>

      {role === "CLIENT" && (
        <Field label="Bedrijfsnaam" htmlFor="companyName" required error={fe.companyName}>
          <Input id="companyName" name="companyName" placeholder="Bedrijf B.V." />
        </Field>
      )}

      <Field label="E-mail" htmlFor="email" required error={fe.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="naam@bedrijf.nl"
        />
      </Field>

      <Field
        label="Wachtwoord"
        htmlFor="password"
        required
        hint="Minstens 8 tekens."
        error={fe.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
        />
      </Field>

      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Bezig…" : "Account aanmaken"}
      </Button>
    </form>
  );
}
