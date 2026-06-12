"use client";

import { useActionState, useState } from "react";
import {
  reportNoShow,
  type NoShowReportState,
} from "@/app/(protected)/samenwerkingen/no-show-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// No-show melden (opdrachtgever; productbesluit 12-6-2026). De reden gaat direct als notificatie
// naar de ZZP'er; de admin beoordeelt daarna gegrond/ongegrond. Server-side de waarheid.
export function NoShowReportForm({ collaborationId }: { collaborationId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<NoShowReportState, FormData>(
    reportNoShow.bind(null, collaborationId),
    undefined,
  );

  if (!open) {
    return (
      <Button type="button" size="sm" variant="destructive" onClick={() => setOpen(true)}>
        No-show melden
      </Button>
    );
  }

  const reasonId = `no-show-reason-${collaborationId}`;
  const dateId = `no-show-date-${collaborationId}`;
  return (
    <form
      action={formAction}
      className="w-full space-y-2 rounded-md border border-warning/40 bg-warning/5 p-3"
    >
      <div className="space-y-1">
        <label htmlFor={dateId} className="block text-xs font-medium">
          Dag van de gemiste dienst
        </label>
        <input
          id={dateId}
          name="occurredOn"
          type="date"
          required
          className="focus-ring h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={reasonId} className="block text-xs font-medium">
          Reden zoals de ZZP&apos;er die opgaf (verplicht)
        </label>
        <Textarea
          id={reasonId}
          name="reason"
          rows={2}
          required
          minLength={5}
          maxLength={500}
          placeholder="Bijvoorbeeld: ziekte gemeld om 06:00, of geen bericht ontvangen."
          className="bg-background"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        De ZZP&apos;er ontvangt deze melding direct; een beheerder beoordeelt of de reden gegrond
        is. Alleen ongegronde no-shows tellen mee richting uitschrijving.
      </p>
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
      {state?.ok ? (
        <p className="text-xs font-medium text-success">No-show geregistreerd.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant="primary" disabled={pending}>
            {pending ? "Bezig…" : "Melding registreren"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Terug
          </Button>
        </div>
      )}
    </form>
  );
}
