"use client";

// Beheer van het per-bedrijf intake-alias (plus-adres). Zelfde useActionState-idioom als de
// beslisformulieren: de server action is de bron van waarheid, fouten verschijnen inline.
// Vernieuwen/uitschakelen trekt het oude adres per direct in en gaat daarom achter een
// bevestigingsdialoog (ConfirmButton) — gedeelde adressen breken erdoor.

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { type ResolveState } from "@/lib/actions/resolve-state";

type StateAction = (prev: ResolveState, formData: FormData) => Promise<ResolveState>;

function InlineError({ state }: { state: ResolveState }) {
  if (!state || !("error" in state)) return null;
  return (
    <p role="alert" className="text-destructive text-xs">
      {state.error}
    </p>
  );
}

/** Eerste keer genereren van een intake-alias. */
export function CreateAliasForm({ action }: { action: StateAction }) {
  const [state, formAction, pending] = useActionState<ResolveState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Genereer intake-adres"}
      </Button>
      <InlineError state={state} />
    </form>
  );
}

/** Vernieuwen (oude adres vervalt per direct) — achter een bevestigingsdialoog. */
export function RotateAliasForm({ action }: { action: StateAction }) {
  const [state, formAction] = useActionState<ResolveState, FormData>(action, undefined);

  return (
    <div className="flex flex-col gap-1">
      <ConfirmButton
        action={formAction}
        title="Intake-adres vernieuwen?"
        description="Het huidige adres stopt per direct met werken. Deel het nieuwe adres opnieuw met je aanvragers."
        confirmLabel="Vernieuwen"
        triggerVariant="secondary"
      >
        Vernieuw adres
      </ConfirmButton>
      <InlineError state={state} />
    </div>
  );
}

/** Uitschakelen — daarna werkt alleen de afzender-match op het accountadres nog. */
export function DisableAliasForm({ action }: { action: StateAction }) {
  const [state, formAction] = useActionState<ResolveState, FormData>(action, undefined);

  return (
    <div className="flex flex-col gap-1">
      <ConfirmButton
        action={formAction}
        title="Intake-adres uitschakelen?"
        description="Mail aan het plus-adres wordt daarna niet meer aangenomen. Aanvragen vanaf je eigen account-e-mailadres blijven werken."
        confirmLabel="Uitschakelen"
        triggerVariant="ghost"
      >
        Schakel uit
      </ConfirmButton>
      <InlineError state={state} />
    </div>
  );
}
