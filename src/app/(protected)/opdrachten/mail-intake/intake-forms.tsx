"use client";

// Beslisformulieren voor de mail-intake-reviewqueue (idioom: admin/verificaties/reject-form.tsx).
// De server actions blijven de bron van waarheid (auth → ownership → overgangsmap → audit);
// deze wrappers tonen een weigering (bv. dubbel besliste aanvraag) inline i.p.v. een 500.

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

/** "Maak concept-opdracht": neemt de aanvraag over en stuurt door naar de nieuwe opdracht. */
export function AcceptIntakeForm({ action, intakeId }: { action: StateAction; intakeId: string }) {
  const [state, formAction, pending] = useActionState<ResolveState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="intakeId" value={intakeId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Maak concept-opdracht"}
      </Button>
      <InlineError state={state} />
    </form>
  );
}

/** Progressive disclosure voor afwijzen: pas na klik verschijnt het verplichte reden-veld. */
export function DismissIntakeForm({ action, intakeId }: { action: StateAction; intakeId: string }) {
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
      <input type="hidden" name="intakeId" value={intakeId} />
      <div className="flex-1">
        <label htmlFor={`dismiss-reason-${intakeId}`} className="mb-1 block text-xs font-medium">
          Reden van afwijzing
        </label>
        <Textarea
          id={`dismiss-reason-${intakeId}`}
          name="reason"
          rows={2}
          required
          minLength={3}
          maxLength={500}
          autoFocus
          placeholder="Verplicht bij afwijzen…"
        />
        <InlineError state={state} />
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

/** Heropent een afgewezen aanvraag (terug naar de wachtrij). */
export function ReopenIntakeForm({ action, intakeId }: { action: StateAction; intakeId: string }) {
  const [state, formAction, pending] = useActionState<ResolveState, FormData>(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="intakeId" value={intakeId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Heropenen"}
      </Button>
      <InlineError state={state} />
    </form>
  );
}
