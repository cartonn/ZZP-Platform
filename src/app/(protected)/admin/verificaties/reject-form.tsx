"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Progressive disclosure voor afwijzen: standaard alleen een "Afwijzen…"-knop. Pas na klik
 * verschijnt het (verplichte) reden-veld + bevestigen. Zo blijft de wachtrij compact zolang de
 * admin nog beoordeelt. De server action (`rejectCredential`) dwingt de reden server-side
 * verplicht af — dit is puur UI en verandert niets aan die keten.
 */
export function RejectForm({
  credentialId,
  action,
}: {
  credentialId: string;
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Afwijzen…
      </Button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor={`reason-${credentialId}`} className="mb-1 block text-xs font-medium">
          Reden van afwijzing
        </label>
        <Textarea
          id={`reason-${credentialId}`}
          name="reason"
          rows={2}
          required
          minLength={3}
          maxLength={500}
          autoFocus
          placeholder="Verplicht bij afwijzen…"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm">
          Bevestig afwijzing
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuleren
        </Button>
      </div>
    </form>
  );
}
