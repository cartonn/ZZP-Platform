"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cancelCollaboration, type CancelState } from "@/app/(protected)/samenwerkingen/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Annuleren met verplichte reden (symmetrisch, productbesluit 12-6-2026). De 7-dagen-kostenregel
// wordt hier alleen getóónd; de server beoordeelt en legt het oordeel vast (cancellationChargeable).
export function CancelCollaborationForm({
  collaborationId,
  chargeable,
  freeUntilLabel,
}: {
  collaborationId: string;
  /** Geldt er op dit moment een betalingsverplichting bij annuleren (opdrachtgever-zicht)? */
  chargeable: boolean;
  /** T/m wanneer is annuleren kosteloos (NL-datumlabel); null = geen kostenregel van toepassing. */
  freeUntilLabel: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CancelState, FormData>(
    cancelCollaboration.bind(null, collaborationId),
    undefined,
  );

  if (!open) {
    return (
      <Button type="button" size="sm" variant="destructive" onClick={() => setOpen(true)}>
        Annuleren
      </Button>
    );
  }

  const reasonId = `cancel-reason-${collaborationId}`;
  return (
    <form
      action={formAction}
      className="w-full space-y-2 rounded-md border border-danger/30 bg-danger/5 p-3"
    >
      <label htmlFor={reasonId} className="block text-xs font-medium">
        Reden van annulering (verplicht)
      </label>
      <Textarea
        id={reasonId}
        name="reason"
        rows={2}
        required
        minLength={5}
        maxLength={500}
        placeholder="Bijvoorbeeld: de dienst vervalt, of er is intern toch invulling gevonden."
        className="bg-background"
      />
      {chargeable ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          De start is binnen 7 dagen — annuleren is niet meer kosteloos; er geldt een
          betalingsverplichting.
        </p>
      ) : freeUntilLabel ? (
        <p className="text-xs text-muted-foreground">
          Kosteloos annuleren kan t/m {freeUntilLabel}.
        </p>
      ) : null}
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" variant="danger" disabled={pending}>
          {pending ? "Bezig…" : "Bevestig annulering"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Terug
        </Button>
      </div>
    </form>
  );
}
