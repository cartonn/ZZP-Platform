"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { register, type RegisterState } from "./actions";

const ROLES = [
  { value: "FREELANCER", title: "ZZP'er", desc: "Ik zoek opdrachten en beheer mijn certificaten." },
  { value: "CLIENT", title: "Opdrachtgever", desc: "Ik plaats opdrachten en zoek ZZP'ers." },
  {
    value: "FRANCHISER",
    title: "Bemiddelingsbureau",
    desc: "Ik bemiddel ZZP'ers naar opdrachtgevers.",
  },
] as const;

type RegisterRole = (typeof ROLES)[number]["value"];

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    register,
    undefined,
  );
  const [role, setRole] = useState<RegisterRole>("FREELANCER");
  const fe = state?.fieldErrors ?? {};
  const isBureau = role === "FRANCHISER";

  return (
    <form action={formAction} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1 block text-sm font-medium">Ik registreer als</legend>
        <div className="grid gap-2 sm:grid-cols-3">
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

      {isBureau && (
        <>
          <Field label="Bureaunaam" htmlFor="bureauName" required error={fe.bureauName}>
            <Input
              id="bureauName"
              name="bureauName"
              required
              placeholder="Bijv. Zorgbemiddeling Noord"
            />
          </Field>
          <Field
            label="KvK-nummer"
            htmlFor="kvkNumber"
            required
            hint="8 cijfers."
            error={fe.kvkNumber}
          >
            <Input
              id="kvkNumber"
              name="kvkNumber"
              inputMode="numeric"
              required
              placeholder="12345678"
            />
          </Field>
        </>
      )}

      <Field label={isBureau ? "Contactpersoon" : "Naam"} htmlFor="name" required error={fe.name}>
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

      {isBureau && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefoon" htmlFor="phone" error={fe.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="06 12345678"
            />
          </Field>
          <Field label="Werkgebied" htmlFor="region" error={fe.region}>
            <Input id="region" name="region" placeholder="Bijv. Noord-Holland" />
          </Field>
        </div>
      )}

      {state?.success && (
        <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          {state.success}{" "}
          <Link href="/login" className="font-medium underline underline-offset-2">
            Inloggen
          </Link>
        </p>
      )}

      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      {role === "FREELANCER" && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Het platformabonnement geldt alleen in maanden waarin je via het platform werkt — geen
          opdracht, geen kosten.
        </p>
      )}

      {isBureau && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          We controleren je aanmelding handmatig. Je kunt daarna inloggen; je werkplek opent zodra
          de aanmelding is goedgekeurd — doorgaans binnen 2 werkdagen.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Bezig…" : isBureau ? "Bureau aanmelden" : "Account aanmaken"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Door een account aan te maken ga je akkoord met de{" "}
        <Link href="/voorwaarden" className="underline underline-offset-2 hover:text-foreground">
          algemene voorwaarden
        </Link>{" "}
        en bevestig je de{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          privacyverklaring
        </Link>{" "}
        te hebben gelezen.
      </p>
    </form>
  );
}
