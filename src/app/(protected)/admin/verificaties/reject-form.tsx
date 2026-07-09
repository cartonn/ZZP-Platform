"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type ResolveState } from "@/lib/actions/resolve-state";

type StateAction = (prev: ResolveState, formData: FormData) => Promise<ResolveState>;

/**
 * Goedkeuren-knop voor de verificatiequeue. Draait via de `ResolveState`-wrapper zodat een
 * (zeldzame) fout — bv. een dubbele indiening op een al-beoordeelde aanvraag ("Deze aanvraag is
 * al beoordeeld.") — **inline** verschijnt i.p.v. de error-boundary te triggeren (HTTP 500). De
 * server action (`verifyCredential`) blijft de bron van waarheid: auth → rol → transitie → audit.
 */
export function VerifyForm({ action }: { action: StateAction }) {
  const [state, formAction, pending] = useActionState<ResolveState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Goedkeuren"}
      </Button>
      {state && "error" in state ? (
        <p role="alert" className="text-destructive text-xs">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/**
 * Progressive disclosure voor afwijzen: standaard alleen een "Afwijzen…"-knop. Pas na klik
 * verschijnt het (verplichte) reden-veld + bevestigen. Zo blijft de wachtrij compact zolang de
 * admin nog beoordeelt. De server action (`rejectCredential`) dwingt de reden server-side
 * verplicht af; deze wrapper vangt die weigering (of een al-beoordeeld-race) op als een **inline**
 * foutmelding i.p.v. een 500/error-boundary — ook wanneer een client de HTML-`required` omzeilt.
 */
export function RejectForm({ action }: { action: StateAction }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ResolveState, FormData>(action, undefined);

  if (!open) {
    return (
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Afwijzen…
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="reject-reason" className="mb-1 block text-xs font-medium">
          Reden van afwijzing
        </label>
        <Textarea
          id="reject-reason"
          name="reason"
          rows={2}
          required
          minLength={3}
          maxLength={500}
          autoFocus
          placeholder="Verplicht bij afwijzen…"
        />
        {state && "error" in state ? (
          <p role="alert" className="text-destructive mt-1 text-xs">
            {state.error}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {pending ? "Bezig…" : "Bevestig afwijzing"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuleren
        </Button>
      </div>
    </form>
  );
}
