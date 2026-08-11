"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { createOpdrachtgever, type OpdrachtgeverState } from "../actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

function CopyCreds({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
      <span className="truncate font-mono text-xs">
        {email} · {password}
      </span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(`${email} · ${password}`);
          setCopied(true);
        }}
        className="focus-ring inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
        {copied ? "Gekopieerd" : "Kopieer"}
      </button>
    </div>
  );
}

export interface OpdrachtgeverPrefill {
  companyName?: string;
  contactName?: string;
  email?: string;
  leadId?: string;
}

export function WizardOpdrachtgever({ prefill }: { prefill?: OpdrachtgeverPrefill }) {
  const [state, action, pending] = useActionState<OpdrachtgeverState, FormData>(
    createOpdrachtgever,
    undefined,
  );
  const fieldErrors = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};
  const error = state && "error" in state ? state.error : undefined;

  if (state && "ok" in state && state.ok) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
          <p className="font-medium text-success">{state.companyName} is aangemaakt.</p>
          <p className="mt-1 text-muted-foreground">
            Deel deze inloggegevens veilig met de opdrachtgever — hij wijzigt het wachtwoord bij de
            eerste login. Je ziet ze alleen nu.
          </p>
          <div className="mt-3">
            <CopyCreds email={state.email} password={state.tempPassword} />
          </div>
        </div>
        <Button asChild>
          <a href={`/franchise/opdrachtgevers/nieuw?stap=afdelingen&company=${state.companyId}`}>
            Volgende: afdelingen <ArrowRight className="size-4" aria-hidden />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {prefill?.leadId && <input type="hidden" name="leadId" value={prefill.leadId} />}
      {prefill?.leadId && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Gegevens overgenomen uit de lead. Bij aanmaken wordt de lead op{" "}
          <span className="font-medium text-foreground">Klant</span> gezet.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Naam opdrachtgever"
          htmlFor="companyName"
          required
          error={fieldErrors.companyName}
        >
          <Input
            id="companyName"
            name="companyName"
            placeholder="Bijv. Verpleeghuis De Brug"
            defaultValue={prefill?.companyName}
            required
          />
        </Field>
        <Field label="Locatie" htmlFor="location" error={fieldErrors.location}>
          <Input id="location" name="location" placeholder="Plaats" />
        </Field>
        <Field
          label="Contactpersoon"
          htmlFor="contactName"
          required
          error={fieldErrors.contactName}
        >
          <Input
            id="contactName"
            name="contactName"
            placeholder="Voor- en achternaam"
            defaultValue={prefill?.contactName}
            required
          />
        </Field>
        <Field label="E-mail" htmlFor="email" required error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="naam@opdrachtgever.nl"
            defaultValue={prefill?.email}
            required
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Aanmaken…" : "Aanmaken en verder"}
        </Button>
        <FormStatus error={error} />
      </div>
    </form>
  );
}
